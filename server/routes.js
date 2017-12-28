var {Community} = require('./models/community');
var {Topic} = require('./models/topic');
var {User} = require('./models/user');
var {Post} = require('./models/post');
var {Resource} = require('./models/resource');
var {Review} = require('./models/review');

var {requiresLogin,isAuthenticated,requiresOwner,isOwner} = require('./middleware/loginRequired');

const moment = require('moment');
const {ObjectID} = require('mongodb');
const _ = require('lodash');

module.exports = (app)=>{

  app.get('/',isAuthenticated,(req,res)=>{
    return res.render('index.hbs',{user:true});
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

// COMMUNITY

  app.get('/community-create',(req,res)=>{
    return res.render('community-create.hbs');
  });

  app.post('/community-create',requiresLogin,(req,res)=>{
    var comm = new Community({
      name:req.body.name,
      description:req.body.description,
      createdAt: new Date().getTime(),
      createdBy:req.session.userId
    });

    comm.save().then((doc)=>{
      // res.send(doc);
      return res.redirect('/community/'+comm._id); //redirect to community page
    },(e)=>{
      return res.status(400).render('error.hbs',{error:'Community could not be saved.'});
    });
  });

  app.get('/community-update/:id',[requiresLogin,requiresOwner],(req,res)=>{
    var id = req.params.id;
    Community.findById(id).then((comm)=>{
      if (!comm) {
        return res.status(404).render('error.hbs',{error:'Community could not be found.'});
      }
      return res.render('community-update.hbs',{community:comm});
    }).catch((e)=>res.status(400).render('error.hbs',{error:'Page could not be rendered.'}))
  })

  app.post('/community-update/:id',[requiresLogin,requiresOwner],(req,res)=>{
    var id = req.params.id;
    var body = _.pick(req.body,['name','description']);

    if (!ObjectID.isValid(id)) {
      return res.status(404).render('error.hbs',{error:'Invalid URL.'});
    }

    Community.findOneAndUpdate({_id:id},{$set:body},{new:true}).then((comm)=>{
      if (!comm) {
        return res.status(404).render('error.hbs',{error:'Community could not be found.'});
      }
      return res.status(200).redirect('/community/'+comm._id);
    }).catch((e)=>{
      res.status(400).render('error.hbs',{error:'Community could not be updated.'});
    });
  });

  app.get('/community-delete/:id',[requiresLogin,requiresOwner],(req,res)=>{
    var id = req.params.id;
    Community.findById(id).then((comm)=>{
      if (!comm) {
        return res.status(404).render('error.hbs',{error:'Community could not be found.'});
      }
      return res.render('community-delete.hbs',{community:comm});
    }).catch((e)=>res.status(400).render('error.hbs',{error:'Page could not be rendered.'}))  })

  app.post('/community-delete/:id',[requiresLogin,requiresOwner],(req,res)=>{
    var id = req.params.id;

    if (!ObjectID.isValid(id)) {
      return res.status(404).render('error.hbs',{error:'Invalid URL.'});
    }

    Community.findOneAndRemove({
      _id:id
    }).then((comm)=>{
      if (!comm) {
        return res.status(404).render('error.hbs',{error:'Community could not be found.'});
      }
      return res.redirect('/communities');
    }).catch((e)=>res.status(400).render('error.hbs',{error:'Community could not be deleted.'}));
  });

  app.get('/communities',(req,res)=>{ //GET all communities
    Community.find().then((comms)=>{
      res.status(200).render('community_list.hbs',{comms:comms})
    },(e)=>{
      if (e) {
        res.status(400).render('error.hbs',{error:'Communities could not be found.'})
      }
    });
  });

  app.get('/community/:id',[requiresLogin,isOwner],(req,res)=>{ //GET specific community page
    var id = req.params.id;

    if (!ObjectID.isValid(id)) {
      return res.status(404).render('error.hbs',{error:'Invalid URL.'});
    };

    Community.findById(id).then((comm)=>{
      if (!comm) {
        return res.status(404).render('error.hbs',{error:'Community could not be found.'});
      }
      Resource.find({community:id}).then((resources)=>{
        Post.find({community:id}).then((posts)=>{
         res.render('community.hbs',{community:comm,posts:posts,resources:resources});
       },(e)=> res.status(400).render('error.hbs',{error:"Posts could not be found."}));
     },(e)=> res.status(400).render('error.hbs',{error:"Resources could not be found."}));
    }).catch((e)=>res.status(400).render('error.hbs',{error:'Community could not be rendered.'}));
  });

// POST

  app.post('/post/:id',requiresLogin,(req,res)=>{
    var id = req.params.id; // community id
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
          community:id
        });

        post.save().then((doc)=>{
          return res.status(200).redirect('/community/'+id); //reload same page with new post saved
        },(e)=>res.status(400).render('error.hbs',{error:'Post could not be saved.'}));
      })
  });

  app.post('/resource/:id',requiresLogin,(req,res)=>{
    var id = req.params.id; // community id
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
          community:id,
        })

        resource.save().then((doc)=>{
          return res.status(200).redirect('/community/'+id);
        },(e)=>res.status(400).render('error.hbs',{error:'Resource could not be saved.'}));
      })
  });

  app.post('/review/:id/:commid',requiresLogin,(req,res)=>{
    var id = req.params.id; //resource id
    var commid = req.params.commid; //community id
    var rating = req.body.rating;

    if (rating==='like') {
      //findOneAndUpdate resource for likes
      Resource.findOneAndUpdate({_id:id},{$inc:{likes:1}},{new:true}).then((resource)=>{
        if (!resource) {
          return res.status(404).render('error.hbs',{error:'Resource could not be found.'});
        }
        //create review with liked set to true
        User.findById(req.session.userId).then((user)=>{
          if (!user) {
            return res.status(404).render('error.hbs',{error:'User could not be found.'});
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
            //return to resource page
            return res.status(200).redirect('/resource/'+id);
          },(e)=>res.status(400).render('error.hbs',{error:e}));
        }).catch((e)=>res.status(400).render('error.hbs',{error:'Error with finding user.'}))
      }).catch((e)=>res.status(400).render('error.hbs',{error:'Resource could not be updated.'}));
    }
    if (rating==='dislike') {
      //findOneAndUpdate resource for Dislikes
      Resource.findOneAndUpdate({_id:id},{$inc:{dislikes:1}},{new:true}).then((resource)=>{
        if (!resource) {
          return res.status(404).render('error.hbs',{error:'Resource could not be found.'});
        }
        //create review with disliked set to true
        User.findById(req.session.userId).then((user)=>{
          if (!user) {
            return res.status(404).render('error.hbs',{error:'User could not be found.'});
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
            //return to resource page
            return res.status(200).redirect('/resource/'+id);
          },(e)=>res.status(400).render('error.hbs',{error:'Review could not be saved.'}));
        }).catch((e)=>res.status(400).render('error.hbs',{error:'Error with finding user.'}))
      }).catch((e)=>res.status(400).render('error.hbs',{error:'Resource could not be updated.'}));
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
        return res.render('resource.hbs',{resource:resource,reviews:reviews})
      },(e)=> res.status(400).render('error.hbs',{error:"Reviews could not be found."}));
    }).catch((e)=>res.status(400).render('error.hbs',{error:'Resource could not be rendered.'}));
  })

// TOPIC

  app.get('/topic-create',(req,res)=>{
    res.render('topic-create.hbs');
  });

  app.post('/topic-create',requiresLogin,(req,res)=>{
    var topic = new Topic({
      name:req.body.name,
      description:req.body.description,
      createdAt: new Date().getTime(),
    });
    if (req.body.material) { //if material is posted
      topic.material=req.body.material
    }
    topic.save().then((doc)=>{
      // res.send(doc);
      res.redirect('/topic/'+topic._id); //redirect to community page
    },(e)=>{
      res.status(400).send(e);
    });
  });

  app.get('/topics',(req,res)=>{ //GET all topics
    Topic.find().then((topics)=>{
      res.send({topics});
    },(e)=>{
      if (e) {
        res.status(400).send(e)
      }
    });
  });

  app.get('/topic/:id',(req,res)=>{ //GET specific topic page
    var id = req.params.id;

    if (!ObjectID.isValid(id)) {
      return res.status(404).send();
    };

    Topic.findById(id).then((topic)=>{
      if (!topic) {
        return res.status(404).send();
      }

      res.status(200).send({topic});
    }).catch((e)=>res.status(400).send());
  });

}
