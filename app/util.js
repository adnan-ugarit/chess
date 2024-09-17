var bcrypt = require('bcrypt');

module.exports = {
    // We are using salted hashes with salt value 10 
    encrypt: function (plainText) {
        return bcrypt.hashSync(plainText, parseInt(process.env.HASH_SALT));
    },
	
	compareSync: function (plainText, password) {
        return bcrypt.compareSync(plainText, password);
    },

    randomString: function (length) {
        var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghiklmnopqrstuvwxyz';
        var string = '';

        for (var i = 0; i < length; i++) {
            var randomNumber = Math.floor(Math.random() * chars.length);
            string += chars.substring(randomNumber, randomNumber + 1);
        }

        return string;
    }
};