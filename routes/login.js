var express = require('express');
var mongoose = require('mongoose');
var passport = require('passport');
var bodyParser = require('body-parser');
var User = mongoose.model('User');
var router = express.Router();

bodyParser.urlencoded({extended: 'false'}); // to prevent CSRF attacks

router.get('/', function(req, res) {
    var errors = req.flash('error');
    var error = '';
    if (errors.length) {
        error = errors[0];
    }

    res.render('partials/login', {
        title: 'Chess - Login',
        error: error,
        isLoginPage: true
    });
});

router.post('/',
    passport.authenticate('local',{ failureRedirect: '/login', failureFlash: true }),
    function(req, res) {
        User.findOneAndUpdate({_id: req.user._id}, { status: 'online' }, {} ,function (err, user) {
            req.flash('welcomeMessage', 'Welcome ' + user.username);
            res.redirect('/play');
        });
    });

module.exports = router;
