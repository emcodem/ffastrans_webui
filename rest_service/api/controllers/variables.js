'use strict';
const fs = require('fs-extra');
const fsPromises = require('fs').promises;
const path = require("path");
const common = require("./common/helpers.js");

module.exports = {
    get: get,
    post:post,
    delete:do_delete
};


async function get(req, res) {
 var o_req = req.body;
	try {
        var o_return = {discovery:req.headers.referer,user_variables:{statics:[],variables:[]}};
        var o_readout = await (readVarsFile());
        o_return.user_variables.variables = o_readout.variables;
        o_return.user_variables.statics   = o_readout.statics;
        res.json(o_return);
        res.end();
	} catch(err) {
		console.debug(err);
		return res.status(500).json({message:err.toString(),description: err});
	}
}

async function post(req, res) {
    //check if variable exists
    var updated_var = req.body;
    var types = {s:"string",i:"integer",f:"float",S:"string",I:"integer",F:"float",}
    try {
        if (!updated_var.hasOwnProperty("name") || !updated_var.hasOwnProperty("data"))
            throw new Error("Provide an object with 2 fields: name and data. Got: " + JSON.stringify(updated_var))
        var o_readout = await (readVarsFile());
        
        if (updated_var.name.charAt(1) != "_")
            throw new Error("Invalid Name, second character has to be _")
        updated_var.type = types[updated_var.name.charAt(0)]; //add type
        if (!updated_var.type){
            throw new Exception("Unknown type, var name has to start with s i f" );
        }
        //check if var exists
        var is_static = updated_var.name.charAt(0).match(/S|I|F/);
        var existing = o_readout.variables.find(a=> a.name == updated_var.name) 
                        || o_readout.statics.find(a=> a.name == updated_var.name);

        if (!existing){
            console.log("Storing a new variable",updated_var);
            if (is_static)
                o_readout.statics.push(updated_var);
            else
                o_readout.variables.push(updated_var);
        }else{
            console.log("Updating an existing variable",updated_var);
            existing.data = updated_var.data;
        }
        //save vars file
        writeVarsFile(o_readout);
        res.json({"success":true});
        res.end();
    } catch(err) {
        console.debug(err);
        return res.status(500).json({message:err.toString(),description: err});
    }
}

async function do_delete(req, res) {
    try {
        var var_name = req.query.name;
        var o_readout = await readVarsFile();
        var existingIndex = o_readout.variables.findIndex(a=> a.name == var_name) 
        if (existingIndex == -1)
            existingIndex = o_readout.statics.findIndex(a=> a.name == var_name);
        
        if (existingIndex == -1)
            throw new Error("Variable not found by name: " + JSON.stringify(var_name) )
        
        var is_static = var_name.charAt(0).match(/S|I|F/);
        
        if (is_static){
            console.log("Deleting static: ",o_readout.statics[existingIndex]);
            o_readout.statics.splice(existingIndex, 1);
        }
        else{
            console.log("Deleting variable: ",o_readout.variables[existingIndex]);
            o_readout.variables.splice(existingIndex, 1);
        }

        writeVarsFile(o_readout);

        res.json({"success":true});
        res.end();
    } catch(err) {
        console.debug(err);
        return res.status(500).json({message:err.toString(),description: err});
    }
}


/* HELPERS */

function writeVarsFile(o_vars){
    var s_user_vars_file = path.join(global.api_config["s_SYS_CONFIGS_DIR"],"user_variables.json");
    console.log("Saving user_variables file: ",s_user_vars_file);
    fs.writeFileSync(s_user_vars_file,JSON.stringify(o_vars,null,2));
}

async function readVarsFile(){
    var s_user_vars_file = path.join(global.api_config["s_SYS_CONFIGS_DIR"],"user_variables.json");
    var all_vars_readout = await common.readfile_cached(s_user_vars_file);
    var o_readout = JSON.parse(all_vars_readout);
    return o_readout;
}




