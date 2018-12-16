//const Busboy = require('busboy');
const fs = require('fs');

module.exports = function(app, express){


	//respond to calls to /
	app.get('/', (req, res) => {
		if (req.method === 'GET') {
            console.log("Redirecting...")
            res.redirect('/webiniterface');
		}

	});

}