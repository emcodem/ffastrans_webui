module.exports = function(app, express){
//serve and store admin config as dhtmlx form json config 
var configServer = require(global.approot  + '/node_components/server_config');
	app.get('/getactivejobsajax_treegrid', (req, res) => {
		//this should only be called by the client on loading
        try{
			if (req.method === 'GET' || req.method === 'POST') {
                var jobfetcher = require("./../cron_tasks/jobfetcher");
                jobfetcher.fetchjobs();
            }
            
        }catch (ex){
            console.error("getactivejobsajax_treegrid error calling fetcher "+ ex)
            
        }
	});
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function hashCode (string) {
//this creates a hash from a stringified object, it is used to workaround and create missing jobids from ffastrans version 0.9.3
  var hash = 0, i, chr;
  if (string.length === 0) return hash;
  for (i = 0; i < string.length; i++) {
    chr   = string.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};
  
  
  
  
