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
  populateResources,
  reviews,
  populateReviews
} = require('./seed');

var testSession = null;

beforeEach(()=>{
  testSession = session(app);
})

beforeEach(populateTopics);
beforeEach(populateUsers);
beforeEach(populateResources);
beforeEach(populateReviews);

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
      var id = users[1]._id.toHexString();
        testSession.get('/profile/'+id)
        .expect(200)
        .end(done)
    });
  });

  describe('POST /logout', ()=> {
    it('should logout user', (done)=> {
        testSession.post('/logout')
        .expect(302)
        .end((err,res)=>{
          if (err) {
            return done(err);
          }
          done();
        });
    });
  });

  describe('POST /user-update', ()=> {
    it('should update the user ', (done)=> {
      var first_name = 'Hemanth';
      var last_name = 'Yakkali';
      var email = 'hemanth@gmail.com';
      var username = 'newUsername';
      var id = users[1]._id.toHexString();

      testSession.post('/user-update')
        .send({
          first_name,
          last_name,
          email,
          username
        })
        .expect(302)
        .end((err,res)=>{
          if (err) {
            return done(err);
          }
          User.findById(id).then((user)=>{
            expect(user.first_name).toBe(first_name);
            expect(user.last_name).toBe(last_name);
            expect(user.email).toBe(email);
            expect(user.username).toBe(username);
            done();
          }).catch((e)=>done(e));
        })
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
          Topic.find({name:'Relative Physics'}).then((topics)=>{
            expect(topics.length).toBe(1);
            expect(topics[0].name).toBe('Relative Physics');
            expect(topics[0].description).toBe('Generic description');
            done();
          }).catch((e)=>done(e));
        });
    });

    // it('should not create topic with invalid body data', (done) =>{
    //     testSession.post('/topic-create')
    //     .send({})
    //     .expect(400)
    //     .end((err,res)=>{
    //       if (err) {
    //         return done(err);
    //       }
    //
    //       Topic.find().then((topics)=>{
    //         expect(topics.length).toBe(2); //2 topics in seed data
    //         done();
    //       }).catch((e)=>done(e));
    //     });
    // });
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
          Topic.findById(id).then((topic)=>{
            expect(topic.name).toBe(name);
            expect(topic.description).toBe(description);
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

  // describe('POST /topic-delete/:id', ()=> {
  //   it('should remove a topic if owner', (done) =>{
  //     var id = topics[1]._id.toHexString();
  //
  //     testSession.post(`/topic-delete/${id}`)
  //       .expect(302)
  //       .end((err,res)=>{
  //         if (err) {
  //           return done(err);
  //         }
  //         Topic.findById(id).then((topic)=>{
  //           expect(topic).toBeFalsy();
  //           done();
  //         }).catch((e)=>done(e));
  //       });
  //   });
  //
  //   it('should not remove a topic if not owner', (done) =>{
  //     var id = topics[0]._id.toHexString();
  //
  //     testSession.post(`/topic-delete/${id}`)
  //       .expect(401)
  //       .end(done)
  //   });
  //
  //   it('should return a 404 if topic not found', (done) =>{
  //     var id = new ObjectID().toHexString();
  //     testSession.post(`/topic-delete/${id}`)
  //       .expect(404)
  //       .end(done);
  //   });
  // });

  // describe('POST /post/:id', ()=> {
  //   it('should create a new post', (done)=> {
  //     var id = topics[0]._id.toHexString();
  //     testSession.post(`/post/${id}`)
  //       .send({message:"New message!"})
  //       .expect(302)
  //       .end((err,res)=>{
  //         if (err) {
  //           return done(err);
  //         }
  //         Post.find({topic:id}).then((post)=>{
  //           expect(post.length).toBe(1);
  //           expect(post[0].message).toBe("New message!")
  //           done();
  //         }).catch((e)=>done(e));
  //       });
  //   });
  // });

  describe('POST /resource/:id', ()=>{
    it('should create a new resource',(done)=>{
      var id = topics[0]._id.toHexString();
      var name = 'Wikipedia entry on Quantum computing';
      var link = 'https://en.wikipedia.org/';
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

  describe('POST /like/:id', ()=> {
    it('should add like to resource if user has not voted yet', (done)=> {
      var id = resources[0]._id.toHexString();
      testSession.post('/like/'+id)
        .expect(302)
        .end((err,res)=>{
          if (err) {
            return done(err);
          }
          Resource.findById(id).then((resource)=>{
            expect(resource.likes).toBe(5) //originally 4
            expect(resource.dislikes).toBe(14) //originally 14
            expect(resource.hasLiked).toContain('spencer')
            expect(resource.hasDisliked).not.toContain('spencer')
            done();
          }).catch((e)=>done(e));
        })
    });

    it('should add like and remove dislike to resource if user has voted dislike', (done)=> {
      var id = resources[2]._id.toHexString();
      testSession.post('/like/'+id)
        .expect(302)
        .end((err,res)=>{
          if (err) {
            return done(err);
          }
          Resource.findById(id).then((resource)=>{
            expect(resource.likes).toBe(5) //originally 4
            expect(resource.dislikes).toBe(13) //originally 14
            expect(resource.hasLiked).toContain('spencer')
            expect(resource.hasDisliked).not.toContain('spencer')
            done();
          }).catch((e)=>done(e));
        })
    });

    it('should do remove a like if user already voted like', (done)=> {
      var id = resources[1]._id.toHexString();
      testSession.post('/like/'+id)
        .expect(302)
        .end((err,res)=>{
          if (err) {
            return done(err);
          }
          Resource.findById(id).then((resource)=>{
            expect(resource.likes).toBe(4) //originally 5
            expect(resource.dislikes).toBe(3) //originally 3
            expect(resource.hasLiked).not.toContain('spencer')
            expect(resource.hasDisliked).not.toContain('spencer')
            done();
          }).catch((e)=>done(e));
        })
    });
  });

  // describe('POST /dislike/:id', ()=> {
  //   it('should add dislike to resource if user has not voted yet', (done)=> {
  //     var id = resources[0]._id.toHexString();
  //     testSession.post('/like/'+id)
  //       .expect(302)
  //       .end((err,res)=>{
  //         if (err) {
  //           return done(err);
  //         }
  //         Resource.findById(id).then((resource)=>{
  //           expect(resource.likes).toBe(5)
  //           expect(resource.dislikes).toBe(14)
  //           expect(resource.hasDisliked).toContain('spencer')
  //           expect(resource.hasLiked).not.toContain('spencer')
  //           done();
  //         }).catch((e)=>done(e));
  //       })
  //   });
  //
  //   it('should add dislike and remove like to resource if user has voted like', (done)=> {
  //     var id = resources[1]._id.toHexString();
  //     testSession.post('/like/'+id)
  //       .expect(302)
  //       .end((err,res)=>{
  //         if (err) {
  //           return done(err);
  //         }
  //         Resource.findById(id).then((resource)=>{
  //           expect(resource.likes).toBe(5)
  //           expect(resource.dislikes).toBe(3)
  //           expect(resource.hasDisliked).toContain('spencer')
  //           expect(resource.hasLiked).not.toContain('spencer')
  //           done();
  //         }).catch((e)=>done(e));
  //       })
  //   });
  //
  //   it('should do nothing if user already voted dislike', (done)=> {
  //     var id = resources[2]._id.toHexString();
  //     testSession.post('/like/'+id)
  //       .expect(302)
  //       .end((err,res)=>{
  //         if (err) {
  //           return done(err);
  //         }
  //         Resource.findById(id).then((resource)=>{
  //           expect(resource.likes).toBe(5)
  //           expect(resource.dislikes).toBe(13)
  //           expect(resource.hasDisliked).toContain('spencer')
  //           expect(resource.hasLiked).not.toContain('spencer')
  //           done();
  //         }).catch((e)=>done(e));
  //       })
  //   });
  // });

  describe('POST /review/:id/:topicid',()=>{
    it('should add like to and post review of the resource',(done)=>{
      var id = resources[2]._id.toHexString();
      var topicid = topics[1]._id.toHexString();

      testSession.post(`/review/${id}/${topicid}`)
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
            expect(reviews.length).toBe(2); //one from seed database
            expect(reviews[1].message).toBe('This resource is great!');
            expect(reviews[1].liked).toBe(true);
            expect(reviews[1].disliked).toBe(false);
            done();
          }).catch((e)=>done(e));
        });
    });

    it('should add dislike to and post review of the resource',(done)=>{
      var id = resources[2]._id.toHexString();
      var topicid = topics[1]._id.toHexString();

      testSession.post(`/review/${id}/${topicid}`)
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
      var topicid = topics[0]._id.toHexString();

      testSession.post(`/review/${id}/${topicid}`)
      .send({
        message:'This resource sucks!',
        rating:'dislike'
      })
      .expect(401)
      .end(done)
    });

    // it('should not allow owner of resource to post review', (done)=> {
    //   var id = resources[1]._id.toHexString();
    //   var topicid = topics[1]._id.toHexString();
    //
    //   testSession.post(`/review/${id}/${topicid}`)
    //   .send({
    //     message:'This resource sucks!',
    //     rating:'dislike'
    //   })
    //   .expect(401)
    //   .end(done)
    // });
  });

  describe('POST /review-update/:id', ()=> {
    it('should update review and increase likes by one', (done)=> {
      var id = reviews[0]._id.toHexString();

      testSession.post(`/review-update/${id}`)
        .send({
          message:'I actually like this!',
          rating:'like'
        })
        .expect(302)
        .end((err,res)=>{
          if (err) {
            return done(err);
          }
          Resource.findById(reviews[0].resource).then((resource)=>{
            expect(resource.likes).toBe(11) //was 10
            expect(resource.dislikes).toBe(2)
          }).catch((e)=>done(e));
          Review.findById(id).then((review)=>{
            expect(reviews.length).toBe(2);
            expect(review.message).toBe('I actually like this!')
            expect(review.liked).toBe(true);
            expect(review.disliked).toBe(false);
            done();
          }).catch((e)=>done(e));
        })
    });

    it('should update review and increase dislikes by one', (done)=> {
      var id = reviews[0]._id.toHexString();

      testSession.post(`/review-update/${id}`)
        .send({
          message:'I actually hate this!',
          rating:'dislike'
        })
        .expect(302)
        .end((err,res)=>{
          if (err) {
            return done(err);
          }
          Resource.findById(reviews[0].resource).then((resource)=>{
            expect(resource.likes).toBe(9) //was 10
            expect(resource.dislikes).toBe(4) //was 3
          }).catch((e)=>done(e));
          Review.findById(id).then((review)=>{
            expect(review.message).toBe('I actually hate this!')
            expect(review.liked).toBe(false);
            expect(review.disliked).toBe(true);
            done();
          }).catch((e)=>done(e));
        })
    });

  });

  describe('POST /review-delete/:id',()=> {
    it('should delete review and decrement likes by one if positive review', (done)=> {
      var id = reviews[0]._id.toHexString();

      testSession.post(`/review-delete/${id}`)
        .expect(302)
        .end((err,res)=>{
          if (err) {
            return done(err);
          }
          Resource.findById(reviews[0].resource).then((resource)=>{
            expect(resource.likes).toBe(9) //was 10
            expect(resource.dislikes).toBe(3) //was 3
          }).catch((e)=>done(e));
          Review.find({resource:id}).then((reviews)=>{
            expect(reviews.length).toBe(0)
            done();
          }).catch((e)=>done(e));
        });
    });

    it('should delete review and decrement dislikes by one if negative review', (done)=> {
      var id = reviews[1]._id.toHexString();

      testSession.post(`/review-delete/${id}`)
        .expect(302)
        .end((err,res)=>{
          if (err) {
            return done(err);
          }
          Resource.findById(reviews[1].resource).then((resource)=>{
            expect(resource.likes).toBe(4)
            expect(resource.dislikes).toBe(13)
          }).catch((e)=>done(e));
          Review.find({resource:id}).then((reviews)=>{
            expect(reviews.length).toBe(0)
            done();
          }).catch((e)=>done(e));
        });
    });



    // body...
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
    var id = users[1]._id.toHexString();
    request(app)
      .get('/profile/'+id)
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
