const Busboy = require('busboy');
const fs = require('fs');
const crypto = require('crypto');



module.exports = function(app){

	function getSafeName(filename, target, cb){
		const safeName = crypto.createHash('md5').update(filename+(new Date())).digest("hex");
		const saveTo = target + safeName;
		fs.exists(saveTo, function(res){
			if (res)
				getSafeName(saveTo, target, cb)
			else {
				cb(safeName);
			}
		})
	}

	//rename file before saving
	//- prevents file name guessing atack
	//- prevents file name collisions
	app.post('/backend/safeUpload', (req, res) => {
		if (req.method === 'POST') {
			const busboy = new Busboy({ headers: req.headers });
			const response = {};

			busboy.on('file', (field, file, name) => {
				const target = __dirname + "/files/";
				getSafeName(name, target, function(safeName){
					console.log(field, name, safeName);
					file.pipe(fs.createWriteStream(target+safeName));
					response.link = "/backend/download/"+safeName+"/"+name;
					res.json(response);
				});
			});

			return req.pipe(busboy);
		}
		res.writeHead(404);
		res.end();
	});

	//serve file by id
	app.use('/backend/download/:file/:name', (req, res) => {
		var file = __dirname + '/files/'+req.params.file;
		res.download(file, req.params.name);
	});

}