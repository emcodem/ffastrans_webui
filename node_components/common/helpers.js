module.exports = {
    build_new_api_url: build_new_api_url
}

function decode_ffaspwd(what){
	var crypto = require('crypto');
	const hash = crypto.createHash('MD5').update("CHKSUM280873").digest(); //create crypto hash out of static secret word
	decipher = crypto.createDecipheriv("RC4", hash,"");
	var decoded = Buffer.concat([decipher.update(Buffer.from(what, "hex")) , decipher.final()]);
    return decoded;
}

function encode_ffaspwd(what){
	var crypto = require('crypto');
	const hash = crypto.createHash('MD5').update("CHKSUM280873").digest(); //create crypto hash out of static secret word
	decipher = crypto.createDecipheriv("RC4", hash,"");
	var decoded = Buffer.concat([decipher.update(Buffer.from(what, "hex")) , decipher.final()]);
    return decoded;
}


function build_new_api_url(what,host = global.config["STATIC_API_HOST"],port =global.config["STATIC_API_NEW_PORT"]){
    let protocol = global.config.STATIC_WEBSERVER_ENABLE_HTTPS == "true" ? "https://" : "http://";
    return protocol + host + ":" + port + what;  
}