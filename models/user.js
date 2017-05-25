var db = require('../db');

var SchemaTypes = db.Schema.Types;

var UserSchema = db.Schema({
    userId: { type: String, required: true },
    username: { type: String, required: true },
    name: { type: String, required: true },
    hidden: { type: Boolean, default: false },
    language: { type: String, required: false },
    status: { type: String, required: false, default: '' },
    longitude: { type: SchemaTypes.Double, required: false, default: 0 },
    latitude: { type: SchemaTypes.Double, required: false, default: 0 },
    accuracy: {type: SchemaTypes.Double, required: false, default: 0 },
    showNotification: { type: Boolean, default: true },
    timestamp: { type: Date, required: false, default: Date.now() },
    creationTime: { type: Date, default: Date.now(), required: true },

    device: {
        deviceToken: { type: String, required: false },
        deviceType: { type: String, required: false },
        authToken: { type: String, required: false },
    },

    friends: [{
        friendId: { type: String, required: true },
        username: { type: String, required: true },
        type: {type: Number, required: true }
    }]
});



var UserModel = db.model('User', UserSchema);

module.exports = UserModel;
