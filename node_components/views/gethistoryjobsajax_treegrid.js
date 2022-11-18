module.exports = function(app, express){
//serve and store admin config as dhtmlx form json config 

	app.get('/gethistoryjobsajax_treegrid', (req, res) => {
		try{
			if (req.method === 'GET' || req.method === 'POST') {
                var start = req.query.start||0;
                start = JSON.parse(start)
                var count = req.query.count||1000;
                count = JSON.parse(count)
                count = count + 0;
                var filterobj = req.query.filterobj||"{}";
                filterobj = JSON.parse(filterobj);
                console.log("New search in job history, filterobj:")
                console.log(filterobj)
                if (Object.keys(filterobj).length  != 0){
                    newfilter = {};
                    for (key in filterobj){
                        newfilter[key] = {$regex: new RegExp(escapeRegExp(filterobj[key]),"i")}
                    }
                    filterobj = newfilter;
                }
                filterobj["deleted"] =  { $exists: false } ; //always only show non deleted jobs
                console.log("added filter deleted")
                var filtercol = req.query.filtercol;
                console.log(filtercol)
                if (typeof filtercol == 'undefined' || filtercol == null){
                    filtercol = 'job_end'
                }
                var direction = req.query.direction;
                if (direction == "asc"){
                    direction = 1;
                }else{
                    direction = -1;
                }
                //basic fieldset, parent of all inputs
                // params: start,count,filtercol,direction
                
                    var allitemscount = global.db.jobs.count(filterobj,function(err,total_count){
                            if (err){
                                throw err
                            }       
                            console.log("Found " +  total_count + " Jobs in Db, filter: " , filterobj)
                            var sorting = {};
                            sorting[filtercol] = direction;
                            console.log(sorting)
                            global.db.jobs.find(filterobj).sort(sorting).skip(start).limit(count).exec( function(err, cursor) {
                                    if (err){            
                                        console.error("Error serving history jobs..." + err)
                                        throw err;
                                    }
                                    if ((cursor)){
                                        var numResults = 0;
                                        var jobArray =[];

                                        for (i=0;i<cursor.length;i++){
                                            cursor[i].id = hashCode(JSON.stringify(cursor[i]))
                                            //convert from db format to tree format
                                            jobArray.push(cursor[i])
                                            //console.log(cursor[i]["job_end"])
                                        }
                                       
                                        res.writeHead(200,{"Content-Type" : "application/JSON"});
                                        res.write(JSON.stringify({"total_count":total_count,"actual_count":jobArray.length , "pos":start,data:jobArray}));//output json array to client
                                        res.end();
                                    }else{
                                        
                                    }
                                });                   
                    })
                  }
            }
		catch (ex){
				console.log("ERROR: unxepected error in gethistoryjobs: " + ex);
                res.status(500);//Send error response here
                res.end();
		}
	});
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()[\]\\]/g, '\\$&'); // $& means the whole matched string -- | is not escaped in order to support multiple conditions
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
  
  
  
  
