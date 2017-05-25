var mongoose = require('mongoose');
var config = require('./config');
require('mongoose-double')(mongoose);

mongoose.Promise = global.Promise;
mongoose.connect(config.DB_HOST, function(){
    console.log('mongodb connected!')
});

module.exports = mongoose;
