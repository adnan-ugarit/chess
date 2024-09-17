var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var passport = require('passport');
var path = require('path');
var favicon = require('serve-favicon');
var mongoose = require('mongoose');
var compression = require("compression");
var helmet = require("helmet");
var flash = require('connect-flash');
var logger = require('morgan');
var https = require('https');
var fs = require('fs');

var port = process.env.port || 3000;
require('dotenv').config();
if(process.env.PORT != 3000)
	port = process.env.PORT;

var app = express();
app.use(favicon(path.join(__dirname, 'public/img', 'favicon.ico')));

// configure database
require('./config/database')(mongoose);

// bootstrap data models
fs.readdirSync(__dirname + '/models').forEach(function (file) {
    if (~file.indexOf('.js')) require(__dirname + '/models/' + file);
});

// configure express app
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(flash());
app.use(session({ secret: 'CHESS', saveUninitialized: true, resave: true } ));
app.use(express.static(path.join(__dirname, 'public')));
app.use(compression());
app.use(helmet());
require('./app/passport')(app, passport);
app.use(passport.initialize());
app.use(passport.session());

// configure routes
var home = require('./routes/home');
var register = require('./routes/register');
var login = require('./routes/login');
var profile = require('./routes/profile');
var play = require('./routes/play');
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/', home);
app.use('/register', register);
app.use('/login', login);
app.use('/profile', profile);
app.use('/play', play);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
    res.render('partials/error', {
		message: err.message,
        error: app.get('env') === 'development' ? err : {}
	});
});

// launch app server with ssl certificate
var server = https.createServer({
    key: fs.readFileSync('certificates/server.key'), 
    cert: fs.readFileSync('certificates/server.crt')
},app);

var io = require('socket.io').listen(server);
require('./app/socket.js')(io);

module.exports = app;

server.listen(port);
console.log('app listening on port ' + port);