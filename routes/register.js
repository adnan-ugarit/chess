var express = require('express');
var mongoose = require('mongoose');
var util = require('../app/util.js');
var sanitize = require('mongo-sanitize');
var bodyParser = require('body-parser');
var parserurlencoded = bodyParser.urlencoded({extended: 'false'}); // to prevent CSRF attacks
var User = mongoose.model('User');

var router = express.Router();

router.get('/', function(req, res) {
    var errors = req.flash('error');
    var error = '';
    if (errors.length) {
        error = errors[0];
    }
    res.render('partials/register', {
        title: 'Chess - Register',
        error: error,
        isLoginPage: true
    });
});

router.post('/',parserurlencoded, function(req, res, next) {
    var username = sanitize(req.body.username);
    var password = sanitize(req.body.password);
    var confirmPassword = sanitize(req.body.confirmPassword);
    var usernameRegex = sanitize(/^[a-zA-Z0-9]{3,12}$/);
    var passwordRegex = sanitize(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/);
	
	// current timestamp in milliseconds
	var ts = Date.now();

	var date_ob = new Date(ts);
	var day = ("0" + date_ob.getDate()).slice(-2);
	var month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
	var year = date_ob.getFullYear();
	var date = day + "/" + month + "/" + year;
	
    if(usernameRegex.test(username) == true) {  // username input validation before querying db
        User.findOne({username: username} ,function (err, user) {
            if (user !== null) {
                req.flash('error', 'We have already an account with username: ' + username);
                res.redirect('/register');
            } else { // no user found
                if(passwordRegex.test(password) == true) {  // password input validation
                    if(password === confirmPassword) {
                        var u = new User({ username: username, password: util.encrypt(password), dateCreated: date });
                        u.save(function (err) {
                            if (err) {
                                next(err);
                            } else {
                                //console.log('new user:' + u);
                                req.login(u, function(err) {
                                    if (err) { return next(err); }
                                    req.flash('welcomeMessage', 'Welcome ' + u.username);
                                    return res.redirect('/play');
                                });
                            }
                        });
                    } else {
                        req.flash('error', 'The confirmation password does not match the password');
                        res.redirect('/register');
                    }
                } else {
                    req.flash('error', 'Password does not match the conditions provided');
                    res.redirect('/register');
                }
    
            }
        });
    } else {
        req.flash('error', 'User name does not match the conditions provided');
        res.redirect('/register');
    }    
});

module.exports = router;
