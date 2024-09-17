var mongoose = require('mongoose');
var util = require('../app/util.js');

var UserSchema = mongoose.Schema({
    username: String,
    password: String,
	dateCreated: String,
	status: { type: String, default: 'online' },
	rating: { type: Number, default: parseInt(process.env.RATING) },
	nbGamesWin: { type: Number, default: 0 },
	nbGamesDraw: { type: Number, default: 0 },
	nbGamesLose: { type: Number, default: 0 },
	lastConnection: Date
});

//authenticating the user by comparing the user entered password with the salted hash password
UserSchema.methods = {
    authenticate: function (plainText) {
		return util.compareSync(plainText, this.password);
    }
};

mongoose.model('User', UserSchema);