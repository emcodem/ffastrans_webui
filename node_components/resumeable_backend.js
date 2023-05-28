var resumable = require('../node_modules/resumablejs/samples/Node.js/resumable-node.js')('C:\\tmp\\');//TODO: reload location for each upload from global conf

var multipart = require('connect-multiparty');
var crypto = require('crypto');


module.exports = function(app, passport){


    
    app.use(multipart());
        
    // retrieve file id. invoke with /fileid?filename=my-file.jpg
    app.get('/fileid', function(req, res){
      if(!req.query.filename){
        return res.status(500).end('query parameter missing');
      }
      // create md5 hash from filename
      res.end(
        crypto.createHash('md5')
        .update(req.query.filename)
        .digest('hex')
      );
    });

    // Handle uploads through Resumable.js
    app.post('/upload', function(req, res){
      
        resumable.post(req, function(status, filename, original_filename, identifier){
            console.log('POST', status, original_filename, identifier);
            
            res.send(status);
            
        });
    });

    // Handle status checks on chunks through Resumable.js
    app.get('/upload', function(req, res){
        resumable.get(req, function(status, filename, original_filename, identifier){
            console.log('GET', status);
            res.send((status == 'found' ? 200 : 404), status);
        });
    });

    app.get('/download/:identifier', function(req, res){
        resumable.write(req.params.identifier, res);
    });
    
    app.get('/resumable.js', function (req, res) {
      console.log("serving resumeablejs")
      var fs = require('fs');
      res.setHeader("content-type", "application/javascript");
      fs.createReadStream("node_modules/resumablejs/resumable.js").pipe(res);
    });
}

function initResumeable(){
  var r = new Resumable({
    target:'c:\\temp\\',
    query:{upload_token:'my_token'}
  });
  return r;
}