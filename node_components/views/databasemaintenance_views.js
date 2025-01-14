var moment = require("moment");
var configServer = require('../server_config');
let maintenance_funcs = require('../cron_tasks/maintenance');
var assert = require('assert');

module.exports = function(app, express){
    //serve and store admin config as dhtmlx form json config 

        app.post('/database_maintenance_autodelete', async (req, res) => {
            var data = req.body;
            try{
                assert(req.body.database_maintenance_autodelete);
                var integerValue = parseInt(req.body.database_maintenance_autodelete, 10);
                global.config.database_maintenance_autodelete = integerValue;
                configServer.save(global.config);
                res.json({success:true})
                res.end();
            }
            catch(ex){
                console.error("Could not save autodelete",ex)
                res.status(500);//Send error response here
                res.end();
            }
        })

        app.delete('/database_maintenance_autodelete', async (req, res) => {
            //kicks off autodelete now
            await maintenance_funcs.exec_all();
            res.end();
        })

        app.get('/database_maintenance_autodelete', async (req, res) => {
            res.write(req.body.database_maintenance_autodelete);
            res.end();
        })


        app.get('/database_maintenance_download', async (req, res) => {
            try{
                var timeParams = parseTimeParameters(req.query.parameters);
                var stateParams = parseStateParameters(req.query.parameters)
                //todo: use real date objects and calculate timezone.. or require it from client?
                var date_filter = {job_start:{$gt:timeParams.start},job_end:{$lt:timeParams.end}} //
                var state_filter = {$or:[]};

                var all_ops = {$and:[date_filter,stateParams]};
                
                
               //open database get cursor
                var lastTenThousand = await global.db.jobs.find(all_ops,{sort:{job_start:-1}});

                res.writeHead(200, {
                    'Content-Type': 'text/plain',
                    'Content-disposition': 'attachment; filename=webinterface_database_export.json'
                });
                var client_connected = true;
                req.on("close", function() {
                    // request closed unexpectedly
                    client_connected = false;
                });
                  
                //download each doc separate from db and stream to client in order to support huge db
                await res.write("[\n");
                if (await lastTenThousand.hasNext()){
                    for await (const doc of lastTenThousand) {
                        //streams the data to client
                        await res.write(JSON.stringify(doc) + ",\n");
                        if (!client_connected){
                            res.end();
                        }
                    }
                }
                await res.write("]");

                res.end();
            }catch(ex){
                console.error(ex)
                res.status(500);//Send error response here
                res.end();
            }
        })
}

function parseStateParameters(params){
    params = JSON.parse(params);
    var in_array = [];
    if (params.Error)
        in_array.push("Error")
    if (params.Success)
        in_array.push("Success")
    if (params.Cancelled)
        in_array.push("Cancelled")

    if (in_array.length != 0)
        return { $and:[{"state":{$in:in_array}}]}
    else
        return {} //must use empty obj in mongo query in this case
    
}

function parseTimeParameters(params){
    params = JSON.parse(params);
    var _start = params.db_start_date
    var _end = params.db_end_date;
    if (params.olderthan != ""){
        _end = new Date();
        _end = getDateSubtracted(_start, parseInt(params.olderthan) );
        _start = "0";
    }

   // _start =    _start.replace(" ","T");
   // _end =      _end.replace(" ","T");
    
    return ({start:_start,end:_end});
}

function getDateSubtracted(dateobj,daysToSubtract){
        
		var parsed = moment(dateobj).subtract(daysToSubtract,'days')

		return parsed.format("YYYY-MM-DD HH:mm:ss");
   
}