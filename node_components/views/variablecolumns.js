const userpermissions = require("../userpermissions");
const configServer = require(global.approot  + '/node_components/server_config');

//as many clients can poll this parallel, we cache some stuff that is heavy

module.exports = async function(app, passport){
    /* gets allowed variablecolumns */
	app.get('/variablecolumns', async (req, res) => {
		res.json(global.config.job_viewer?.variable_columns || []);
		return;

	});

    /* saves new variablecolumns */
    app.post('/variablecolumns', (req, res) => {
        try{
            console.log("Saving variablecolumns in database",req.body);
            global.config.job_viewer = global.config.job_viewer || {};
            global.config.job_viewer.variable_columns = req.body;
			
            configServer.save(global.config,function(){
                //success
                sendSuccess(res);
            },function(){
                //error (which may never really happen)
                sendErrror(res,"unexpected error saving cofig");
            })
        }catch (ex){
            sendError(res,ex);
			return;
        }  

    })
}

function sendSuccess(res){
    res.json({success:true});
}

function sendError(res,returnobj){
    console.log("ERROR: unxepected error: " + returnobj);
	res.writeHead(500,{"Content-Type" : "application/JSON"});
	res.write(returnobj);//output json array to client
    res.end();
}