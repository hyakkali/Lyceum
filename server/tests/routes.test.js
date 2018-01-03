const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');
const session = require('supertest-session');

const {app} = require('./../server');
const {Topic} = require('./../models/topic');
const {User} = require('./../models/user');
const {Post} = require('./../models/post');
const {Resource} = require('./../models/resource');
const {Review} = require('./../models/review');

const {
  topics,
  populateTopics,
  users,
  populateUsers,
  resources,
  populateResources
} = require('./seed/seed');

var testSession = null;

beforeEach(()=>{
  testSession = session(app);
})

beforeEach(populateTopics);
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

  describe('POST /topic-create', ()=> {
    it('should create a new topic', (done) =>{
        testSession.post('/topic-create')
        .send({
          name:'Relative Physics',
          description:'Generic description',
        })
        .expect(302)
        .end((err,res)=>{
          if (err) {
            return done(err);
          }
          Topic.find({name:'Relative Physics'}).then((comms)=>{
            expect(comms.length).toBe(1);
            expect(comms[0].name).toBe('Relative Physics');
            expect(comms[0].description).toBe('Generic description');
            done();
          }).catch((e)=>done(e));
        });
    });

    it('should not create topic with invalid body data', (done) =>{
        testSession.post('/topic-create')
        .send({})
        .expect(400)
        .end((err,res)=>{
          if (err) {
            return done(err);
          }

          Topic.find().then((comms)=>{
            expect(comms.length).toBe(2); //2 comms in seed data
            done();
          }).catch((e)=>done(e));
        });
    });
  });

  describe('GET /topic/:id', ()=> {
    it('should return topic', (done) =>{
        testSession.get(`/topic/${topics[0]._id.toHexString()}`)
        .expect(200)
        .end(done);
    });
  });

  describe('POST /topic-update/:id', ()=> {
    it('should update the topic if owner', (done)=> {
      var id = topics[1]._id.toHexString();
      var name = 'Update name';
      var description = 'Update name';

      testSession.post(`/topic-update/${id}`)
        .send({
          name,
          description,
        })
        .expect(302)
        .end((err,res)=>{
          if (err) {
            return done(err);
          }
          Topic.findById(id).then((comm)=>{
            expect(comm.name).toBe(name);
            expect(comm.description).toBe(description);
            done();
          }).catch((e)=>done(e));
        })
    });

    it('should not update the topic if not owner', (done)=> {
      var id = topics[0]._id.toHexString();
      var name = 'Update name';
      var description = 'Update name';

      testSession.post(`/topic-update/${id}`)
        .send({
          name,
          description,
        })
        .expect(401)
        .end(done)
    });
  });

  describe('POST /topic-delete/:id', ()=> {
    it('should remove a topic if owner', (done) =>{
      var id = topics[1]._id.toHexString();

      testSession.post(`/topic-delete/${id}`)
        .expect(302)
        .end((err,res)=>{
          if (err) {
            return done(err);
          }
          Topic.findById(id).then((comm)=>{
            expect(comm).toBeFalsy();
            done();
          }).catch((e)=>done(e));
        });
    });

    it('should not remove a topic if not owner', (done) =>{
      var id = topics[0]._id.toHexString();

      testSession.post(`/topic-delete/${id}`)
        .expect(401)
        .end(done)
    });

    it('should return a 404 if topic not found', (done) =>{
      var id = new ObjectID().toHexString();
      testSession.post(`/topic-delete/${id}`)
        .expect(404)
        .end(done);
    });
  });

  describe('POST /post/:id', ()=> {
    it('should create a new post', (done)=> {
      var id = topics[0]._id.toHexString();
      testSession.post(`/post/${id}`)
        .send({message:"New message!"})
        .expect(302)
        .end((err,res)=>{
          if (err) {
            return done(err);
          }
          Post.find({topic:id}).then((post)=>{
            expect(post.length).toBe(1);
            expect(post[0].message).toBe("New message!")
            done();
          }).catch((e)=>done(e));
        });
    });
  });

  describe('POST /resource/:id', ()=>{
    it('should create a new resource',(done)=>{
      var id = topics[0]._id.toHexString();
      var name = 'Wikipedia entry on Quantum computing';
      var link = 'https://en.wikipedia.org/wiki/Quantum_computing';
      var description = 'Wikipedia entry on quantum computing';

      testSession.post(`/resource/${id}`)
        .send({name,link,description})
        .expect(302)
        .end((err,res)=>{
          if (err) {
            return done(err);
          }
          Resource.find({topic:id}).then((resource)=>{
            expect(resource.length).toBe(3); //already two resources in topic from seed
            expect(resource[2].name).toBe(name);
            expect(resource[2].link).toBe(link);
            expect(resource[2].description).toBe(description);
            done();
          }).catch((e)=>done(e));
        })
    })
  })

  describe('POST /review/:id/:commid',()=>{
    it('should add like to and post review of the resource',(done)=>{
      var id = resources[2]._id.toHexString();
      var commid = topics[1]._id.toHexString();

      testSession.post(`/review/${id}/${commid}`)
        .send({
          message:'This resource is great!',
          rating:'like'
        })
        .expect(302)
        .end((err,res)=>{
          if (err) {
            return done(err);
          }
          Resource.findById(id).then((resource)=>{
            expect(resource.likes).toBe(5) //originally 4
            expect(resource.dislikes).toBe(14) //originally 14
          }).catch((e)=>done(e));
          Review.find({resource:id}).then((reviews)=>{
            expect(reviews.length).toBe(1);
            expect(reviews[0].message).toBe('This resource is great!');
            expect(reviews[0].liked).toBe(true);
            expect(reviews[0].disliked).toBe(false);
            done();
          }).catch((e)=>done(e));
        });
    });

    it('should add dislike to and post review of the resource',(done)=>{
      var id = resources[2]._id.toHexString();
      var commid = topics[1]._id.toHexString();

      testSession.post(`/review/${id}/${commid}`)
        .send({
          message:'This resource sucks!',
          rating:'dislike'
        })
        .expect(302)
        .end((err,res)=>{
          if (err) {
            return done(err);
          }
          Resource.findById(id).then((resource)=>{
            expect(resource.likes).toBe(4) //originally 4
            expect(resource.dislikes).toBe(15) //originally 14
          }).catch((e)=>done(e));
          Review.find({resource:id}).then((reviews)=>{
            expect(reviews.length).toBe(2); //2 because of review from above test
            expect(reviews[1].message).toBe('This resource sucks!');
            expect(reviews[1].liked).toBe(false);
            expect(reviews[1].disliked).toBe(true);
            done();
          }).catch((e)=>done(e));
        });
    });

    it('should not add review if user already posted one', (done)=> {
      var id = resources[0]._id.toHexString();
      var commid = topics[0]._id.toHexString();

      testSession.post(`/review/${id}/${commid}`)
      .send({
        message:'This resource sucks!',
        rating:'dislike'
      })
      .expect(401)
      .end(done)
    });

    it('should not allow owner of resource to post review', (done)=> {
      var id = resources[1]._id.toHexString();
      var commid = topics[1]._id.toHexString();

      testSession.post(`/review/${id}/${commid}`)
      .send({
        message:'This resource sucks!',
        rating:'dislike'
      })
      .expect(401)
      .end(done)
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
