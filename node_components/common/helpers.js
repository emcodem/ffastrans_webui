module.exports = {
    build_new_api_url: build_new_api_url
}

function build_new_api_url(what){
    var host = global.config["STATIC_API_HOST"];//ffastrans and new api must be on same host
    var port = global.config["STATIC_API_NEW_PORT"];
    var protocol = global.config.STATIC_WEBSERVER_ENABLE_HTTPS == "true" ? "https://" : "http://";
    return protocol + host + ":" + port + what;  
}