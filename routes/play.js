var express = require('express');
var util = require('../app/util.js');
var bodyParser = require('body-parser');
var parserurlencoded = bodyParser.urlencoded({extended: 'false'}); // to prevent CSRF attacks

var router = express.Router();

router.get('/', function(req, res) {
	var welcomeMessage = req.flash('welcomeMessage');
    res.render('partials/play', {
        title: 'Chess - Game',
		welcomeMessage: welcomeMessage,
        user: req.user,
        isPlayPage: true
    });
});

router.post('/',parserurlencoded, function(req, res) {
	var opponent = req.body.opponent;
    var side = req.body.side;
	if(side == 'random')
		if(Math.random() > 0.5)
			side = 'black';
		else
			side = 'white';
	if(opponent == 'computer') {
		res.redirect('/game/' + side);
	}
	else if(opponent == 'friend') {
		var token = util.randomString(parseInt(process.env.TOKEN_LENGTH));
		res.redirect('/game/' + token + '/' + side);
	}
});

module.exports = router;