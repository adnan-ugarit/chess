var express = require('express');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var moment = require('moment');
var eloRating = require('elo-rating');
var bodyParser = require('body-parser');
var parserurlencoded = bodyParser.urlencoded({extended: 'false'}); // to prevent CSRF attacks
var connectEnsureLogin = require('connect-ensure-login');
var dotenv = require('dotenv').config();
var envParsed = dotenv.parsed;
var envStringify = JSON.stringify(envParsed);

var router = express.Router();

router.get('/', function(req, res) {
	var logoutSuccessMessage = req.flash('logoutSuccess');
	User.find({}).sort({ rating: 'desc' }).exec(function(err, users) {
		users.forEach(function (user) {
			if(req.user)
				if(req.user.username == user.username)
					user.status = 'online';
			if(user.status == 'offline')
				user.status +=', '+ moment(user.lastConnection).fromNow();
		});
        res.render('partials/home', {
			title: 'Chess',
			logoutSuccessMessage: logoutSuccessMessage,
            user: req.user,
            isHomePage: true,
			users: users
		});
	});
});

router.get('/game/:side', function(req, res) {
    var side = req.params.side;
	if(side != 'white' && side != 'black')
		side = 'white';
	var cpu = true;
    res.render('partials/game', {
        title: 'Chess - Game ',
        user: req.user,
        isPlayPage: true,
        side: side,
		envParsed: envParsed,
		envStringify: envStringify,
		cpu: cpu
    });
});

router.get('/game/:token/:side', connectEnsureLogin.ensureLoggedIn(), function(req, res) {
    var token = req.params.token;
    var side = req.params.side;
	if(side != 'white' && side != 'black')
		side = 'white';
	User.find({ status: 'online' }).sort({ rating: 'desc' }).exec(function(err, users) {
		for(var i=0;i<users.length;i++){
			if(users[i].username === req.user.username){
				users.splice(i,1);
				break;
			}
		}
		res.render('partials/game', {
			title: 'Chess - Match',
			user: req.user,
			isPlayPage: true,
			token: token,
			side: side,
			envParsed: envParsed,
			envStringify: envStringify,
			users: users
		});
	});
});

router.get('/logout', connectEnsureLogin.ensureLoggedIn(), function(req, res) {
	User.findOneAndUpdate({_id: req.user._id}, { status: 'offline' }, {} ,function (err, user) {});
	User.findOneAndUpdate({_id: req.user._id}, { lastConnection: new Date() }, {} ,function (err, user) {});
	req.logout();
    req.flash('logoutSuccess', 'You have been successfully logged out');
    res.redirect('/');
});

router.get('/monitor', function(req, res) {
    res.render('partials/monitor', {
        title: 'Chess - Monitor',
        user: req.user
    });
});

router.post('/', parserurlencoded, function(req, res) {
	var resultGame = req.body.resultGame;
	var playerWin = false;
	var userWin = req.body.userWin;
	var userLose = req.body.userLose;
	var opponent = null;
	var username = req.user.username;
	var rating = req.user.rating;
	var opponentRating = null;
	var nbGamesWin = req.user.nbGamesWin;
	var nbGamesDraw = req.user.nbGamesDraw;
	var nbGamesLose = req.user.nbGamesLose;
	var result = null;
	if(resultGame == 0) {
		nbGamesDraw++;
		rating += parseInt(process.env.RATING_DRAW);
	}
	else if(resultGame == 1) {
		if(userWin == username) {
			playerWin = true;
			nbGamesWin++;
			opponent = userLose;
		}
		else {
			nbGamesLose++;
			opponent = userWin;
		}
		User.findOne({username: opponent}, function (err, user) {
			opponentRating = user.rating; // ?
		});
		result = eloRating.calculate(rating, opponentRating, playerWin);
	}
	User.findOneAndUpdate({_id: req.user._id}, { rating: result.playerRating, nbGamesWin: nbGamesWin, nbGamesDraw: nbGamesDraw, nbGamesLose: nbGamesLose }, {} ,function (err, user) {
		req.user = user;
        res.redirect('/');
    });
});

module.exports = router;
