function resolveWebUiVarData(datastr,name){
    //ffastrans var description contains a string json, this is parsed into object here
    //throws if not possible
    console.log("resolve type:",typeof(datastr))
    var data_obj = {};
    if (typeof(datastr) == "object" || typeof(datastr) == "array" )
        return translateDhx5To8Vars(data_obj);
    try{
        eval("var eval_data = " + datastr);
        data_obj = JSON.parse(JSON.stringify(eval_data));
    }catch(ex){
        data_obj = JSON.parse(a.data)
    }

    return translateDhx5To8Vars(data_obj);
}

function postProcessDhtmlxFormItem(ffastransvar){
	//add various transformations to the dhtmlx form object e.g. default values like offsetLeft
    var errormsg = "Workflow configuration error, Please edit the description of the variable "+var_name+" to contain a valid JSON key value array";
    var var_obj = ffastransvar.data;
    var var_name = ffastransvar.name;
    if (var_obj.length == 0){
        throw new Error(errormsg);
    };

	if (var_obj.type){
		//calendar, multiselect, any native dhtmlx form control
		var_obj.name = var_name; //need to override the name of dhtmlx form component and set variable name instead
		if (!var_obj.offsetLeft)
			var_obj.offsetLeft = 15;
 
            
		return var_obj;
	}
	else{
		//simple key value list without type goes into dropdown (legacy)
		var var_display_name = var_name;
		var_display_name = var_display_name.replace("s_webui_", "");
		var options=[];
		for (var y=0;y<var_obj.length;y++){
			options.push({text:var_obj[y].key,value:var_obj[y].value});
		}
		var select_item = {type: "select",width:150,name: var_name, label: var_display_name, options: options,  offsetLeft:15};
		return select_item;
	}

}

function webuiVariables_processVariables(user_variables){
    /* takes raw ffastrans api response for wf_user vars and returns an array of dhtmlx form components */
    var transformed_vars = [];

    //webui_* named variables?
    for (var i=0;i<user_variables.length;i++){
        var current_var = user_variables[i];
        if (current_var.name.indexOf("webui") != -1){
            try{
                console.log("resolving varaible",user_variables[i])
                //todo: get rid of original_data by letting the rest of the code access data object instead of overwriting the variable itelf with postProcessDhtmlxFormItem
                if ("original_data" in user_variables[i]){
                    var original_data = JSON.parse(JSON.stringify(user_variables[i]["original_data"]));
                    user_variables[i]["data"] 	= resolveWebUiVarData(original_data);
                    user_variables[i] 			= postProcessDhtmlxFormItem(user_variables[i])
                    user_variables[i]["original_data"] = original_data;
                }else{
                    var original_data = JSON.parse(JSON.stringify(user_variables[i]["data"]));
                    user_variables[i]["data"] 	= resolveWebUiVarData(user_variables[i]["data"]);
                    user_variables[i] 			= postProcessDhtmlxFormItem(user_variables[i])
                    user_variables[i]["original_data"] = original_data;
                }

                transformed_vars.push(user_variables[i]);
            }catch(ex){
                console.log("Error parsing webui var data:",user_variables[i],ex);
                alert("Error, contact Administrator. Variable description is not valid JSON:" + user_variables[i]);
            }
        }
    }

    //we have webui_ type variables, Sort and return them
    if (transformed_vars.length != 0){
        console.log("sort and return webui_ variables")
        transformed_vars.sort((a, b) => {
                //merit is a special custom field the user can use for forced sorting
                if (a.merit && !b.merit)
                    return -1
                if (!a.merit && b.merit)
                    return 1
                return a.merit - b.merit ;
            });
        return transformed_vars;
    }
    console.log("no webui_ variables in workflow, parsing other vars")
    //the workflow does not contain webui_ type user vars, we just display all user_vars as text input
    //DISABLED PARSING NON WEBUI VARIABLES BECAUSE DOES NOT MAKE SENSE
    // for (var i=0;i<user_variables.length;i++){
    //     var current_var = user_variables[i];
    //     var desc = current_var.description  == "" ? current_var.name : current_var.description;
    //     var displayName = current_var.name;
    //     displayName = displayName.replace(/s_|i_|f_/, "");
    //     var virtual_var = {name:current_var.name , data:{type: "input", name: current_var.name, label: displayName, tooltip:desc }};
    //     virtual_var = postProcessDhtmlxFormItem(virtual_var)
    //     transformed_vars.push(virtual_var)
    // }
    
    return transformed_vars;
}

function isDhx5Variable(original){
    var is_dhx5 = false;
    if (original.validate || original.note || original.type == "calendar"){
        is_dhx5 = true;
    }
    if (Array.isArray(original.options) && original.options.length > 0 ){
        if (original.options[0].text)
            is_dhx5 = true;
    }
    return is_dhx5;
}

function translateDhx5To8Vars(original,skip_validation = false){
    /* backward compatibility, dhtmlx renamed lots of fields in form items, this supports old values in new form */
    if (!isDhx5Variable(original)){
        if (skip_validation)
            return original;
        return _addValidation(original); //if no translation is needed, we just add the regex validation function
    }
    console.log("TRANSLATE WEBUI VAR ORIGINAL",original);

    original.labelPosition = "left";

    if (original.type == "calendar" ){
        original.type = "datepicker";
        original.timePicker = original.enableTime;
    }

    if (original.note){
        try{
            original.preMessage = original.note.text;
            original.successMessage = original.note.text;
            original.errorMessage = original.note.text;
            delete original.note;
            
        }catch(ex){
            original.preMessage = "Error parsing note text, contact ffastrans administrator. You need to provide note like {'text':'mytext'}"
        }
    }
    // if (!original.labelWidth)
    //     original.labelWidth = 170; //dhx7 needs much more space than dhx5, just assume some long text
    
    if (original.width){
        original.width = parseInt(original.width) * 1.5;
        original.labelWidth = 170;
    }

    if (original.width && parseInt(original.width) < parseInt(original.labelWidth))
        original.width = parseInt(original.labelWidth) + parseInt(original.width);

    if (Array.isArray(original.options)){
        
        original.options = original.options.map(function(entry){
            //translate options[{text,value}] to options[{content,value}]
            var real_content = entry.content ? entry.content : entry.text
            return {content:real_content,value:entry.value}
        })
        console.log("TRANSLATE OTPTIONS DONE",original.options)
    }

    if (skip_validation){
        if (original.validate)
            original.validation = original.validate
        return original;
    }
    
    return _addValidation(original);
}

function _addValidation(original){
    //since dhx8, validation regex must be done by function. 
    //this method allows the user to input a regex string in the validation field.
    if (original.validate || original.validation){
        //store original validation value in validregex field because we will overwrite validation with a function
        original.validregex = original.validate || original.validation;
        //replaces original validation value(possibly regex by real regex func)
        if (!original.validation.match ("email|integer|numeric|alphanumeric|IPv4")){
            original.validation = function(value){
                return value.match(original.validregex);
            }
        }

    }
    if (original.validate)
        delete original.validate;
    console.log("TRANSLATE WEBUI VAR FINAL",original)
    return original;
}
