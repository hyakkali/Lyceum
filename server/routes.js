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
      createdAt:new Date().toLocaleString(),
      lastLogin:new Date().toLocaleString(),
    });

    user.save().then((doc)=>{
      req.session.userId = user._id;
      req.session.username = user.username;
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
        User.findOneAndUpdate({_id:user._id},{$set:{lastLogin:new Date().toLocaleString()}}).then((user)=>{
          req.session.userId=user._id;
          req.session.username = user.username;
          return res.redirect('/profile');
        })
      }
    });
  })

  app.get('/profile',requiresLogin,(req,res)=>{
    User.findById(req.session.userId).then((user)=>{
      if (!user) {
        return res.status(404).render('error.hbs',{error:'User could not be found.'});
      }
      Topic.find({createdBy:req.session.username}).then((topics)=>{
        Resource.find({createdBy:req.session.username}).then((resources)=>{
          Review.find({createdBy:req.session.username}).then((reviews)=>{
            return res.status(200).render('profile.hbs',{topics:topics,resources:resources,reviews:reviews,user:user});
          }).catch((e)=>res.status(400).render('error.hbs',{error:e}));
        }).catch((e)=>res.status(400).render('error.hbs',{error:e}));
      }).catch((e)=>res.status(400).render('error.hbs',{error:e}));
    }).catch((e)=>res.status(400).render('error.hbs',{error:e}));
  });

  app.get('/logout',requiresLogin,(req,res)=>{
    return res.render('logout.hbs');
  })

  app.post('/logout',requiresLogin,(req,res)=>{
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
      createdAt: new Date().toLocaleString(),
      createdBy:req.session.username
    });

    topic.save().then((doc)=>{
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

    Topic.findOneAndUpdate({_id:id},{$set:body},{new:true}).then((topic)=>{
      if (!topic) {
        return res.status(404).render('error.hbs',{error:'Topic could not be found.'});
      }
      return res.status(200).redirect('/topic/'+topic._id);
    }).catch((e)=>{
      res.status(400).render('error.hbs',{error:'Topic could not be updated.'});
    });
  });

  // app.get('/topic-delete/:id',[requiresLogin,requiresOwner],(req,res)=>{
  //   var id = req.params.id;
  //   Topic.findById(id).then((topic)=>{
  //     if (!topic) {
  //       return res.status(404).render('error.hbs',{error:'Topic could not be found.'});
  //     }
  //     return res.render('topic-delete.hbs',{topic:topic,user:true});
  //   }).catch((e)=>res.status(400).render('error.hbs',{error:'Page could not be rendered.'}))
  // })

  // app.post('/topic-delete/:id',[requiresLogin,requiresOwner],(req,res)=>{
  //   var id = req.params.id;
  //
  //   Topic.findOneAndRemove({_id:id}).then((topic)=>{
  //     if (!topic) {
  //       return res.status(404).render('error.hbs',{error:'Topic could not be found.'});
  //     }
  //     Resource.remove({topic:id}).then((resources)=>{
  //       return res.redirect('/topics');
  //     })
  //   }).catch((e)=>res.status(400).render('error.hbs',{error:'Topic could not be deleted.'}));
  // });

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
    Topic.find({name:regex}).limit(5).then((topics)=>{
      if (topics.length===0) {
        return res.status(400).render('error.hbs',{error:'No topics found!'})
      }
      return res.status(200).render('topic-search.hbs',{topics:topics,query:query});
    })
  })

  app.get('/topic/:id',isOwner,(req,res)=>{ //GET specific topic page
    var id = req.params.id;

    Topic.findById(id).then((topic)=>{
      if (!topic) {
        return res.status(404).render('error.hbs',{error:'Topic could not be found.'});
      }
      Resource.find({topic:id}).sort({likes:-1}).then((resources)=>{
        if (req.session && req.session.userId) {
          return res.render('topic.hbs',{topic:topic,resources:resources,user:true});
        }
       return res.render('topic.hbs',{topic:topic,resources:resources});
     },(e)=> res.status(400).render('error.hbs',{error:"Resources could not be found."}));
    }).catch((e)=>res.status(400).render('error.hbs',{error:'Topic could not be rendered.'}));
  });

// POST

  // app.post('/post/:id',requiresLogin,(req,res)=>{
  //   var id = req.params.id; // topic id
  //       var post = new Post({
  //         message:req.body.message,
  //         createdAt: new Date().toLocaleString(),
  //         createdBy:req.session.username,
  //         topic:id
  //       });
  //
  //       post.save().then((doc)=>{
  //         return res.status(200).redirect('/topic/'+id); //reload same page with new post saved
  //       },(e)=>res.status(400).render('error.hbs',{error:'Post could not be saved.'}));
  // });

  app.get('/resource-create/:id',(req,res)=>{
    var id = req.params.id // topic id
    Topic.findById(id).then((topic)=>{
      if (req.session && req.session.userId) {
        return res.render('resource-create.hbs',{topic:topic,user:true});
      }
      return res.render('resource-create.hbs',{topic:topic});
    }).catch((e)=>res.status(400).render('error.hbs',{error:'Error with finding topic.'}))
  })

  app.post('/resource/:id',requiresLogin,(req,res)=>{
    var id = req.params.id; // topic id
    var resource = new Resource({
      name:req.body.name,
      link:req.body.link,
      description:req.body.description,
      likes:0,
      dislikes:0,
      createdBy:req.session.username,
      createdAt:new Date().toLocaleString(),
      topic:id,
    })

    resource.save().then((doc)=>{
      return res.status(200).redirect('/topic/'+id);
    },(e)=>res.status(400).render('error.hbs',{error:e}));
  });

  app.post('/review/:id/:topicid',[requiresLogin,hasPostedReview,isResourceOwner],(req,res)=>{
    var id = req.params.id; //resource id
    var topicid = req.params.topicid; //topic id
    var rating = req.body.rating;

    if (rating==='like') {
        Resource.findOneAndUpdate({_id:id},{$inc:{likes:1},$push:{postedUsers:req.session.username}},{new:true}).then((resource)=>{
          if (!resource) {
            return res.status(404).render('error.hbs',{error:e});
          }
          var review = new Review({
            message:req.body.message,
            liked:true,
            disliked:false,
            createdBy:req.session.username,
            createdAt:new Date().toLocaleString(),
            resource:id
          })
          review.save().then((review)=>{
            return res.status(200).redirect('/resource/'+id);
          },(e)=>res.status(400).render('error.hbs',{error:e}));
        }).catch((e)=>res.status(400).render('error.hbs',{error:'Resource could not be updated.'}));
    }

    if (rating==='dislike') {
        Resource.findOneAndUpdate({_id:id},{$inc:{dislikes:1},$push:{postedUsers:req.session.username}},{new:true}).then((resource)=>{
          if (!resource) {
            return res.status(404).render('error.hbs',{error:e});
          }
          var review = new Review({
            message:req.body.message,
            liked:false,
            disliked:true,
            createdBy:req.session.username,
            createdAt:new Date().toLocaleString(),
            resource:id
          })
          review.save().then((review)=>{
            return res.status(200).redirect('/resource/'+id);
          },(e)=>res.status(400).render('error.hbs',{error:e}));
        }).catch((e)=>res.status(400).render('error.hbs',{error:'Resource could not be updated.'}));
    }
  })

  app.get('/review-update/:id',requiresLogin,(req,res)=>{
    Review.findById(req.params.id).then((review)=>{
      if (!review) {
        return res.status(404).render('error.hbs',{error:'Review could not be found.'});
      }
      if (review.createdBy!==req.session.username) {
        return res.status(401).render('error.hbs',{error:"Only owner of review can access this page"});
      }
      return res.render('review-update.hbs',{review:review,user:true});
    }).catch((e)=>res.status(400).render('error.hbs',{error:'Page could not be rendered.'}))
  })

  app.post('/review-update/:id',requiresLogin,(req,res)=>{
    var id = req.params.id //review id
    var username = req.session.username;
    // var body = _.pick(req.body,['message','rating']);
    var rating = req.body.rating;

    Review.findById(id).then((review)=>{
      if (review.createdBy!==username) {
        return res.status(401).render('error.hbs',{error:"Only owner of review can access this page"});
      }
    }).catch((e)=>res.status(400).render('error.hbs',{error:e}));

    if (rating==='like') {
      Review.findOneAndUpdate({_id:id},{$set:{message:req.body.message,liked:true,disliked:false}},{new:true}).then((review)=>{
        if (!review) {
          return res.status(404).render('error.hbs',{error:'Review could not be found.'});
        }
        if (review.liked===true) {
          Resource.findOneAndUpdate({_id:review.resource},{$inc:{likes:1,dislikes:-1}},{new:true}).then((resource)=>{
            if (!resource) {
              return res.status(404).render('error.hbs',{error:e});
            }
            return res.redirect('/resource/'+review.resource);
          }).catch((e)=>res.status(400).render('error.hbs',{error:'Resource could not be updated.'}));
        } else if (review.disliked===true){
          Resource.findOneAndUpdate({_id:review.resource},{$inc:{likes:-1,dislikes:1}},{new:true}).then((resource)=>{
            if (!resource) {
              return res.status(404).render('error.hbs',{error:e});
            }
            return res.redirect('/resource/'+review.resource);
          }).catch((e)=>res.status(400).render('error.hbs',{error:'Resource could not be updated.'}));
        }
      }).catch((e)=>res.status(400).render('error.hbs',{error:'Review could not be updated.'}));
    }
    if (rating==='dislike') {
      Review.findOneAndUpdate({_id:id},{$set:{message:req.body.message,liked:false,disliked:true}},{new:true}).then((review)=>{
        if (!review) {
          return res.status(404).render('error.hbs',{error:'Review could not be found.'});
        }
        if (review.liked===true) {
          Resource.findOneAndUpdate({_id:review.resource},{$inc:{likes:1,dislikes:-1}},{new:true}).then((resource)=>{
            if (!resource) {
              return res.status(404).render('error.hbs',{error:e});
            }
            return res.redirect('/resource/'+review.resource);
          }).catch((e)=>res.status(400).render('error.hbs',{error:'Resource could not be updated.'}));
        } else if (review.disliked===true){
          Resource.findOneAndUpdate({_id:review.resource},{$inc:{likes:-1,dislikes:1}},{new:true}).then((resource)=>{
            if (!resource) {
              return res.status(404).render('error.hbs',{error:e});
            }
            return res.redirect('/resource/'+review.resource);
          }).catch((e)=>res.status(400).render('error.hbs',{error:'Resource could not be updated.'}));
        }
      }).catch((e)=>res.status(400).render('error.hbs',{error:'Review could not be updated.'}));
    }

  })

  app.get('/review-delete/:id',requiresLogin,(req,res)=>{
    var id = req.params.id; //review id
    Review.findById(id).then((review)=>{
      if (!review) {
        return res.status(404).render('error.hbs',{error:'Review could not be found.'});
      }
      if (review.createdBy!==req.session.username) {
        return res.status(401).render('error.hbs',{error:"Only owner of review can access this page"});
      }
      return res.render('review-delete.hbs',{review:review,user:true});
    }).catch((e)=>res.status(400).render('error.hbs',{error:'Page could not be rendered.'}))
  })

  app.post('/review-delete/:id',requiresLogin,(req,res)=>{
    var id = req.params.id //review id
    var username = req.session.username;

    Review.findById(id).then((review)=>{
      if (review.createdBy!==username) {
        return res.status(401).render('error.hbs',{error:"Only owner of review can access this page"});
      }
    }).catch((e)=>res.status(400).render('error.hbs',{error:e}));

    Review.findOneAndRemove({_id:id}).then((review)=>{
      if (!review) {
        return res.status(404).render('error.hbs',{error:'Review could not be found.'});
      }
      if (review.liked===true) {
        Resource.findOneAndUpdate({_id:review.resource},{$inc:{likes:-1},$pop:{postedUsers:username}},{new:true}).then((resource)=>{
          if (!resource) {
            return res.status(404).render('error.hbs',{error:e});
          }
          return res.redirect('/profile');
        }).catch((e)=>res.status(400).render('error.hbs',{error:'Resource could not be updated.'}));
      } else if (review.disliked===true){
        Resource.findOneAndUpdate({_id:review.resource},{$inc:{dislikes:-1},$pop:{postedUsers:username}},{new:true}).then((resource)=>{
          if (!resource) {
            return res.status(404).render('error.hbs',{error:e});
          }
          return res.redirect('/profile');
        }).catch((e)=>res.status(400).render('error.hbs',{error:'Resource could not be updated.'}));
      }
    }).catch((e)=>res.status(400).render('error.hbs',{error:'Review could not be deleted.'}));
  })

  app.get('/resource/:id',(req,res)=>{
    var id = req.params.id; //resource id

    Resource.findById(id).then((resource)=>{
      if (!resource) {
        return res.status(404).render('error.hbs',{error:'Resource could not be found.'});
      }
      Review.find({resource:id}).then((reviews)=>{
        if (req.session && req.session.userId && resource.createdBy===req.session.username) {
          return res.render('resource.hbs',{resource:resource,reviews:reviews,user:true,owner:true})
        } else if (req.session && req.session.userId) {
          return res.render('resource.hbs',{resource:resource,reviews:reviews,user:true})
        }
        return res.render('resource.hbs',{resource:resource,reviews:reviews})
      },(e)=> res.status(400).render('error.hbs',{error:"Reviews could not be found."}));
    }).catch((e)=>res.status(400).render('error.hbs',{error:'Resource could not be rendered.'}));
  })

  app.get('/resource-update/:id',requiresLogin,(req,res)=>{
    Resource.findById(req.params.id).then((resource)=>{ //resource id
      if (!resource) {
        return res.status(404).render('error.hbs',{error:'Resource could not be found.'});
      }
      if (resource.createdBy!==req.session.username) {
        return res.status(401).render('error.hbs',{error:"Only owner of resource can access this page"});
      }
      return res.render('resource-update.hbs',{resource:resource,user:true});
    }).catch((e)=>res.status(400).render('error.hbs',{error:e}));
  })

  app.post('/resource-update/:id',(req,res)=>{
    var id = req.params.id;
    var body = _.pick(req.body,['name','description','link']);

    Resource.findById(req.params.id).then((resource)=>{
      if (resource.createdBy!==req.session.username) {
        return res.status(401).render('error.hbs',{error:"Only owner of resource can update"});
      }
    }).catch((e)=>res.status(400).render('error.hbs',{error:e}));

    Resource.findOneAndUpdate({_id:id},{$set:body},{new:true}).then((resource)=>{
      if (!resource) {
        return res.status(404).render('error.hbs',{error:'Resource could not be found.'});
      }
      return res.status(200).redirect('/resource/'+resource._id);
    }).catch((e)=>res.status(400).render('error.hbs',{error:'Resource could not be updated.'}));
  })

  app.get('/resource-delete/:id',requiresLogin,(req,res)=>{
    var id = req.params.id;
    Resource.findById(id).then((resource)=>{
      if (!resource) {
        return res.status(404).render('error.hbs',{error:'Resource could not be found.'});
      }
      if (resource.createdBy!==req.session.username) {
        return res.status(401).render('error.hbs',{error:"Only owner of resource can access this page"});
      }
      return res.render('resource-delete.hbs',{resource:resource,user:true});
    }).catch((e)=>res.status(400).render('error.hbs',{error:'Page could not be rendered.'}))
  })

  app.post('/resource-delete/:id',requiresLogin,(req,res)=>{
    var id = req.params.id;

    Resource.findById(req.params.id).then((resource)=>{
      if (resource.createdBy!==req.session.username) {
        return res.status(401).render('error.hbs',{error:"Only owner of resource can delete"});
      }
    }).catch((e)=>res.status(400).render('error.hbs',{error:e}));

    Resource.findOneAndRemove({_id:id}).then((resource)=>{
      if (!resource) {
        return res.status(404).render('error.hbs',{error:'Resource could not be found.'});
      }
      Review.remove({resource:id}).then((reviews)=>{
        return res.redirect('/topic/'+resource.topic);
      })
    }).catch((e)=>res.status(400).render('error.hbs',{error:'Resource could not be deleted.'}));
  });

}
