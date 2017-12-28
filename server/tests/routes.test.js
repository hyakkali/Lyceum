const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');
const session = require('supertest-session');

const {app} = require('./../server');
const {Community} = require('./../models/community');
const {Topic} = require('./../models/topic');
const {User} = require('./../models/user');
const {Post} = require('./../models/post');

const {
  communities,
  populateComms,
  // topics,
  // populateTopics,
  users,
  populateUsers,
  resources,
  populateResources
} = require('./seed/seed');

var testSession = null;

beforeEach(()=>{
  testSession = session(app);
})

beforeEach(populateComms);
// beforeEach(populateTopics);
beforeEach(populateUsers);
beforeEach(populateResources);

describe('After logging in', ()=> {

  var authenticatedSession;

  beforeEach(function (done) {
    testSession.post('/login')
      .send({
        email:users[1].email,
        password:users[1].password
      })
      .expect(302)
      .end(function (err) {
        if (err) return done(err);
        authenticatedSession = testSession;
        return done();
      });
  });

  describe('GET /profile', ()=> {
    it('should get profile if authenticated', (done)=> {
        testSession.get('/profile')
        .expect(200)
        .end(done)
    });
  });

  describe('GET /logout', ()=> {
    it('should logout user', (done)=> {
        testSession.get('/logout')
        .expect(302)
        .end((err,res)=>{
          if (err) {
            return done(err);
          }
          done();
        });
    });
  });

  describe('POST /community-create', ()=> {
    it('should create a new community', (done) =>{
        testSession.post('/community-create')
        .send({
          name:'Relative Physics',
          description:'Generic description',
        })
        .expect(302)
        .end((err,res)=>{
          if (err) {
            return done(err);
          }
          Community.find({name:'Relative Physics'}).then((comms)=>{
            expect(comms.length).toBe(1);
          }).catch((e)=>done(e));
          Community.findOne({name:'Relative Physics'}).then((comm)=>{
            expect(comm.name).toBe('Relative Physics');
            expect(comm.description).toBe('Generic description');
            done();
          }).catch((e)=>done(e));
        });
    });

    it('should not create community with invalid body data', (done) =>{
        testSession.post('/community-create')
        .send({})
        .expect(400)
        .end((err,res)=>{
          if (err) {
            return done(err);
          }

          Community.find().then((comms)=>{
            expect(comms.length).toBe(2); //2 comms in seed data
            done();
          }).catch((e)=>done(e));
        });
    });
  });

  describe('GET /community/:id', ()=> {
    it('should return community', (done) =>{
        testSession.get(`/community/${communities[0]._id.toHexString()}`)
        .expect(200)
        .end(done);
    });
  });

  describe('POST /post', ()=> {
    it('should create a new post', (done)=> {
      var id = communities[0]._id.toHexString();
      testSession.post(`/post/${id}`)
        .send({message:"New message!"})
        .expect(302)
        .end((err,res)=>{
          if (err) {
            return done(err);
          }
          Post.find({community:id}).then((post)=>{
            expect(post.length).toBe(1);
          }).catch((e)=>done(e));
          Post.findOne({community:id}).then((post)=>{
            expect(post.message).toBe("New message!")
            done();
          }).catch((e)=>done(e));
        });
    });
  });

  describe('POST /community-update/:id', ()=> {
    it('should update the community if owner', (done)=> {
      var id = communities[1]._id.toHexString();
      var name = 'Update name';
      var description = 'Update name';

      testSession.post(`/community-update/${id}`)
        .send({
          name,
          description,
        })
        .expect(302)
        .end((err,res)=>{
          if (err) {
            return done(err);
          }
          Community.findById(id).then((comm)=>{
            expect(comm.name).toBe(name);
            expect(comm.description).toBe(description);
            done();
          }).catch((e)=>done(e));
        })
    });

    it('should not update the community if not owner', (done)=> {
      var id = communities[0]._id.toHexString();
      var name = 'Update name';
      var description = 'Update name';

      testSession.post(`/community-update/${id}`)
        .send({
          name,
          description,
        })
        .expect(401)
        .end(done)
    });
  });

  describe('POST /community-delete/:id', ()=> {
    it('should remove a community if owner', (done) =>{
      var id = communities[1]._id.toHexString();

      testSession.post(`/community-delete/${id}`)
        .expect(302)
        .end((err,res)=>{
          if (err) {
            return done(err);
          }
          Community.findById(id).then((comm)=>{
            expect(comm).toBeFalsy();
            done();
          }).catch((e)=>done(e));
        });
    });

    it('should not remove a community if not owner', (done) =>{
      var id = communities[0]._id.toHexString();

      testSession.post(`/community-delete/${id}`)
        .expect(401)
        .end(done)
    });

    it('should return a 404 if community not found', (done) =>{
      var id = new ObjectID().toHexString();
      testSession.post(`/community-delete/${id}`)
        .expect(404)
        .end(done);
    });
  });


});

// USER

describe('POST /register', ()=> {
  it('should create a new user', (done) =>{
    var first_name = 'First';
    var last_name = 'Last';
    var email = 'sample@gmail.com';
    var username = 'sampleusername';
    var password = 'samplepassword';

    request(app)
      .post('/register')
      .send({first_name,last_name,email,username,password})
      .expect(302)

      .end((err)=>{
        if (err) {
          return done(err);
        }
        User.findOne({email}).then((user)=>{
          expect(user).toBeTruthy();
          expect(user.password).not.toBe(password);
          done();
        }).catch((e)=>done(e));
      });
  });

  it('should return validation errors if request invalid', (done)=> {
    var first_name = 'First';
    var last_name = 'Last';
    var email = '';
    var username = 'sampleusername';
    var password = 'samplepassword';

    request(app)
      .post('/register')
      .send({first_name,last_name,email,username,password})
      .expect(400)
      .end(done);
    });

    it('should not create user if email in use', (done) =>{
      request(app)
        .post('/register')
        .send({
          first_name:'First',
          last_name:'Last',
          email:users[0].email,
          username:'newusername',
          password:'samplepassword'
        })
        .expect(400)
        .end(done);
    });

    it('should not create user if username in use', (done) =>{
      request(app)
        .post('/register')
        .send({
          first_name:'First',
          last_name:'Last',
          email:'username@gmail.com',
          username:users[0].username,
          password:'samplepassword'
        })
        .expect(400)
        .end(done);
    });
});

describe('GET /profile', ()=> {
  it('should return 401 if not authenticated', (done)=> {
    request(app)
      .get('/profile')
      .expect(401)
      .end(done)
  });
});

describe('POST /login', ()=> {
  it('should login user and redirect to profile page', (done)=> {
    request(app)
      .post('/login')
      .send({
        email:users[1].email,
        password:users[1].password
      })
      .expect(302)

      .end((err,res)=>{
        if (err) {
          return done(err);
        }
        done();
      });
  });

  it('should reject invalid login', (done)=> {
    request(app)
      .post('/login')
      .send({
        email:users[1].email,
        password:users[1].password+'abcd'
      })
      .expect(401)
      .end((err,res)=>{
        if (err) {
          return done(err);
        }
        done();
      });
  });
});

// TOPIC

// describe('POST /topic-create', ()=> {
//   it('should create a new topic', (done) =>{
//     request(app)
//       .post('/topic-create')
//       .send({
//         name:'Relative Physics',
//         description: 'Generic description',
//         material:[
//           'https://thenounproject.com/',
//           'https://en.wikipedia.org/wiki/Quantum_computing'
//         ]
//       })
//       .expect(302)
//       // .expect((res)=>{
//       //   expect(res.body.name).toBe('Relative Physics');
//       //   expect(res.body.description).toBe('Generic description');
//       //   expect(res.body.material).toEqual([
//       //     'https://thenounproject.com/',
//       //     'https://en.wikipedia.org/wiki/Quantum_computing'
//       //   ]);
//       // })
//       .end((err,res)=>{
//         if (err) {
//           return done(err);
//         }
//         Topic.find({
//           name:'Relative Physics'
//         }).then((topics)=>{
//           expect(topics.length).toBe(1);
//           done();
//         }).catch((e)=>done(e));
//       });
//   });
//
//   it('should not create topic with invalid body data', (done) =>{
//     request(app)
//       .post('/topic-create')
//       .send({})
//       .expect(400)
//       .end((err,res)=>{
//         if (err) {
//           return done(err);
//         }
//
//         Topic.find().then((topics)=>{
//           expect(topics.length).toBe(2); //2 comms in seed data
//           done();
//         }).catch((e)=>done(e));
//       });
//   });
// });
//
// describe('GET /topics', ()=>{
//   it('should return all topics', (done)=> {
//     request(app)
//       .get('/topics')
//       .expect(200)
//       .expect((res)=>{
//         expect(res.body.topics.length).toBe(2);
//       })
//       .end(done);
//   });
// });
//
// describe('GET /topic/:id', ()=> {
//   it('should return topic', (done) =>{
//     request(app)
//       .get(`/topic/${topics[0]._id.toHexString()}`)
//       .expect(200)
//       .expect((res)=>{
//         expect(res.body.topic.name).toBe(topics[0].name);
//         expect(res.body.topic.description).toBe(topics[0].description);
//         expect(res.body.topic.createdAt).toBe(topics[0].createdAt);
//         expect(res.body.topic.material).toEqual(topics[0].material);
//       })
//       .end(done);
//   });
// });
