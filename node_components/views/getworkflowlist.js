const axios = require("axios");
const userpermissions = require("../userpermissions");
const moment = require('moment');

//as many clients can poll this parallel, we cache some stuff that is heavy
var m_ticket_cache = { last_update: null, tickets: [] };
var m_history_cache = { last_update: null, data: [] };
var m_busy = false;
var m_req_count = 0;

module.exports = async function (app, passport) {
    app.get('/review', async (req, res) => {

        var response = await axios.get(build_new_api_url("/review"), { timeout: 7000, agent: false, maxSockets: Infinity });
        var parsed = response.data;
        var username = "";
        if (req.user) {
            username = req.user["local"]["username"];
        } else {
            res.json(parsed);
            return;
        }

        var filtered = [];
        for (var i=0; i< parsed.length;i++){
            try{
                if (await userpermissions.checkworkflowpermission(username, parsed[i].workflow.wf_name)){
                    filtered.push(parsed[i] )
                }
            }catch(ex){
                console.error("Error in /review getting user permission",ex);
            }
        }

        res.json(filtered);
    })

    app.get('/getworkflowjobcount', async (req, res) => {
        
        m_req_count++;
        try {
            //counts jobs based on user permissions
            var username = "";
            if (req.user)
                username = req.user["local"]["username"];

            //get filtered list of workflow names
            var all_permissions = await userpermissions.getpermissionlistAsync(username);
            var all_workflows = await global.jobfetcher.getWorkflowList();//await axios.get(build_new_api_url("/workflows"), { timeout: 7000, agent: false, maxSockets: Infinity });
            var allowed_workflows = getPermittedWorkflowList(all_permissions, all_workflows);
            var allowed_wfnames = allowed_workflows.map(wf => wf.wf_name); //objects to name array

            //ask database for success,error,cancelled 
            async function countDocs(_state, since_days, wf_names) {
                var targetDate = moment(new Date()).subtract(since_days, 'day').format("YYYY-MM-DD 00:00:00"); // date object
                //beware, we filter on current workflows, means if a wf is deleted, it is also not in count anymore and remains forever i db
                var daCount = await global.db.jobs.countDocuments({ state: _state, job_start: { $gte: targetDate }, workflow: { $in: wf_names }}, { _id: 1 })
                return daCount;
            }

            var countObj = { sys: { "Success": 0, "Error": 0, "Cancelled": 0, "Incoming": 0, "Queued": 0, "Running": 0 } };

            if (!m_busy && (!m_history_cache.data || (((new Date) - m_history_cache.last_update) > 5000))) {
                //cache expired or first run - grab data from database.
                //counting in db can take ages and this api can be polled parallel many times, thats why we cache
                m_busy = true;
                for (var _state of ["Success", "Error", "Cancelled"]) {
                    countObj.sys[_state] = await countDocs(_state, global.config.STATIC_HEADER_JOB_COUNT_DAYS, allowed_wfnames);
                }
                m_busy = false;
                m_history_cache.data = countObj;
                m_history_cache.last_update = new Date();
            } else {
                if (!m_history_cache.data) {
                    logerror("Cache is empty and database busy, getworkflowjobcount will report zero. This should only happen at first run!");
                } else {
                    //serve history coutns from cache
                    countObj = m_history_cache.data;
                }
            }


            try {
                //ask tickets api for incoming, queued, running

                    if (!m_ticket_cache.tickets || (((new Date) - m_ticket_cache.last_update) > 5000)) {
                       
                        m_ticket_cache.tickets = m_ticket_cache.tickets = await global.jobfetcher.tickets();
                        
                    }
                    //apply user permissions to incoming and queued
                    var incoming_wfnames = m_ticket_cache.tickets.incoming.map(_tick => _tick.internal_wf_name); //list of workflow names (same name can repeat in the list)
                    var queued_wfnames = m_ticket_cache.tickets.queued.map(_tick => _tick.internal_wf_name);
                    var running_wfnames = m_ticket_cache.tickets.running.map(_tick => _tick.internal_wf_name);
                    function is_allowed(to_check, all_allowed) {
                        return all_allowed.some(_wf => _wf.wf_name == to_check)
                    }
                    var incoming_filtered = incoming_wfnames.filter(_name => is_allowed(_name, allowed_workflows));
                    var queued_filtered = queued_wfnames.filter(_name => is_allowed(_name, allowed_workflows));
                    var running_filtered = running_wfnames.filter(_name => is_allowed(_name, allowed_workflows));
                    //enrich countObj with incoming and queued
                    countObj.sys.Incoming = incoming_filtered.length;
                    countObj.sys.Queued = queued_filtered.length;
                    countObj.sys.Running = running_filtered.length;
                


            } catch (exc) {
                console.error("Fatal error counting incoming jobs", exc)
            }

            try {
                //REVIEW
                countObj.sys.Review = 0;
                var review_wfnames = m_ticket_cache.tickets.review.map(_tick => _tick.wf_name);
                function is_allowed(to_check, all_allowed) {
                    var a = all_allowed.some(_wf => _wf.wf_name == to_check);
                    return a;
                }
                var review_filtered = review_wfnames.filter(_name => is_allowed(_name, allowed_workflows));
                countObj.sys.Review = review_filtered.length;
                //var review_wfnames    = m_ticket_cache.tickets.review.map(_tick => _tick.wf_name);


            } catch (ex) {

            }

            res.json(countObj);//output json array to client
            return;
        } catch (ex) {
            console.log("ERROR: error in getworkflowjobcount: " + ex);
            res.status(500);//Send error response here
            res.end();
            return;
        } finally {
            m_busy = false;
        }

    });

    app.get('/getworkflowlist', async (req, res) => {
        try {

            if (req.method === 'GET' || req.method === 'POST') {
                passport.authenticate('local-login');//fills req.user with infos from cookie
                
                var workflowResponse = await axios.get(build_new_api_url("/workflows"), { timeout: 7000, agent: false, maxSockets: Infinity });
                //disabled web security, show all worfklows
                if (global.config.STATIC_USE_WEB_AUTHENTIFICATION + "" == "false") {
                    //console.log(workflowResponse["data"]);
                    res.writeHead(200, { "Content-Type": "application/JSON" });
                    res.write(JSON.stringify(workflowResponse["data"]));//output json array to client
                    res.end();
                    return;
                }

                //apply filter if any
                var workflowlist = workflowResponse["data"];
                var filteredWorkflowList = [];
                var alreadyAdded = {};
                //console.log(req.user);
                var allpermissions = await userpermissions.getpermissionlistAsync(req.user["local"]["username"]);

                try {
                    filteredWorkflowList = getPermittedWorkflowList(allpermissions, workflowResponse);

                } catch (ex) {
                    console.error("ERROR: error in getworkflowlist: " + ex);
                    res.status(500);//Send error response here
                    res.end();
                    return;
                }

                //    !!!!! //output all worfklows if something is wrong -- CHANGED to output no workflow if filters return none !!!!!
                //    if (filteredWorkflowList.length == 0){
                //        //output all workflows
                //         console.warn("Workflow Filter for user " + req.user["local"]["username"] + " returned 0 workflows, serving all workflows");
                //         console.warn(filteredWorkflowList)
                //         res.writeHead(200,{"Content-Type" : "application/JSON"});
                //         res.write(JSON.stringify(workflowlist));//output json array to client
                //         res.end();
                //         return;
                //    }

                //finally output filtered list 
                console.log("serving filtered workflow list")
                workflowlist["workflows"] = filteredWorkflowList;
                res.writeHead(200, { "Content-Type": "application/JSON" });
                res.write(JSON.stringify(workflowlist));//output json array to client
                res.end();


            } else {
                res.writeHead(401, { "Content-Type": "text/html" });
                res.write("Method not supported");//output json array to client
                res.end();
            }
        }
        catch (ex) {
            console.log("ERROR: unxepected error in getworkflowlist: " + ex);
            if ("response" in ex) //its an axios error
                res.status(500).send(ex.response.data);
            else
                res.status(500).send(ex.toString());
        }
    });
}

/* HELPERS */
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function build_new_api_url(what) {
    var host = global.config["STATIC_API_HOST"];
    var port = global.config["STATIC_API_NEW_PORT"];
    var protocol = global.config.STATIC_WEBSERVER_ENABLE_HTTPS == "true" ? "https://" : "http://";
    return protocol + host + ":" + port + what;
}

function hashCode(string) {
    //this creates a hash from a stringified object, it is used to workaround and create missing jobids from ffastrans version 0.9.3
    var hash = 0, i, chr;
    if (string.length === 0) return hash;
    for (i = 0; i < string.length; i++) {
        chr = string.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

function getPermittedWorkflowList(allPermissions, workflowResponse) {
    var workflowlist = workflowResponse["data"];
    var filteredWorkflowList = [];
    var alreadyAdded = {};
    var have_filter = false;
    if (global.config.STATIC_USE_WEB_AUTHENTIFICATION + "" == "false") {
        //no auth means everyone sees everything
        return workflowlist.workflows;
    }
    for (x in allPermissions) {
        //TODO: instead of filterin on our own, use userpermissions.js checkworkflowpermission

        //FILTER WORFKLOWS
        if (allPermissions[x]["key"] == "FILTER_WORKFLOW_GROUP") {
            have_filter = true;
            var filter = allPermissions[x]["value"]["filter"];
            for (var i in workflowlist["workflows"]) {
                var wf = workflowlist["workflows"][i];
                if (wf["wf_folder"].toLowerCase().match(filter.toLowerCase())) {
                    if (!alreadyAdded[wf["wf_name"]]) {
                        //console.log("Worfkflow folder  " + wf["wf_folder"] + " matches filter " + filter);
                        alreadyAdded[wf["wf_name"]] = 1;
                        filteredWorkflowList.push(wf);//allow workflow
                    }
                } else {
                    //console.log("Worfkflow folder  " + wf["general"]["wf_folder"] + " NOT MATCHES filter "+ filter); 
                }
            }
        }
        
        if (allPermissions[x]["key"] == "FILTER_WORKFLOW_NAME") {
            have_filter = true;
            var filter = allPermissions[x]["value"]["filter"];
            for (var i in workflowlist["workflows"]) {
                var wf = workflowlist["workflows"][i];
                if (wf["wf_name"].toLowerCase().match(filter.toLowerCase())) {
                    //console.log("Worfkflow folder  " + wf["general"]["wf_name"] + " matches filter "+ filter);
                    if (!alreadyAdded[wf["wf_name"]]) {
                        alreadyAdded[wf["wf_name"]] = 1;
                        filteredWorkflowList.push(wf);//allow workflow
                    }
                }
            }
        }
    }//for allPermissions

    if (!have_filter)
        return workflowlist.workflows;
    return filteredWorkflowList;
}

