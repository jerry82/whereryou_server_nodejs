var db = require('../db');

var NotificationSchema = db.Schema({
    message: { type: String, required: true },
    count: { type: Number, default: 0 },
    type: { type: String, required: false },
    username: { type: String, required: true}
});

var NotificationModel = db.model('Notification', NotificationSchema);
module.exports = NotificationModel;
