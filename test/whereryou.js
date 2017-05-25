let mongoose = require('mongoose');

let User = require('../models/user');
let Invitation = require('../models/invitation');

let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let should = chai.should();
let expect = chai.expect;
let util = require('util');
let params = require('../params');

chai.use(chaiHttp);

let user1 = {
    "id": "9959024B-1805-439B-8E08-075474B6D369",
    "username":"jerry",
    "name":"Jerry Nguyen",
};

let user1Location = {
    "latitude": "37.3312366600000002",
    "longitude": "127.3312366600000002",
    "accuracy": 30
};

let user1StatusName = {
    "status": "I am bored",
    "name": "Jerry De Handsome"
}

let user1Hidden = {
    "hidden": "true"
}

let user2 = {
    "id": "F019C22C-4652-4D32-AB47-AEAC1E278982",
    "username": "vanny",
    "name": "Le Van Tran"
};

let user3 = {
    "id": "ID_USER_3",
    "username": "annie",
    "name": "Annie Nguyen"
};

var user2InvitationIdFromUser1;
var user2InvitationIdFromUser3;

function user2WithId1() {
    return {
        "id": user1.id,
        "username":"vanny",
        "name":"Vanny Tan"
    }
}

function user3WithOldUsername() {
    return {
        "id": "ID123456",
        "username":"jerry",
        "name":"Tom cat"
    }
}

function removeAllUsers() {
    User.remove({}, function(err){
        //console.log(err);
    });
}

function removeAllInvitations() {
    Invitation.remove({}, function(err){});
}

describe('TEST CASE', () => {

    /*
    beforeEach((done) => {
        User.remove({}, (err) => {
            done();
        });
    });
    */
    removeAllUsers();

    removeAllInvitations();

    describe('I. LIST ALL USERS', () => {
        it('1. it should GET all users', (done) => {
            chai.request(server)
                .get('/where/users')
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.length.should.be.eql(0);
                    done();
                });
        });
    });

    describe('II. REGISTER USER', () => {
        it('1. it should create 1st user: jerry', (done) => {
            var user = user1;

            chai.request(server)
                .post('/where/users')
                .send(user)
                .end((err, res) => {
                    res.should.have.status(201);
                    res.body.should.be.a('object');
                    res.body.should.have.property('username');
                    res.body.should.have.property('username').eql(user.username);
                    done();
                });
        });

        it('2. it should warn when userId already existed', (done) => {
            var user = user2WithId1();

            chai.request(server)
                .post('/where/users')
                .send(user)
                .end((err, res) => {
                    res.should.have.status(204);
                    done();
                });
        });

        it('3. it should warn when username already used by other', (done) =>{
            var user = user3WithOldUsername();

            chai.request(server)
                .post('/where/users')
                .send(user)
                .end((err, res) => {
                    res.should.have.status(409);
                    done();
                });
        });

        it('4. it should create 2nd user: vanny', (done) => {
            var user = user2;

            chai.request(server)
                .post('/where/users')
                .send(user)
                .end((err, res) => {
                    res.should.have.status(201);
                    res.body.should.be.a('object');
                    res.body.should.have.property('username');
                    res.body.should.have.property('username').eql(user.username);
                    done();
                });
        });

        it('5. it should create 3rd user: annie', (done) => {
            var user = user3;

            chai.request(server)
                .post('/where/users')
                .send(user)
                .end((err, res) => {
                    res.should.have.status(201);
                    res.body.should.be.a('object');
                    res.body.should.have.property('username');
                    res.body.should.have.property('username').eql(user.username);
                    done();
                });
        });

        it('6. jerry login successfully to his account', (done) =>{
            var user = user1;
            var url = util.format('/where/users/%s', user1.id);
            chai.request(server)
                .get(url)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('userId');
                    res.body.should.have.property('userId').eql(user.id);
                    done();
                });
        });
    });

    describe('III. USER INFO', () => {
        it('1. it should update jerry location', (done) => {
            chai.request(server)
                .patch('/where/users/' + user1.id)
                .send(user1Location)
                .end((err, res) => {
                    res.should.have.status(201);
                    res.body.should.have.property('latitude').eql(user1Location.latitude);
                    res.body.should.have.property('longitude').eql(user1Location.longitude);
                    res.body.should.have.property('accuracy').eql(user1Location.accuracy);
                    done();
                });
        });

        it('2. it should update jerry\'s status and name', (done) => {
            var url = util.format('/where/users/%s', user1.id);
            chai.request(server)
                .patch(url)
                .send(user1StatusName)
                .end((err, res) => {
                    res.should.have.status(201);
                    res.body.should.have.property('status').eql(user1StatusName.status);
                    res.body.should.have.property('name').eql(user1StatusName.name);
                    done();
                });
        });
    });



    describe('IV. INVITATIONS && FRIENDS', () => {
        it('1. jerry sends vanny an invitation', (done) => {
            var url = util.format('/where/users/%s/friends/%s', user1.id, user2.username);
            chai.request(server)
                .post(url)
                .end((err, res) => {
                    console.log(res.body);
                    res.should.have.status(201);
                    res.body.should.have.property('inviter').eql(user1.username);
                    res.body.should.have.property('inviterName').eql(user1StatusName.name);
                    res.body.should.have.property('friendId').eql(user2.id);
                    expect(res.body.declined).to.be.undefined;
                    done();
                });
        });

        it('2. annie sends vanny an invitation', (done) => {
            var url = util.format('/where/users/%s/friends/%s', user3.id, user2.username);
            chai.request(server)
                .post(url)
                .end((err, res) => {
                    res.should.have.status(201);
                    res.body.should.have.property('inviter').eql(user3.username);
                    res.body.should.have.property('inviterName').eql(user3.name);
                    res.body.should.have.property('friendId').eql(user2.id);
                    expect(res.body.declined).to.be.undefined;
                    done();
                });
        });

        it('3. vanny should get 2 invitations', (done) => {
            var url = util.format('/where/users/%s/invitations', user2.id);
            chai.request(server)
                .get(url)
                .end((err, res) => {
                    user2InvitationIdFromUser1 = res.body[0]._id;
                    user2InvitationIdFromUser3 = res.body[1]._id;

                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.length.should.be.eql(2);
                    expect(res.body[0].inviter).to.equal(user1.username);
                    expect(res.body[0].friendId).to.equal(user2.id);
                    expect(res.body[1].inviter).to.equal(user3.username);
                    expect(res.body[1].friendId).to.equal(user2.id);
                    done();
                });
        });

        it('4. jerry should get vanny as a PENDING friend', (done) => {
            var url = util.format('/where/users/%s/friendsAndInvitations', user1.id);
            chai.request(server)
                .get(url)
                .end((err, res) => {
                    console.log(res.body);
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.length.should.be.eql(1);
                    expect(res.body[0].username).to.equal(user2.username);
                    expect(res.body[0].name).to.equal(user2.name);
                    expect(res.body[0].type).to.equal(params.FRIEND_TYPE.PENDING);
                    done();
                });
        });

        it('5. annie should get vanny as a PENDING friend', (done) => {
            var url = util.format('/where/users/%s/friendsAndInvitations', user3.id);
            chai.request(server)
                .get(url)
                .end((err, res) => {
                    console.log(res.body);
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.length.should.be.eql(1);
                    expect(res.body[0].username).to.equal(user2.username);
                    expect(res.body[0].name).to.equal(user2.name);
                    expect(res.body[0].type).to.equal(params.FRIEND_TYPE.PENDING);
                    done();
                });
        });

        it('6.1 jerry now send the invitation to vanny and should not do anything', (done) => {
            var url = util.format('/where/users/%s/friends/%s', user1.id, user2.username);
            chai.request(server)
                .post(url)
                .end((err, res) => {
                    res.should.have.status(201);
                    expect(res.body).to.equal('');

                    done();
                });
        });

        it('6.2 vanny now send the invitation to jerry and should not do anything', (done) => {
            var url = util.format('/where/users/%s/friends/%s', user2.id, user1.username);
            chai.request(server)
                .post(url)
                .end((err, res) => {
                    console.log(res.body);
                    res.should.have.status(201);
                    expect(res.body).to.equal('');
                    done();
                });
        });

        it('7. vanny accepts jerry\'s invitation', (done) => {
            var data = { "accept": "true" }
            var url = util.format('/where/users/%s/invitations/%s', user2.id, user2InvitationIdFromUser1);
            chai.request(server)
                .patch(url)
                .send(data)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property('username').eql(user1.username);
                    res.body.should.have.property('name').eql(user1StatusName.name);
                    done();
                });
        });

        it('8. both vanny and jerry should have each other in friend list', (done) => {
            var url = util.format('/where/users/%s/friendsAndInvitations', user1.id);
            chai.request(server)
                .get(url)
                .end((err, res) => {
                    done();
                });
        });

        it('9. after vanny & jerry are friends, vanny invites jerry again and it should do nothing', (done) => {
            var url = util.format('/where/users/%s/friends/%s', user2.id, user1.username);
            chai.request(server)
                .post(url)
                .end((err, res) => {
                    res.should.have.status(201);
                    expect(res.body).to.equal('');
                    done();
                });
        });

        it('10. jerry invites vanny again and it should do nothing', (done) => {
            var url = util.format('/where/users/%s/friends/%s', user1.id, user2.username);
            chai.request(server)
                .post(url)
                .end((err, res) => {
                    res.should.have.status(201);
                    expect(res.body).to.equal('');
                    done();
                });
        });

        it('11. vanny rejects annie\'s invitation', (done) => {
            var data = { "accept": "false" }
            var url = util.format('/where/users/%s/invitations/%s', user2.id, user2InvitationIdFromUser3);
            chai.request(server)
                .patch(url)
                .send(data)
                .end((err, res) => {
                    res.should.have.status(204);
                    done();
                });
        });


        it('12. annie sends vanny an invitation AGAIN and vanny accepts', (done) => {
            var url = util.format('/where/users/%s/friends/%s', user3.id, user2.username);
            chai.request(server)
                .post(url)
                .end((err, res) => {
                    res.should.have.status(201);
                    done();
                });


        });

        it('13. vanny should get 1 new invitations', (done) => {
            var url = util.format('/where/users/%s/invitations', user2.id);
            chai.request(server)
                .get(url)
                .end((err, res) => {
                    user2InvitationIdFromUser3 = res.body[0]._id;
                    done();
                });
        });

        it('14. vanny this time accepts annie invitation', (done) => {
            var data = { "accept": "true" }
            var url = util.format('/where/users/%s/invitations/%s', user2.id, user2InvitationIdFromUser3);
            chai.request(server)
                .patch(url)
                .send(data)
                .end((err, res) => {
                    res.should.have.status(200);
                    done();
                });
        });

        it('15. annie deletes vanny, all the related invitations are deleted too!', (done) => {
            var url = util.format('/where/users/%s/friends/%s', user3.id, user2.username);
            chai.request(server)
                .delete(url)
                .end((err, res) => {
                    res.should.have.status(200);
                    done();
                })
        });
    });

    describe('V. LOCATIONS', () => {
        it('1. vanny should be able to get jerry\'s location', (done) => {
            var url = util.format('/where/users/%s/friends/%s/location', user2.id, user1.username);
            chai.request(server)
                .get(url)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property('longitude');
                    res.body.should.have.property('latitude');
                    res.body.should.have.property('accuracy');
                    res.body.should.have.property('timestamp');
                    done();
                });
        });

        it('2. jerry should be able to get vanny\'s location', (done) => {
            var url = util.format('/where/users/%s/friends/%s/location', user1.id, user2.username);
            chai.request(server)
                .get(url)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property('longitude');
                    res.body.should.have.property('latitude');
                    res.body.should.have.property('accuracy');
                    res.body.should.have.property('timestamp');
                    done();
                });
        });

        it('3. annie cannot get vanny\'s location', (done) => {
            var url = util.format('/where/users/%s/friends/%s/location', user3.id, user2.username);
            chai.request(server)
                .get(url)
                .end((err, res) => {
                    res.should.have.status(403);
                    done();
                });
        });

        it('4. vanny cannot get annie\'s location', (done) => {
            var url = util.format('/where/users/%s/friends/%s/location', user2.id, user3.username);
            chai.request(server)
                .get(url)
                .end((err, res) => {
                    res.should.have.status(403);
                    done();
                });
        });

        it('5. vanny updates hidden status -> true', (done) => {
            var url = util.format('/where/users/%s', user2.id);
            chai.request(server)
                .patch(url)
                .send({"hidden": "true"})
                .end((err, res) => {
                    res.should.have.status(201);
                    done();
                });
        });

        it('6. jerry cannot get vanny\'s location', (done) => {
            var url = util.format('/where/users/%s/friends/%s/location', user1.id, user2.username);
            chai.request(server)
                .get(url)
                .end((err, res) => {
                    console.log(res.body);
                    res.should.have.status(402); //friend is hidden
                    done();
                });
        });

        it('7. vanny cannot get jerry location too', (done) => {
            var url = util.format('/where/users/%s/friends/%s/location', user2.id, user1.username);
            chai.request(server)
                .get(url)
                .end((err, res) => {
                    console.log(res.body);
                    res.should.have.status(405); //friend is hidden
                    done();
                });
        });

    });
});
