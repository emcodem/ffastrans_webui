module.exports = function(app, express){
//serve and store admin config as dhtmlx form json config 
var configServer = require(global.approot  + '/node_components/server_config');

	app.get('/adminconfig', (req, res) => {
		try{
			if (req.method === 'GET' || req.method === 'POST') {
                //basic fieldset, parent of all inputs
                var dhxform = [];
                var fieldset = {};
                fieldset.type = "fieldset";
                fieldset.name = "data";
                fieldset.label = "Server Configuration";
                fieldset.inputWidth = 500;
                fieldset.position = "label-top";
                fieldset.width= 800;
                fieldset.offsetTop = 20;
                fieldset.offsetLeft = 20;
                fieldset.list =[];//all inputs are pushed to this list
                var settings = {type:"settings", position:"label-top"};
				dhxform.push(settings)
				dhxform.push(fieldset)
                //check if config is in db or we need to use default //todo: support getting a default config intentionally
                configServer.get(function(outputConfig){
                     //loop through all config items and display them, this way we support adding/removing items in the config dynamically
					for (const key in outputConfig) {
                        var disabled = false;
                        //hide some items
                        if (key.indexOf("_URL")!=-1){disabled=true;}
                        if (key.indexOf("STATIC_API_NEW_PORT")!=-1){disabled=true;}
                        //decide type of userinput
						if (typeof (outputConfig[key]) == "string"){
                            //bool as string
                            if (outputConfig[key]=="true"||outputConfig[key]=="false"){
                                fieldset.list.push ({type: "select", "hidden":disabled,name: key,label: "<b>"+key+"</b>",width:600, options:[
                                    {text: "Enable", value: "true",	selected:(true==JSON.parse(outputConfig[key]))},
                                    {text: "Disable", value: "false",	selected:(false==JSON.parse(outputConfig[key]))},
                                ]})
                                fieldset.list.push( {type: "label", label: ""});//add spacer
                                continue;
                            }
                            //normal string
							fieldset.list.push({type:"input", "hidden":disabled,name: key, width:600,label: "<b>"+key+"</b>",value:outputConfig[key]})
						}
						if (typeof (outputConfig[key]) == "number"){
							fieldset.list.push({type:"input", "hidden":disabled,name: key, width:600,label: "<b>"+key+"</b>",value:outputConfig[key]})
						}                        
						if (typeof (outputConfig[key]) == "boolean"){
                            console.log(key + "is bool, disabled: " + disabled)
							fieldset.list.push ({type: "select", name: key,label: "<b>"+key+"</b>",width:600, options:[
								{text: "Enable", value: "true",	"hidden":disabled, selected:(true==JSON.parse(outputConfig[key]))},
								{text: "Disable", value: "false", "hidden":disabled, selected:(false==JSON.parse(outputConfig[key]))},
							]})
						}
						if (typeof (outputConfig[key]) == "object"){
							//currently we support only array type and serialize/deserialize as comma separated string
							fieldset.list.push({type:"input", name: "csv__"+key, label: "<b>"+key+"</b>",inputWidth:600,value:outputConfig[key].join()})
						}
					 	fieldset.list.push( {type: "label", label: ""});//add spacer
					}
                    res.writeHead(200,{"Content-Type" : "application/JSON"});
                	res.write(JSON.stringify(dhxform));//output json array to client
					res.end();
                }); 
            }
		}catch (ex){
				console.log("ERROR: unxepected error in adminconfig: " + ex);
                res.status(500);//Send error response here
                res.end();
		}
	});
    
    //SAVE back to database
    app.post('/adminconfig', (req, res) => {
        console.log("Saving admin config in database");
       var data = req.body;
       var toSave = {};
       for (const key in data) {
          if (key.indexOf("csv_")!=-1){
              var newName = key.replace("csv__","");
              toSave[newName] = data[key].split(",");
              //csv data is stored as array in the db
          }else{
              toSave[key] = data[key];
          }
       }
       configServer.save(toSave,function(){
            res.status(200);
            res.end();
       },function(ex){
            global.socketio.emit("admin", "Error, could not save database " + ex);
            console.log("Error, could not save database, " + ex);
            res.write("Error, could not save database, " + ex);
            res.status(500);
            res.end();
           
       });

    })
	
}