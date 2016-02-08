var express = require('express');
var app = express();
var session = require('express-session');
var cookieParser = require('cookie-parser');
var	path = require('path');
var mongoose = require('mongoose');
var ejs = require('ejs');
var engine = require('ejs-mate');
var config = require('./config/config.js');
var knox = require('knox');
var fs = require('fs');
var os = require('os');
var formidable = require('formidable');
var gm = require('gm');

var flash = require('express-flash');
var MongoStore = require('connect-mongo/es5')(session);

mongoose.connect(config.dbUrl, function(err){
	if(err){
		console.log(err);
	}else {
		console.log("Connected to the database")
	}
})



app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.set('host', config.host);
app.use(cookieParser());
app.use(session({
	resave: true,
	saveUninitialized: true,
	secret: config.S3Secret,
	store: new MongoStore({
		url: config.dbUrl, autoReconnect: true
	})
})
);
app.use(flash());


var knoxClient = knox.createClient({
	key:config.S3AccessKey,
	secret:config.S3Secret,
	bucket:config.S3Bucket
})


var server = require('http').createServer(app)
var io = require('socket.io')(server);

require('./routes/main.js')(express,app,formidable,fs,os,gm,knoxClient,mongoose,io)


server.listen(8080, function(){
	console.log('Server is now running on port: 8080');
})