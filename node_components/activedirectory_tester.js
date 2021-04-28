
module.exports = function(app, passport){
//create navigation menu based on user permissions
	app.get('/activedirectory_tester', function(req, res) { 
			//serve current AD config
			
		    res.write("[]")
            res.status(200);//Send error response here
            res.end(); 
                       
					   // console.log("ERROR: unxepected error in index.js: " + ex);
                        // res.status(500);//Send error response here
                        // res.end();
               
	});
	
	//SAVE back to database
    app.post('/activedirectory_save', (req, res) => {
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
	}
}