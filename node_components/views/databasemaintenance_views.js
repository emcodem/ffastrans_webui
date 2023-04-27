var moment = require("moment");

module.exports = function(app, express){
    //serve and store admin config as dhtmlx form json config 
        app.get('/database_maintenance_count', async (req, res) => {

        })

        app.get('/database_maintenance_download', async (req, res) => {
            try{
                var parsed = parseParameters(req.query.parameters);
                //todo: use real date objects and calculate timezone.. or require it from client?

               //open database get cursor
                var lastTenThousand = await global.db.jobs.find({job_start:{$gt:parsed.start},job_end:{$lt:parsed.end}},{sort:{job_start:-1}});

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

function parseParameters(parameters){
    parameters = JSON.parse(parameters);
    var _start = parameters.db_start_date
    var _end = parameters.db_end_date;
    if (parameters.olderthan != ""){
        _end = new Date();
        _end = getDateSubtracted(_start,parameters.olderthan );
        _start = "0";
    }

    _start =    _start.replace(" ","T");
    _end =      _end.replace(" ","T");
    
    return ({start:_start,end:_end});
}

function getDateSubtracted(dateobj,daysToSubtract){
        
		var parsed = moment(dateobj).subtract(daysToSubtract,'days')

		return parsed.format("YYYY-MM-DD HH:mm:ss");
   
}