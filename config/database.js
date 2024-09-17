module.exports = function (mongoose) {

    var connect = function () {
        /*var options = {
            server: {
                socketOptions: { keepAlive: 1 }
            },
            auto_reconnect: true
        };*/
		mongoose.connect("mongodb://" + process.env.DB_HOST + ":" + process.env.DB_PORT + "/" + process.env.DB_USER, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
    };
    connect();

    // Handles Errors
    mongoose.connection.on('error', function (err) {
        console.error('MongoDB Connection Error. Please make sure MongoDB is running. -> ' + err);
    });

    // When closed reconnect
    mongoose.connection.on('disconnected', function () {
        connect();
    });

};