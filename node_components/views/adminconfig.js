module.exports = function(app, express){
//serve and store admin config as dhtmlx form json config 
var configServer = require(global.approot  + '/node_components/server_config');

	app.get('/adminconfig', (req, res) => {
		try{
			if (req.method === 'GET' || req.method === 'POST') {
                //basic fieldset, parent of all inputs
                var dhxform = [];
				
				//DATA PURGING FIELDS - static fields / no configuration / admin tools
				var fieldset_purge = {};
                fieldset_purge.type = "fieldset";
                fieldset_purge.name = "purge";
                fieldset_purge.label = "Database";
				fieldset_purge.inputWidth = 500;
                fieldset_purge.position = "label-top";
                fieldset_purge.width= 800;
                fieldset_purge.offsetTop = 20;
                fieldset_purge.offsetLeft = 20;
				fieldset_purge.list =[];
				fieldset_purge.list.push(
                        {type:"button", id:"btn_open_database_maintenance","hidden":false,name: "btn_open_database_maintenance", width:100,label: "",value:"Open Database Manager"},
                        //{type: "calendar", enableTodayButton:true, name: "db_start_date", label: "Youngest Date", dateFormat: "%Y-%m-%d %H:%i:%s"},
                        //{type:"button", id:"btn_export_history","hidden":false,name: "btn_export_history", width:100,label: "<b>Export</b>",value:"Export"},
                        //{type:"button", id:"btn_purge_history","hidden":false,name: "btn_purge_history", width:100,label: "<b>Delete</b>",value:"Delete"},
                        //{type: "newcolumn", offset:20},
                        //{type: "calendar", name: "db_end_date", label: "Oldest Date", dateFormat: "%Y-%m-%d %H:%i:%s"},   
                    )
				
				//SERVER CONFIGURATION FIELDS
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
				dhxform.push(fieldset_purge)
				dhxform.push(fieldset)
                //check if config is in db or we need to use default //todo: support getting a default config intentionally
                configServer.get(function(outputConfig){
                     //loop through all config items and display them, this way we support adding/removing items in the config dynamically
					 console.log("config from database",outputConfig)
					for (const key in outputConfig) {
						

						
                        var disabled = false;
                        //hide some items
                        if (key.indexOf("_URL")!=-1){disabled=true;}
                        
                        if (key.indexOf("STATIC_USE_PROXY_URL")!=-1){disabled=true;height:0}
						if (key.indexOf("alternate-server")!=-1){disabled=true;height:0}
                        if (key.indexOf("prometheus_targets")!=-1){disabled=true;height:0}
												//filter special items
						if (key == "email_alert_config"){disabled=true;}
						if (key.indexOf("STATIC_SEND_EMAIL_ALERTS")!=-1){
							fieldset.list.push( {type: "fieldset", width:600,"hidden":disabled, label: "Email Alerts", list: [
								{type: "select", "hidden":disabled,name: key,width:550, label: "<b>"+key+"</b>", options:[
                                    {text: "Enable", value: "true",	selected:(true==JSON.parse(outputConfig[key]))},
                                    {text: "Disable", value: "false",	selected:(false==JSON.parse(outputConfig[key]))},
                                ]},
								{type:"button", id:"btn_email_alert_config", "hidden":disabled,name: "btn_email_alert_config", width:550,label: "<b>1</b>",value:"Email Alert Configuration"}
							]} );//add spacer
							continue;
							
						}
						
						if (key == "ad_config"){disabled=true;}
						//add special btn for Activedirectory config
						if (key.indexOf("STATIC_USE_WEB_AUTHENTIFICATION")!=-1){
							fieldset.list.push( {type: "fieldset", width:600,"hidden":disabled, label: "Authentification", list: [
								{type: "select", "hidden":disabled,name: key,width:550, label: "<b>"+key+"</b>", options:[
                                    {text: "Enable", value: "true",	selected:(true==JSON.parse(outputConfig[key]))},
                                    {text: "Disable", value: "false",	selected:(false==JSON.parse(outputConfig[key]))},
                                ]},
								{type:"button", id:"btn_adconfig", "hidden":disabled,name: "btn_adconfig", width:550,label: "<b>1</b>",value:"Activedirectory Configuration"}
							]} );//add spacer
							continue;
							
						}
						
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
							fieldset.list.push ({type: "select", name: key,"hidden":disabled,label: "<b>"+key+"</b>",width:600, options:[
								{text: "Enable", value: "true",	"hidden":disabled, selected:(true==JSON.parse(outputConfig[key]))},
								{text: "Disable", value: "false", "hidden":disabled, selected:(false==JSON.parse(outputConfig[key]))},
							]})
						}
						if (typeof (outputConfig[key]) == "object"){
							//currently we support only array type and serialize/deserialize as comma separated string
							console.log("detected type object in global config:",key,":",outputConfig[key])
							fieldset.list.push({type:"input", name: "csv__"+key, "hidden":disabled, label: "<b>"+key+"</b>",inputWidth:600,value:JSON.stringify(outputConfig[key])})
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
              toSave[newName] = JSON.parse(data[key]);
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