
module.exports = function(app, express){


	//respond to calls to /
	app.get('/getfulluploadpath', (req, res) => {
		if (req.method === 'GET') {
             
             res.write(__dirname + "\\files\\");
             res.end();
		}

	});

}