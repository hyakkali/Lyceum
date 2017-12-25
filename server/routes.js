var {Community} = require('./models/community');
var {Topic} = require('./models/topic');
var {User} = require('./models/user');
var {Post} = require('./models/post');

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

  app.delete('/community/:id',requiresLogin,(req,res)=>{
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
      res.status(200).send({comm})
    }).catch((e)=>res.status(400).render('error.hbs',{error:'Community could not be deleted.'}));
  });

  app.get('/communities',(req,res)=>{ //GET all communities
    Community.find().then((comms)=>{
      res.status(200).render('community_list.hbs',{comms:comms})
      // res.send({comms});
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
      res.render('community.hbs',{community:comm,posts:comm.posts})
      // res.status(200).send({comm});
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
        });

        post.save().then((doc)=>{
          // res.status(200).send(doc);
          Community.findOneAndUpdate({_id:id},{$push:{posts:post}},{new:true}).then((comm)=>{
            if (!comm) {
              return res.status(404).render('error.hbs',{error:'Community could not be found.'});
            }
            res.status(200).redirect('/community/'+id); //reload same page with new post saved
          }).catch((e)=>res.status(400).render('error.hbs',{error:'Community could not be updated.'}));
        },(e)=>res.status(400).render('error.hbs',{error:'Post could not be saved.'}));
      })
  });

  app.post('/link/:id',requiresLogin,(req,res)=>{
    var id = req.params.id;
    Community.findOneAndUpdate({_id:id},{$push:{material:req.body.link}},{new:true}).then((comm)=>{
      if (!comm) {
        return res.status(404).render('error.hbs',{error:'Community could not be found.'});
      }
      res.status(200).redirect('/community/'+id);
    }).catch((e)=>res.status(400).render('error.hbs',{error:'Community could not be updated.'}));
  },(e)=>res.status(400).render('error.hbs',{error:'Link could not be saved.'}));

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
