
module.exports = function(express,app,formidable,fs,os,gm,knoxClient,mongoose,io){
	


	var Socket;

	io.on("connection", function(socket){
		Socket = socket
	});

	
	var singleImage = new mongoose.Schema({
		filename:String,
		votes:Number
	})

	var singleImageModel = mongoose.model("singleImage", singleImage)
	

	var router = express.Router()
	var host = app.get('host')

	router.get('/', function(req,res,next){
		singleImageModel.find({}, function(err,result){
			res.render('main/home', {title: 'PhotoBomb',
								 	 host: host,
								 	 photos: result
													});
			})

		
	})

	function generateFilename(filename){
		var ext_regex = /(?:\.([^.]+))?$/;
		var ext = ext_regex.exec(filename)[1];
		var date = new Date().getTime();
		var charBank = "abcdefghijklmnopqrstuvwxyz";
		var fstring = '';
		for(var i = 0; i<15; i++){
			fstring += charBank[parseInt(Math.random()*26)];
		}
		return (fstring += date + '.' + ext);
	}

	router.post('/upload', function(req,res,next){
		
		var tmpFile, nfile, fname;
		var newForm = new formidable.IncomingForm();
		newForm.keepExtensions = true;


		//formidable generates a serialized file name
		//parses values in all fields
		newForm.parse(req, function(err,fields,files){
			tmpFile = files.upload.path;
			fname = generateFilename(files.upload.name);
			nfile = os.tmpDir() + '/' + fname;
			res.writeHead(200, {'Content-type': 'text/plain'});
			res.end()
		})
		// when end happens
		// resize the image and upload
		newForm.on('end', function(){
			fs.rename(tmpFile, nfile, function(){
				//n file is the path to the specified file
				gm(nfile).resize(300).write(nfile, function(){
					
					fs.readFile(nfile, function(err, buf){
						//communicate with S3 bucket
						//send fname and an object 
						//which distinguishes the file type
						var req = knoxClient.put(fname,{
							'Content-Length':buf.length,
							'Content-Type':'image/jpeg'
						})
						// after connecting with the S3 bucket
						// a response will fire back 

						req.on('response', function(res){
							console.log(res.statusCode);
							if(res.statusCode == 200){
								var newImage = new singleImageModel({
									filename: fname,
									votes: 0
								}).save();
							}
							
							Socket.emit('status', {'msg':'Saved !!', 'delay': 3000});
							Socket.emit('doUpdate', {});
							
							fs.unlink(nfile, function(){
								console.log('Local File Deleted!')
							})
						})



						req.end(buf)
						})
					})
				})
			})

			
		})

	router.get('/getimages', function(req,res,next){
		singleImageModel.find({}, null, {sort:{votes:-1}}, function(err,result){
			res.send(JSON.stringify(result));
			})
		})
	router.get('/voteup/:id',function(req,res,next){
		singleImageModel.findByIdAndUpdate(req.params.id, {$inc:{votes:1}}, function(err,result){
			if(err) next(err);
			 res.status(200).send({votes:result.votes+1});
		});
	})

	app.use('/', router)
}





