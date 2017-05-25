var express = require('express');
var bodyParser = require('body-parser');
var UserController = require('./controllers/user.controller');
var config = require('./config');

var app = express();
app.use(bodyParser.json());


app.post('/where/users', UserController.Register);

app.get('/where/users/:myId', UserController.Login);

app.patch('/where/users/:myId', UserController.UpdateUser);

app.post('/where/users/:myId/friends/:friendUsername', UserController.SendInvitation);

app.get('/where/users/:myId/invitations', UserController.GetMyInvitations);

app.get('/where/users/:myId/friendsAndInvitations', UserController.GetMyFriends);

app.patch('/where/users/:myId/invitations/:invitationId', UserController.RespondInvitation);

app.delete('/where/users/:myId/friends/:friendUsername', UserController.DeleteFriend);

app.get('/where/users/:myId/friends/:friendUsername/location', UserController.GetFriendLocation);

app.delete('/where/users', UserController.FindAndRemove);

app.get('/where/users', UserController.GetAll);

app.listen(config.SERVER_PORT, function(){
    console.log('Listening on port:' + config.SERVER_PORT + '!')
})

module.exports = app
