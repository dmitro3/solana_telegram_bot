var mongoose = require('mongoose');

//mongo
const mongoConnect = (callback) => {
    mongoose.connect(global._config.MONGO_URI, {
        useNewUrlParser: true,
        auto_reconnect: true,
        keepAlive: 500,
        connectTimeoutMS: 90000,
        socketTimeoutMS: 90000,
        connectWithNoPrimary: true
    }, function (err) {
        if (err) {
            console.log(' ❌  Mongodb Connection Error');
            console.log(err);
        } else {
            console.log(' ✅  Database Connected');
            callback();
        }
    });
}

module.exports = mongoConnect;
