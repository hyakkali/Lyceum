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
        return res.status(200).render('index.hbs',{topics:topics,user:req.session.userId});
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
    if (req.session && req.session.userId) {
      return res.render('users/signup.hbs',{user:req.session.userId});
    }
    return res.render('users/signup.hbs');
  })

  app.get('/login',(req,res)=>{
    if (req.session && req.session.userId) {
      return res.render('users/login.hbs',{user:req.session.userId});
    }
    return res.render('users/login.hbs');
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
      return res.redirect('/profile/'+doc._id);
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
          return res.redirect('/profile/'+user._id);
        })
      }
    });
  })

  app.get('/profile/:id',requiresLogin,(req,res)=>{
    User.findById(req.params.id).then((user)=>{
      if (!user) {
        return res.status(404).render('error.hbs',{error:'User could not be found.'});
      }
      var username = user.username
      Topic.find({createdBy:username}).then((topics)=>{
        Resource.find({createdBy:username}).then((resources)=>{
          Review.find({createdBy:username}).then((reviews)=>{
            return res.status(200).render('users/profile.hbs',{topics:topics,resources:resources,reviews:reviews,user:user._id,signedUser:user});
          }).catch((e)=>res.status(400).render('error.hbs',{error:e}));
        }).catch((e)=>res.status(400).render('error.hbs',{error:e}));
      }).catch((e)=>res.status(400).render('error.hbs',{error:e}));
    }).catch((e)=>res.status(400).render('error.hbs',{error:e}));
  });

  app.get('/logout',requiresLogin,(req,res)=>{
    return res.render('users/logout.hbs',{user:req.session.userId});
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

  app.get('/user-update/:id',requiresLogin,(req,res)=>{
    return res.render('users/user-update.hbs',{user:req.params.id});
  })

  app.post('/user-update/:id',requiresLogin,(req,res)=>{
    var objForUpdate = {};
    var id = req.params.id;
    if (req.body.first_name) objForUpdate.first_name = req.body.first_name;
    if (req.body.last_name) objForUpdate.last_name = req.body.last_name;
    if (req.body.email) objForUpdate.email = req.body.email;
    if (req.body.username) objForUpdate.username = req.body.username;

    User.findOneAndUpdate({_id:id},{$set:objForUpdate},{new:true}).then((user)=>{
      if (!user) {
        return res.status(404).render('error.hbs',{error:'User could not be found.'});
      }
      return res.redirect('/profile/'+user._id);
    }).catch((e)=>res.status(400).render('error.hbs',{error:e}));
  })

// Topic

  app.get('/topic-create',requiresLogin,(req,res)=>{
    return res.render('topics/topic-create.hbs',{user:req.session.userId});
  });

  app.post('/topic-create',requiresLogin,(req,res)=>{

    var greekMap = {
      'A':'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Greek_lc_alpha.svg/1200px-Greek_lc_alpha.svg.png',
      'B':'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Greek_lc_beta.svg/1200px-Greek_lc_beta.svg.png',
      'C':'http://www.wallquotes.com/sites/default/files/arts0153-81.png',
      'D':'http://www.wallquotes.com/sites/default/files/styles/uc_canvas/public/arts0154-83.png?itok=Z9YWDF1k',
      'E':'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/LetterE.svg/1200px-LetterE.svg.png',
      'F':'https://commons.wikimedia.org/w/index.php?search=digamma&title=Special:Search&go=Go&searchToken=aixpluv9tktc4w72hel6bawfr#/media/File:Greek_Digamma_normal.svg',
      'G':'http://www.wallquotes.com/sites/default/files/arts0153-81.png',
      'H':'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Greek_lc_eta.svg/1200px-Greek_lc_eta.svg.png',
      'I':'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Greek_lc_iota.svg/400px-Greek_lc_iota.svg.png',
      'J':'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Greek_lc_psi.svg/1200px-Greek_lc_psi.svg.png',
      'K':'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Greek_lowercase_kappa_variant.svg/1054px-Greek_lowercase_kappa_variant.svg.png',
      'L':'http://www.wallquotes.com/sites/default/files/styles/uc_product_full/public/arts0161-91.png?itok=7JR60nKI',
      'M':'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Greek_lc_mu.svg/1200px-Greek_lc_mu.svg.png',
      'N':'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Greek_lc_nu.svg/1200px-Greek_lc_nu.svg.png',
      'O':'http://www.wallquotes.com/sites/default/files/arts0165-95.png',
      'P':'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Greek_lc_pi.svg/1200px-Greek_lc_pi.svg.png',
      'Q':'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Greek_letter_uppercase_Phi.svg/1200px-Greek_letter_uppercase_Phi.svg.png',
      'R':'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Greek_lc_rho.svg/1200px-Greek_lc_rho.svg.png',
      'S':'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Greek_uc_sigma.svg/1200px-Greek_uc_sigma.svg.png',
      'T':'https://i.pinimg.com/originals/fe/b5/6d/feb56d8344d0e95296fc7562f0ad2c5f.png',
      'U':'https://www.google.com/url?sa=i&rct=j&q=&esrc=s&source=images&cd=&ved=0ahUKEwjVtN_pk9PYAhUyRN8KHbpJBiAQjBwIBA&url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fcommons%2Fthumb%2F2%2F25%2FGreek_uc_Omega.svg%2F1200px-Greek_uc_Omega.svg.png&psig=AOvVaw3PY1HYDcEK93BswwVTFxgQ&ust=1515871577137312',
      'V':'http://www.charbase.com/images/glyph/964',
      'W':'http://www.wallquotes.com/sites/default/files/arts0164-94.png',
      'X':'http://www.charbase.com/images/glyph/967',
      'Y':'http://www.charbase.com/images/glyph/965',
      'Z':'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Greek_lc_zeta.svg/1200px-Greek_lc_zeta.svg.png',
    }

    var topicName = req.body.name;
    var letter = topicName.toUpperCase().split('')[0];
    var greekLetter = greekMap[letter];

    var topic = new Topic({
      name:topicName,
      description:req.body.description,
      createdAt: new Date().toLocaleString(),
      createdBy:req.session.username,
      image:greekLetter
    });

    topic.save().then((doc)=>{
      return res.redirect('/topic/'+topic._id); //redirect to topic page
    },(e)=>{
      return res.status(400).render('error.hbs',{error:'Topic could not be saved.'});
    });
  });

  app.get('/topic-update/:id',requiresLogin,(req,res)=>{
    var id = req.params.id;
    Topic.findById(id).then((topic)=>{
      if (!topic) {
        return res.status(404).render('error.hbs',{error:'Topic could not be found.'});
      }
      if (topic.createdBy!==req.session.username) {
        return res.status(401).render('error.hbs',{error:'Only owner of topic can access this page.'});
      }
      return res.render('topics/topic-update.hbs',{topic:topic,user:req.session.userId});
    }).catch((e)=>res.status(400).render('error.hbs',{error:'Page could not be rendered.'}))
  })

  app.post('/topic-update/:id',[requiresLogin,requiresOwner],(req,res)=>{
    var id = req.params.id;
    // var body = _.pick(req.body,['name','description']);
    var objForUpdate = {};
    if (req.body.name) objForUpdate.name = req.body.name;
    if (req.body.description) objForUpdate.description = req.body.description;

    Topic.findOneAndUpdate({_id:id},{$set:objForUpdate},{new:true}).then((topic)=>{
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
        return res.status(200).render('topics/topic-list.hbs',{topics:topics,user:req.session.userId});
      }
      res.status(200).render('topics/topic-list.hbs',{topics:topics})
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
      return res.status(200).render('topics/topic-search.hbs',{topics:topics,query:query});
    })
  })

  app.get('/topic/:id',(req,res)=>{ //GET specific topic page
    var id = req.params.id;

    Topic.findById(id).then((topic)=>{
      if (!topic) {
        return res.status(404).render('error.hbs',{error:'Topic could not be found.'});
      }
      if (topic.createdBy===req.session.username) {
        Resource.find({topic:id}).sort({likes:-1}).then((resources)=>{
          return res.render('topics/topic.hbs',{topic:topic,resources:resources,user:req.session.userId,owner:true});
        },(e)=> res.status(400).render('error.hbs',{error:"Resources could not be found."}));
      } else {
        Resource.find({topic:id}).sort({likes:-1}).then((resources)=>{
          if (req.session && req.session.userId) {
            return res.render('topics/topic.hbs',{topic:topic,resources:resources,user:req.session.userId});
          }
         return res.render('topics/topic.hbs',{topic:topic,resources:resources});
       },(e)=> res.status(400).render('error.hbs',{error:"Resources could not be found."}));
      }
    }).catch((e)=>res.status(400).render('error.hbs',{error:'Topic could not be rendered.'}));
  });

  //RESOURCE

  app.get('/resource-create/:id',requiresLogin,(req,res)=>{
    var id = req.params.id // topic id
    Topic.findById(id).then((topic)=>{
      if (req.session && req.session.userId) {
        return res.render('resources/resource-create.hbs',{topic:topic,user:req.session.userId});
      }
      return res.render('resources/resource-create.hbs',{topic:topic});
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

  app.get('/resource/:id',(req,res)=>{
    var id = req.params.id; //resource id

    Resource.findById(id).then((resource)=>{
      if (!resource) {
        return res.status(404).render('error.hbs',{error:'Resource could not be found.'});
      }
      Review.find({resource:id}).then((reviews)=>{
        if (req.session && req.session.userId && resource.createdBy===req.session.username) {
          return res.render('resources/resource.hbs',{resource:resource,reviews:reviews,user:req.session.userId,owner:true})
        } else if (req.session && req.session.userId) {
          return res.render('resources/resource.hbs',{resource:resource,reviews:reviews,user:req.session.userId})
        }
        return res.render('resources/resource.hbs',{resource:resource,reviews:reviews})
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
      return res.render('resources/resource-update.hbs',{resource:resource,user:req.session.userId});
    }).catch((e)=>res.status(400).render('error.hbs',{error:e}));
  })

  app.post('/resource-update/:id',(req,res)=>{
    var id = req.params.id;
    var objForUpdate = {};
    if (req.body.name) objForUpdate.name = req.body.name;
    if (req.body.description) objForUpdate.description = req.body.description;
    if (req.body.link) objForUpdate.link = req.body.link;

    Resource.findById(req.params.id).then((resource)=>{
      if (resource.createdBy!==req.session.username) {
        return res.status(401).render('error.hbs',{error:"Only owner of resource can update"});
      }
    }).catch((e)=>res.status(400).render('error.hbs',{error:e}));

    Resource.findOneAndUpdate({_id:id},{$set:objForUpdate},{new:true}).then((resource)=>{
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
      return res.render('resources/resource-delete.hbs',{resource:resource,user:req.session.userId});
    }).catch((e)=>res.status(400).render('error.hbs',{error:'Page could not be rendered.'}))
  })

  app.post('/resource-delete/:id',requiresLogin,(req,res)=>{
    var id = req.params.id;

    Resource.findById(req.params.id).then((resource)=>{
      if (resource.createdBy!==req.session.username) {
        return res.status(401).render('error.hbs',{error:"Only owner of resource can delete"});
      }
      resource.remove({_id:id}).then((doc)=>{
        Review.remove({resource:id}).then((reviews)=>{
          return res.redirect('/topic/'+resource.topic);
        }).catch((e)=>res.status(400).render('error.hbs',{error:e}));
      }).catch((e)=>res.status(400).render('error.hbs',{error:e}));
    }).catch((e)=>res.status(400).render('error.hbs',{error:e}));
  });

  //REVIEWS

  app.post('/like/:id',requiresLogin,(req,res)=>{
    var id = req.params.id; //resource id
    var username = req.session.username;

    Resource.findById(id).then((resource)=>{
      if (resource.hasLiked.indexOf(username)>-1) {
        resource.likes-=1;
        var index = resource.hasLiked.indexOf(username);
        resource.hasLiked.splice(index,1);
        resource.save().then((doc)=>{
          return res.redirect('back'); //reload same page
        }).catch((e)=>res.status(400).render('error.hbs',{error:e}));
      } else if (resource.hasDisliked.indexOf(username)>-1) {
        resource.likes+=1;
        resource.dislikes-=1;
        resource.hasLiked.push(username);
        var index = resource.hasDisliked.indexOf(username);
        resource.hasDisliked.splice(index,1)
        resource.save().then((doc)=>{
          return res.redirect('back');
        }).catch((e)=>res.status(400).render('error.hbs',{error:e}));
      } else {
        resource.likes+=1;
        resource.hasLiked.push(username);
        resource.save().then((doc)=>{
          return res.redirect('back');
        }).catch((e)=>res.status(400).render('error.hbs',{error:e}));
      }
    }).catch((e)=>res.status(400).render('error.hbs',{error:e}));
  })

  app.post('/dislike/:id',requiresLogin,(req,res)=>{
    var id = req.params.id; //resource id
    var username = req.session.username;

    Resource.findById(id).then((resource)=>{
      if (resource.hasDisliked.indexOf(username)>-1) {
        resource.dislikes-=1;
        var index = resource.hasDisliked.indexOf(username);
        resource.hasDisliked.splice(index,1)
        resource.save().then((doc)=>{
          return res.redirect('back');
        }).catch((e)=>res.status(400).render('error.hbs',{error:e}));
      } else if (resource.hasLiked.indexOf(username)>-1) {
        resource.dislikes+=1;
        resource.likes-=1;
        resource.hasDisliked.push(username);
        var index = resource.hasLiked.indexOf(username);
        resource.hasLiked.splice(index,1)
        resource.save().then((doc)=>{
          return res.redirect('back');
        }).catch((e)=>res.status(400).render('error.hbs',{error:e}));
      } else {
        resource.dislikes+=1;
        resource.hasDisliked.push(username);
        resource.save().then((doc)=>{
          return res.redirect('back');
        }).catch((e)=>res.status(400).render('error.hbs',{error:e}));
      }
    }).catch((e)=>res.status(400).render('error.hbs',{error:e}));
  })

  app.post('/review/:id/:topicid',[requiresLogin,hasPostedReview],(req,res)=>{
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
      return res.render('reviews/review-update.hbs',{review:review,user:req.session.userId});
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
      return res.render('reviews/review-delete.hbs',{review:review,user:req.session.userId});
    }).catch((e)=>res.status(400).render('error.hbs',{error:'Page could not be rendered.'}))
  })

  app.post('/review-delete/:id',requiresLogin,(req,res)=>{
    var id = req.params.id //review id
    var username = req.session.username;

    Review.findById(id).then((review)=>{
      if (review.createdBy!==username) {
        return res.status(401).render('error.hbs',{error:"Only owner of review can access this page"});
      }
      if (review.liked===true) {
        Resource.findOneAndUpdate({_id:review.resource},{$inc:{likes:-1},$pop:{postedUsers:username}},{new:true}).then((resource)=>{
          if (!resource) {
            return res.status(404).render('error.hbs',{error:e});
          }
          return res.redirect('/profile/'+req.session.userId);
        }).catch((e)=>res.status(400).render('error.hbs',{error:'Resource could not be updated.'}));
      } else if (review.disliked===true){
        Resource.findOneAndUpdate({_id:review.resource},{$inc:{dislikes:-1},$pop:{postedUsers:username}},{new:true}).then((resource)=>{
          if (!resource) {
            return res.status(404).render('error.hbs',{error:e});
          }
          return res.redirect('/profile/'+req.session.userId);
        }).catch((e)=>res.status(400).render('error.hbs',{error:'Resource could not be updated.'}));
      }
    }).catch((e)=>res.status(400).render('error.hbs',{error:e}));
  })

}
