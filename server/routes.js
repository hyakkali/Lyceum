var {Topic} = require('./models/topic');
var {User} = require('./models/user');
var {Post} = require('./models/post');
var {Resource} = require('./models/resource');
var {Review} = require('./models/review');

var {requiresLogin,requiresOwner,isOwner,hasPostedReview,isResourceOwner} = require('./middleware/middleware');

const moment = require('moment');
const {ObjectID} = require('mongodb');
const _ = require('lodash');

module.exports = (app)=>{

  app.get('/',(req,res)=>{
    Topic.find().then((topics)=>{
      if (req.session && req.session.userId) {
        return res.status(200).render('index.hbs',{topics:topics,user:true});
      }
      return res.status(200).render('index.hbs',{topics:topics});
    },(e)=>{
      if (e) {
        res.status(400).render('error.hbs',{error:'Topics could not be found.'})
      }
    });
  });

// USER

  app.get('/register',(req,res)=>{
    return res.render('signup.hbs');
  })

  app.get('/login',(req,res)=>{
    return res.render('login.hbs');
  })

  app.post('/register',(req,res)=>{

    var user = new User({
      first_name:req.body.first_name,
      last_name:req.body.last_name,
      email:req.body.email,
      username:req.body.username,
      password:req.body.password,
    });

    user.save().then((doc)=>{
      req.session.userId = user._id;
      return res.redirect('/profile');
    },(e)=>{
      return res.status(400).render('error.hbs',{error:'Email or Display Name already exists.'});
    });
  });

  app.post('/login',(req,res)=>{
    User.authenticate(req.body.email,req.body.password,(err,user)=>{
      if (err||!user) {
        return res.status(401).render('error.hbs',{error:'Wrong email or password.'})
      }else {
        req.session.userId=user._id;
        return res.redirect('/profile');
      }
    });
  })

  app.get('/profile',requiresLogin,(req,res)=>{
    User.findById(req.session.userId)
      .exec((err,user)=>{
        if (err) {
          return res.status(400).render('error.hbs',{error:'User could not be found.'})
        }
        if (user===null) {
          return res.status(400).render('error.hbs',{error:'Not authorized! Go back!'})
        }
        return res.status(200).render('profile.hbs',{user:user});
      });
  });

  app.get('/logout',requiresLogin,(req,res)=>{
    if (req.session) {
      req.session.destroy(function (err) {
        if (err) {
          return res.status(400).render('error.hbs',{error:'Session could not be destroyed.'})
        }else {
          return res.redirect('/');
        }
      });
    }
  });

// Topic

  app.get('/topic-create',(req,res)=>{
    if (req.session && req.session.userId) {
      return res.render('topic-create.hbs',{user:true});
    }
    return res.render('topic-create.hbs');
  });

  app.post('/topic-create',requiresLogin,(req,res)=>{
    var topic = new Topic({
      name:req.body.name,
      description:req.body.description,
      createdAt: new Date().getTime(),
      createdBy:req.session.userId
    });

    topic.save().then((doc)=>{
      // res.send(doc);
      return res.redirect('/topic/'+topic._id); //redirect to topic page
    },(e)=>{
      return res.status(400).render('error.hbs',{error:'Topic could not be saved.'});
    });
  });

  app.get('/topic-update/:id',[requiresLogin,requiresOwner],(req,res)=>{
    var id = req.params.id;
    Topic.findById(id).then((topic)=>{
      if (!topic) {
        return res.status(404).render('error.hbs',{error:'Topic could not be found.'});
      }
      return res.render('topic-update.hbs',{topic:topic,user:true});
    }).catch((e)=>res.status(400).render('error.hbs',{error:'Page could not be rendered.'}))
  })

  app.post('/topic-update/:id',[requiresLogin,requiresOwner],(req,res)=>{
    var id = req.params.id;
    var body = _.pick(req.body,['name','description']);

    if (!ObjectID.isValid(id)) {
      return res.status(404).render('error.hbs',{error:'Invalid URL.'});
    }

    Topic.findOneAndUpdate({_id:id},{$set:body},{new:true}).then((topic)=>{
      if (!topic) {
        return res.status(404).render('error.hbs',{error:'Topic could not be found.'});
      }
      return res.status(200).redirect('/topic/'+topic._id);
    }).catch((e)=>{
      res.status(400).render('error.hbs',{error:'Topic could not be updated.'});
    });
  });

  app.get('/topic-delete/:id',[requiresLogin,requiresOwner],(req,res)=>{
    var id = req.params.id;
    Topic.findById(id).then((topic)=>{
      if (!topic) {
        return res.status(404).render('error.hbs',{error:'Topic could not be found.'});
      }
      return res.render('topic-delete.hbs',{topic:topic,user:true});
    }).catch((e)=>res.status(400).render('error.hbs',{error:'Page could not be rendered.'}))  })

  app.post('/topic-delete/:id',[requiresLogin,requiresOwner],(req,res)=>{
    var id = req.params.id;

    if (!ObjectID.isValid(id)) {
      return res.status(404).render('error.hbs',{error:'Invalid URL.'});
    }

    Topic.findOneAndRemove({
      _id:id
    }).then((topic)=>{
      if (!topic) {
        return res.status(404).render('error.hbs',{error:'Topic could not be found.'});
      }
      return res.redirect('/topics');
    }).catch((e)=>res.status(400).render('error.hbs',{error:'Topic could not be deleted.'}));
  });

  app.get('/topics',(req,res)=>{ //GET all topics
    Topic.find().then((topics)=>{
      if (req.session && req.session.userId) {
        return res.status(200).render('topic-list.hbs',{topics:topics,user:true});
      }
      res.status(200).render('topic-list.hbs',{topics:topics})
    },(e)=>{
      if (e) {
        res.status(400).render('error.hbs',{error:'Topics could not be found.'})
      }
    });
  });

  app.post('/search/:query',(req,res)=>{
    var query = req.params.query;
    var regex = new RegExp(query,'i');
    if (query==='topics') {
      return res.redirect('/topics');
    }
    Topic.find({name:regex},(err,topics)=>{
      if (topics.length===0) {
        return res.status(400).render('error.hbs',{error:'No topics found!'})
      }
      return res.status(200).render('topic-search.hbs',{topics:topics,query:query});
    })
  })

  app.get('/topic/:id',isOwner,(req,res)=>{ //GET specific topic page
    var id = req.params.id;

    if (!ObjectID.isValid(id)) {
      return res.status(404).render('error.hbs',{error:'Invalid URL.'});
    };

    Topic.findById(id).then((topic)=>{
      if (!topic) {
        return res.status(404).render('error.hbs',{error:'Topic could not be found.'});
      }
      Resource.find({topic:id}).then((resources)=>{
        Post.find({topic:id}).then((posts)=>{
          if (req.session && req.session.userId) {
            return res.render('topic.hbs',{topic:topic,posts:posts,resources:resources,user:true});
          }
         return res.render('topic.hbs',{topic:topic,posts:posts,resources:resources});
       },(e)=> res.status(400).render('error.hbs',{error:"Posts could not be found."}));
     },(e)=> res.status(400).render('error.hbs',{error:"Resources could not be found."}));
    }).catch((e)=>res.status(400).render('error.hbs',{error:'Topic could not be rendered.'}));
  });

// POST

  app.post('/post/:id',requiresLogin,(req,res)=>{
    var id = req.params.id; // topic id
    var time = new Date().getTime();
    User.findById(req.session.userId)
      .exec((err,user)=>{
        if (err) {
          return next(err);
        }
        if (user===null) {
          return res.status(400).render('error.hbs',{error:'Not authorized! Go back!'})
        }
        var post = new Post({
          message:req.body.message,
          createdAt: moment(time).format('h:mm a'),
          createdBy:user.username,
          topic:id
        });

        post.save().then((doc)=>{
          return res.status(200).redirect('/topic/'+id); //reload same page with new post saved
        },(e)=>res.status(400).render('error.hbs',{error:'Post could not be saved.'}));
      })
  });

  app.post('/resource/:id',requiresLogin,(req,res)=>{
    var id = req.params.id; // topic id
    var time = new Date().getTime();
    User.findById(req.session.userId)
      .exec((err,user)=>{
        if (err) {
          return next(err);
        }
        if (user===null) {
          return res.status(400).render('error.hbs',{error:'Not authorized! Go back!'})
        }
        var resource = new Resource({
          name:req.body.name,
          link:req.body.link,
          description:req.body.description,
          likes:0,
          dislikes:0,
          createdBy:user.username,
          createdAt:moment(time).format('h:mm a'),
          topic:id,
        })

        resource.save().then((doc)=>{
          return res.status(200).redirect('/topic/'+id);
        },(e)=>res.status(400).render('error.hbs',{error:'Resource could not be saved.'}));
      })
  });

  app.post('/review/:id/:topicid',[requiresLogin,hasPostedReview,isResourceOwner],(req,res)=>{
    var id = req.params.id; //resource id
    var topicid = req.params.topicid; //topic id
    var rating = req.body.rating;

    if (rating==='like') {
      User.findById(req.session.userId).then((user)=>{
        if (!user) {
          return res.status(404).render('error.hbs',{error:'User could not be found.'});
        }
        Resource.findOneAndUpdate({_id:id},{$inc:{likes:1},$push:{postedUsers:user.username}},{new:true}).then((resource)=>{
          if (!resource) {
            return res.status(404).render('error.hbs',{error:e});
          }
          var time = new Date().getTime();
          var review = new Review({
            message:req.body.message,
            liked:true,
            disliked:false,
            createdBy:user.username,
            createdAt:moment(time).format('h:mm a'),
            resource:id
          })
          review.save().then((review)=>{
            return res.status(200).redirect('/resource/'+id);
          },(e)=>res.status(400).render('error.hbs',{error:e}));
        }).catch((e)=>res.status(400).render('error.hbs',{error:'Resource could not be updated.'}));
      }).catch((e)=>res.status(400).render('error.hbs',{error:'Error with finding user.'}))
    }
    if (rating==='dislike') {
      User.findById(req.session.userId).then((user)=>{
        if (!user) {
          return res.status(404).render('error.hbs',{error:'User could not be found.'});
        }
        Resource.findOneAndUpdate({_id:id},{$inc:{dislikes:1},$push:{postedUsers:user.username}},{new:true}).then((resource)=>{
          if (!resource) {
            return res.status(404).render('error.hbs',{error:e});
          }
          var time = new Date().getTime();
          var review = new Review({
            message:req.body.message,
            liked:false,
            disliked:true,
            createdBy:user.username,
            createdAt:moment(time).format('h:mm a'),
            resource:id
          })
          review.save().then((review)=>{
            return res.status(200).redirect('/resource/'+id);
          },(e)=>res.status(400).render('error.hbs',{error:e}));
        }).catch((e)=>res.status(400).render('error.hbs',{error:'Resource could not be updated.'}));
      }).catch((e)=>res.status(400).render('error.hbs',{error:'Error with finding user.'}))
    }
  })

  app.get('/resource/:id',requiresLogin,(req,res)=>{
    var id = req.params.id; //resource id

    if (!ObjectID.isValid(id)) {
      return res.status(404).render('error.hbs',{error:'Invalid URL.'});
    };

    Resource.findById(id).then((resource)=>{
      if (!resource) {
        return res.status(404).render('error.hbs',{error:'Resource could not be found.'});
      }
      Review.find({resource:id}).then((reviews)=>{
        return res.render('resource.hbs',{resource:resource,reviews:reviews,user:true})
      },(e)=> res.status(400).render('error.hbs',{error:"Reviews could not be found."}));
    }).catch((e)=>res.status(400).render('error.hbs',{error:'Resource could not be rendered.'}));
  })

}
