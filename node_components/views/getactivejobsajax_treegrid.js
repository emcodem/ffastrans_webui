module.exports = function(app, express){

//returns filtered list of activejobs based on user permissions

  var configServer = require(global.approot  + '/node_components/server_config');
	app.get('/getactivejobsajax_treegrid', (req, res) => {
      try{
            //var jobfetcher = require("./../cron_tasks/jobfetcher");
            var lastactive = JSON.parse(global.lastactive);
            //global.jobfetcher.fetchjobs();
            res.json(lastactive);//Send error response here
            
      }catch (ex){
        console.error("getactivejobsajax_treegrid error calling fetcher "+ ex);
        res.status(500);//Send error response here
        res.end();
      }
	});
}

  
