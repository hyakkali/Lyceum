const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');
const mongoose = require('mongoose');

const {app} = require('./../server');
const {Community} = require('./../models/community');
const {Topic} = require('./../models/topic');
const {User} = require('./../models/user');
const {Post} = require('./../models/post');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/CommunityTest');

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

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/CommunityTest');

beforeEach(populateComms);
// beforeEach(populateTopics);
beforeEach(populateUsers);
beforeEach(populateResources);


// USER

describe('POST /register', ()=> {
  it('should create a new user', (done) =>{
    var first_name = 'First';
    var last_name = 'Last';
    var email = 'sample@gmail.com';
    var password = 'samplepassword';

    request(app)
      .post('/register')
      .send({first_name,last_name,email,password})
      .expect(302)
      // .expect((res)=>{
      //   expect(res.body._id).toBeTruthy();
      //   expect(res.body.first_name).toBe(first_name);
      //   expect(res.body.last_name).toBe(last_name);
      //   expect(res.body.email).toBe(email);
      // })
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
    var email = 'sample@';
    var password = 'samplepassword';

    request(app)
      .post('/register')
      .send({first_name,last_name,email,password})
      .expect(400)
      .end(done);
    });

    it('should not create user if email in use', (done) =>{
      request(app)
        .post('/register')
        .send({
          email:users[0].email,
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
      .expect((res)=>{
        expect(res.body).toEqual({})
      })
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

describe('GET /logout', ()=> {
  it('should logout user', (done)=> {
    request(app)
      .get('/logout')
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
    request(app)
      .post('/community-create')
      .send({
        name:'Relative Physics',
        description: 'Generic description',
      })
      .expect(302)
      // .expect((res)=>{
      //   expect(res.body.name).toBe('Relative Physics');
      //   expect(res.body.description).toBe('Generic description');
      //   expect(res.body.material).toEqual([
      //     'https://thenounproject.com/',
      //     'https://en.wikipedia.org/wiki/Quantum_computing'
      //   ]);
      // })
      .end((err,res)=>{
        if (err) {
          return done(err);
        }
        Community.find({
          name:'Relative Physics'
        }).then((comms)=>{
          expect(comms.length).toBe(1);
          done();
        }).catch((e)=>done(e));
      });
  });

  it('should not create community with invalid body data', (done) =>{
    request(app)
      .post('/community-create')
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

describe('GET /communities', ()=>{
  it('should return all communities', (done)=> {
    request(app)
      .get('/communities')
      .expect(200)
      .expect((res)=>{
        expect(res.body.comms.length).toBe(2);
      })
      .end(done);
  });
});

describe('GET /community/:id', ()=> {
  it('should return community', (done) =>{
    request(app)
      .get(`/community/${communities[0]._id.toHexString()}`)
      .expect(200)
      .expect((res)=>{
        expect(res.body.comm.name).toBe(communities[0].name);
        expect(res.body.comm.description).toBe(communities[0].description);
        expect(res.body.comm.createdAt).toBe(communities[0].createdAt);
        expect(res.body.comm.material).toEqual(communities[0].material);
      })
      .end(done);
  });
});

describe('PATCH /community/:id', ()=> {
  it('should update the todo', (done)=> {
    var id = communities[0]._id.toHexString();
    var name = 'Update name';
    var description = 'Update name';
    var material = ['https://calendar.google.com/','https://www.facebook.com/'];

    request(app)
      .patch(`/community/${id}`)
      .send({
        name,
        description,
        material
      })
      .expect(200)
      .expect((res)=>{
        expect(res.body.comm.name).toBe(name);
        expect(res.body.comm.description).toBe(description);
        expect(res.body.comm.material).toEqual(material);
      })
      .end(done)
  });
});

describe('DELETE /community/:id', ()=> {
  it('should remove a community', (done) =>{
    var id = communities[0]._id.toHexString();

    request(app)
      .delete(`/community/${id}`)
      .expect(200)
      .expect((res)=>{
        expect(res.body.comm._id).toBe(id)
      })
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

  it('should return a 404 if community not found', (done) =>{
    var id = new ObjectID().toHexString();
    request(app)
      .delete(`/community/${id}`)
      .expect(404)
      .end(done);
  });

  it('should return a 404 if object is invalid', (done) =>{
    request(app)
      .delete('/community/12344')
      .expect(404)
      .end(done);
  });
});

// POST

describe('POST /post', ()=> {
  it('should create a new post', (done)=> {
    request(app)
      .post('/post')
      .send({message:"New message!"})
      .expect(200)
      .expect((res)=>{
        expect(res.body.message).toBe('New message!')
      })
      .end((err,res)=>{
        if (err) {
          return done(err);
        };
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
