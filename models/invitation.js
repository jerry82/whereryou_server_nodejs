var db = require('../db');

var SchemaTypes = db.Schema.Types;

var InvitationSchema = db.Schema({
    inviter: { type: String, required: true },
    inviterName: { type: String, required: true },
    friendId: { type: String, required: true },
    declined: { type: Boolean, required: false}
});

var InvitationModel = db.model('Invitation', InvitationSchema);
module.exports = InvitationModel;
