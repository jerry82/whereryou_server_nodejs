var mongo = require('mongodb');
var params = require('../params');
var User = require('../models/user');
var Invitation = require('../models/invitation');
var async = require('async');

function getInvitation(username, name, friendId) {
    return {
        'inviter': username,
        'inviterName': name,
        'friendId': friendId,
    }
}

function getFriends(friendUsername, friends) {
    for (var i = 0; i < friends.length; i++) {
        if (friends[i].username === friendUsername){
            return friends[i];
        }
    }
    return null;
}

var UserController = {
    GetAll: function(req, res) {
        User.find(function(err, users){
            if (err) { return next(err); }
            res.json(users);
        });
    },

    Register: function(req, res) {
        async.waterfall(
            [
                function (callback) { //check same userId
                    var user = new User({
                        userId: req.body.id,
                        username: req.body.username,
                        name: req.body.name
                    });

                    User.findOne({'userId': user.userId}, function(err, foundUser){
                        if (err) { callback(403); }
                        else if (foundUser !== null) { callback(204); }
                        else { callback(null, user); }
                    });
                },

                function (user, callback) { //check same username
                    User.findOne({'username': user.username}, function(err, foundUser){
                        if (err) { callback(403); }
                        else if (foundUser !== null) { callback(409); }
                        else { callback(null, user); }
                    });
                },

                function (user, callback) { //save user
                    user.save(function(err, user){
                        if (err) { callback(err); }
                        else { callback(null, user); }
                    });
                }
            ],
            function(errStatus, createdUser) {
                if (errStatus) { res.status(errStatus).json(); }
                else { res.status(201).json(createdUser); }
            }
        );

    },

    Login: function(req, res) {
        var myId = req.params.myId;

        User.findOne({'userId': myId}, function(err, foundUser){
            if (err) { res.status(404).json(); }
            else { res.status(200).json(foundUser); }
        });
    },

    UpdateUser: function(req, res) {
        var myId = req.params.myId;

        var latitude = req.body.latitude;
        var longitude = req.body.longitude;
        var accuracy = req.body.accuracy;

        var status = req.body.status;
        var hidden = req.body.hidden;
        var name = req.body.name;

        console.log(req.body);

        User.findOne({'userId': myId}, function(err, foundUser){
            if (err || foundUser === null) { res.status(404).json(); }

            else {
                if (latitude !== undefined){ //update location
                    foundUser.longitude = longitude;
                    foundUser.latitude = latitude;
                    foundUser.accuracy = accuracy;
                    foundUser.timestamp = Date.now();
                }

                if (status !== undefined) { foundUser.status = status; }
                if (hidden !== undefined) { foundUser.hidden = hidden; }
                if (name !== undefined) { foundUser.name = name; }

                console.log(foundUser.timestamp);

                UserController.SaveUser(foundUser, res);
            }
        });
    },

    SendInvitation: function(req, res) {

        async.waterfall(
            [
                function(callback) { //1. check already friend ?
                    var myId = req.params.myId;
                    var friendUsername = req.params.friendUsername;

                    User.findOne({'userId': myId}, function (err, myself) {
                        if (err || myself == null) { callback(403); }
                        else {
                            var myFriendNullOrDeclined = getFriends(friendUsername, myself.friends);
                            if (myFriendNullOrDeclined === null || myFriendNullOrDeclined.type === params.FRIEND_TYPE.DECLINED) {
                                callback(null, myself, myFriendNullOrDeclined, friendUsername); //process to create new invitation and pending friend
                            }
                            else { //if friend type = FRIEND or PENDING, do nothing
                                callback(201); //test this
                            }
                        }
                    });
                },

                function(myself, myFriendNullOrDeclined, friendUsername, callback) { //check the other has invite me
                    Invitation.findOne({'inviter':friendUsername, 'friendId': myself.userId}, function(err, foundOne){
                        if (err) { callback(403); }
                        else if (foundOne){
                            console.log('the other has invited me, reject or accept instead');
                            callback(201);
                        }
                        else {
                            callback(null, myself, myFriendNullOrDeclined, friendUsername);
                        }
                    });
                },

                function(myself, myFriendNullOrDeclined, friendUsername, callback) { //find friend object
                    User.findOne({'username': friendUsername }, function(err, friend) {
                        if (err) {
                            console.log('error retrieve friend data');
                            callback (403);
                        }
                        else if (friend === null) {
                            console.log('cannot find friend');
                            callback(403);
                        }
                        else {
                            callback(null, myself, myFriendNullOrDeclined, friend);
                        }
                    });
                },

                function(myself, myFriendNullOrDeclined, friend, callback) { //if already friend then check type
                    if (myFriendNullOrDeclined === null) {
                        myFriendNullOrDeclined = { friendId: friend.userId, username: friend.username, type: params.FRIEND_TYPE.PENDING };
                        myself.friends.push(myFriendNullOrDeclined);
                    }
                    else {
                        myFriendNullOrDeclined.type = params.FRIEND_TYPE.PENDING;
                    }

                    myself.save(function(err, user){    //update my friends
                        if (err) {
                            console.log("error save me and myfriends");
                            callback(403);
                        }
                        else {
                            callback(null, myself, friend);
                        }
                    });
                },

                function(myself, friend, callback) { //check invitation exist
                    var invitation = getInvitation(myself.username, myself.name, friend.userId);

                    //remove old invitation
                    Invitation.remove({'inviter': myself.username, 'friendId': friend.userId }, function(err){
                        if (err) {
                            console.log('error remove existing invitation!');
                            callback(403);
                        }
                        else {
                            console.log('create new one...');
                            callback(null, invitation);
                        }
                    });
                },

                function(invitation, callback) { //create new invitation
                    Invitation.create(new Invitation(invitation), function(err, newInv){
                        if (err) {
                            console.log(err);
                            callback(403);
                        }
                        else {
                            callback(null, newInv);
                        }
                    });
                }
            ],
            function (status, newInv) {
                if (status) { res.status(status).json(); }
                else {
                    res.status(201).json(newInv);
                }
            }
        );
    },

    GetMyInvitations: function(req, res) {
        var myId = req.params.myId;

        Invitation.find({'friendId': myId, 'declined': null}, function(err, invitations){
            if (err) { res.status(403).json(); }
            else {
                res.status(200).json(invitations);
            }
        });
    },

    GetMyFriends: function(req, res) {
        var myId = req.params.myId;

        User.findOne({'userId': myId}, function(err, myself){
            if (err || myself === null) {
                console.log('error getting myself');
                res.status(403).json();
            }
            else {
                var usernames = myself.friends.map(function(item){
                    return item.username;
                });

                console.log(usernames);

                User.find({'username': { $in: usernames } }, function(err, users){

                    if (err) { res.status(403).json(); }
                    else {
                        var myFriends = [];

                        for (var i = 0; i < users.length; i++) {
                            var usr = {
                                username: users[i].username,
                                name: users[i].name,
                                status: users[i].status,
                                type: -1
                            }

                            for (var j = 0; j < myself.friends.length; j++) {
                                if (myself.friends[j].username === usr.username) {
                                    usr.type = myself.friends[j].type;
                                    break;
                                }
                            }

                            myFriends.push(usr);
                        }
                        res.status(200).json(myFriends);
                    }
                });

            }
        });
    },

    RespondInvitation: function(req, res) {

        var myId = req.params.myId;
        var accept = req.body.accept;
        var invitationId = req.params.invitationId;
        if (accept === "true") {
            /*
                1. update declined = false for invitation
                2. the background will check the invitation, send the notification and delete the invitation
                3. insert friend to the invitee
                4. update friend to the inviter
            */
            async.waterfall(
                [
                    function (callback) { //1. update invitation
                        var o_id = new mongo.ObjectID(invitationId);
                        console.log(invitationId);
                        Invitation.findOneAndUpdate({ '_id': o_id }, {$set:{ declined: false } }, function(err, foundOne) {
                            if (err || foundOne === null) {
                                console.log('error update invitation declined flag !');
                                callback(403);
                            }
                            else {
                                callback(null, foundOne);
                            }
                        });
                    },

                    function (invitation, callback) { //2. update friend list of inviter

                        User.findOne({ 'username': invitation.inviter }, function(err, inviter){
                            if (err || inviter === null) {
                                console.log('cannot find inviter');
                                callback(403);
                            }
                            else {
                                var inviterFriends = inviter.friends;
                                for (var i = 0; i < inviterFriends.length; i++) {
                                    if (inviterFriends[i].friendId === invitation.friendId) {
                                        inviterFriends[i].type = params.FRIEND_TYPE.FRIEND;
                                        break;
                                    }
                                }
                                inviter.save(function(err, inv){
                                    if (err) {
                                        console.log('error saving friend to inviter list');
                                        callback(403);
                                    }
                                    else {
                                        callback(null, invitation, inv);
                                    }
                                });
                            }
                        });
                    },

                    function(invitation, inviter, callback) { //3. update friend list of invitee aka myself
                        User.findOne({ 'userId': myId }, function(err, myself){
                            if (err || myself === null) {
                                console.log('error finding invitee');
                                callback(403);
                            }
                            else {
                                var newFriend = { friendId: inviter.userId, username: inviter.username, type: params.FRIEND_TYPE.FRIEND };
                                myself.friends.push(newFriend);

                                myself.save(function(err, user){
                                    if (err) {
                                        console.log('error saving friend to invitee list');
                                        callback(403);
                                    }
                                    else {
                                        callback(null, inviter);
                                    }
                                });
                            }
                        });
                    }
                ],
                function(status, inviter){
                    if (status) { res.status(status).json(); }
                    else { res.status(200).json(inviter); }
                }
            );

        }
        else { //deny by updating the INVITATION's declined flag to TRUE + update friend -> declined
            var o_id = new mongo.ObjectID(invitationId);

            async.waterfall([
                function(callback){
                    Invitation.findOneAndUpdate({ '_id': o_id }, {$set:{ declined: true } }, function(err, updatedOne) {
                        if (err || updatedOne === null) {
                            console.log('error update invitation declined flag !');
                            callback(403);
                        }
                        else {
                            callback(null, updatedOne);
                        }
                    });
                },

                function(invitation, callback) {
                    //find invitername and update his friend to DECLINED
                    User.findOne({'username': invitation.inviter}, function(err, foundOne){
                        if (err || foundOne === null) {
                            console.log('error finding inviter user');
                            callback(403);
                        }
                        else {
                            var friends = foundOne.friends;
                            for (var i = 0; i < friends.length; i++) {
                                if (friends[i].friendId === myId) {
                                    friends[i].type = params.FRIEND_TYPE.DECLINED;
                                    break;
                                }
                            }
                            foundOne.save(function(err, usr){
                                if (err) {
                                    console.log('cannot save inviter\'s friend');
                                    callback(403);
                                }
                                else {
                                    callback(null, usr);
                                }
                            });
                        }
                    });
                }
            ],
            function(status, usr) {
                if (status) { res.status(status).json(); }
                else {
                    res.status(204).json();
                }
            });
        }
    },

    DeleteFriend: function(req, res) {

        var myId = req.params.myId;
        var friendUsername = req.params.friendUsername;

        async.waterfall(
            [
                function(callback) { //1. delete my friend
                    User.findOne({'userId':myId}, function(err, myself){
                        if (err || myself === null) { console.log('cannot get myself'); callback(403); }
                        else if (myself.friends) {
                            var idx = myself.friends.findIndex(f => f.username === friendUsername);
                            if (idx > -1) {
                                myself.friends.splice(idx, 1);
                            }
                            myself.save(function(err, me){
                                if (err) { console.log('cannot save my friend list'); callback(403); }
                                else callback(null, myId, friendUsername, myself.username);
                            });
                        }
                    });
                },

                function(myId, friendUsername, myUsername, callback) { //2. delete me from friend list
                    User.findOne({'username': friendUsername}, function (err, friend){
                        if (err || friend === null) { console.log('cannot get friend'); callback(403); }
                        else if (friend.friends) {
                            var idx = friend.friends.findIndex(f => f.friendId === myId);
                            if (idx > -1) {
                                friend.friends.splice(idx, 1);
                            }
                            friend.save(function(err, theFriend){
                                if (err) { console.log('cannot save friend\'s friend list'); callback(403); }
                                else
                                    callback(null, myId, friendUsername, myUsername, friend.userId);
                            });
                        }
                    });
                },

                function(myId, friendUsername, myUsername, friendId, callback) { //3. delete all inviations
                    Invitation.remove( { $or:[{'inviter': friendUsername, friendId: myId},
                                {'inviter': myUsername, friendId: friendId}] }, function(err){

                        if (err) { console.log('cannot delete invitations'); callback(403); }
                        else { callback(null, true); }
                    });
                },
            ],
            function(status, success){
                if (status) { res.status(status).json(); }
                else {
                    res.status(200).json();
                }
            }
        );
    },

    GetFriendLocation: function(req, res) {
        var myId = req.params.myId;
        var friendUsername = req.params.friendUsername;

        async.waterfall(
            [
                function(callback) { //check friend status
                    User.findOne({'userId':myId}, function(err, myself){
                        if (err || myself === null) { console.log('cannot get myself'); callback(403); }
                        else if (myself.hidden) { console.log('cannot get other\'s location'); callback(405);}
                        else {
                            myFriends = myself.friends;
                            var foundFriend = myFriends.some(function(item){
                                return item.username === friendUsername && item.type === params.FRIEND_TYPE.FRIEND;
                            });
                            if (!foundFriend) {
                                callback(403);
                            }
                            else {
                                callback(null, friendUsername);
                                console.log(friendUsername);
                            }
                        }
                    });
                },

                function(friendUsername, callback) {
                    User.findOne({'username': friendUsername}, function(err, friend){
                        if (err || friend === null) { console.log('cannot get friend'); callback(403); }
                        else if (friend.hidden) { console.log('friend is hidden!'); callback(402);}
                        else {
                            var location = {
                                latitude: friend.latitude,
                                longitude: friend.longitude,
                                accuracy: friend.accuracy,
                                timestamp: friend.timestamp
                            };
                            callback(null, location);
                        }
                    });
                }
            ],
            function(err, location) {
                if (err) {
                    if (err === 405)
                        res.status(err).json({Message:"I am hidden and cannot search other's location!"});
                    else if (err === 402)
                        res.status(err).json({Message:"Friend selects to be hidden"});
                    else
                        res.status(err).json({Message:"Cannot retrieve data! Or you guys are no longer friend!"});
                }
                else {
                    res.status(200).json(location);
                }
            }
        );
    },

    SaveUser: function(user, res) {
        user.save(function(err, user){
            if (err) { res.status(403).json({msg: err}); }
            else { res.status(201).json(user);}
        });
    },

    CreateInvitation: function(invitation, res) {
        Invitation.create(invitation, function(err, inv){
            if (err) { res.status(403).json({msg: err}); }
            else { res.status(201).json(inv); }
        });
    },

    SaveInvitation: function(invitation, res) {
        invitation.save(function(err, inv){
            if (err) { res.status(403).json({msg:err}); }
            else { res.status(200).json(inv); }
        });
    },

    FindAndRemove: function(req, res, next) {
        var username = req.body.username;

        User.findOneAndRemove( { 'username': username }, function(err){
            if (err) { res.status(500).send(err); }
            else { res.json({msg:"deleted"}); }
        });
    },

    RemoveAll: function(req, res) {
        User.remove({}, function(err){
            if (err) { return next(err); }
            res.json({msg:"deleted"});
        });
    }
}

module.exports = UserController;
