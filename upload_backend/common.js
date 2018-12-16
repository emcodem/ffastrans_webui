const Busboy = require('busboy');
const fs = require('fs');

module.exports = function(app, express){

	//serve previews
	app.use("/backend/upload/previews", express.static(__dirname + '/previews'));

	//download files
	app.use('/backend/upload/files/:file', (req, res) => {
		var file = __dirname + '/files/'+req.params.file;
		res.download(file);
	});

	//upload files
	app.post('/backend/upload', (req, res) => {
		if (req.method === 'POST') {
			const busboy = new Busboy({ headers: req.headers });
			const response = {};
			busboy.on('file', (fieldname, file, filename) => {
				console.log(fieldname, filename);
				const saveTo = __dirname + "/files/" + filename;
				response.link = `/backend/upload/files/${filename}`;

				file.pipe(fs.createWriteStream(saveTo));
			});
			busboy.on('field', (fieldname, val) => {
				console.log(fieldname + ': '+ val);
			});
			busboy.on('finish', () => {
				res.json(response);
			})
			return req.pipe(busboy);
		}
		res.writeHead(404);
		res.end();
	});

}