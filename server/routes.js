var {Community} = require('./models/community');
var {Topic} = require('./models/topic');
var {User} = require('./models/user');
var {Post} = require('./models/post');

var {authenticate} = require('./middleware/authenticate');

const moment = require('moment');
const {ObjectID} = require('mongodb');
const _ = require('lodash');

module.exports = (app)=>{
  app.get('/',(req,res)=>{
    res.render('index.hbs');
  });

// USER

  app.get('/register',(req,res)=>{
    res.render('signup.hbs');
  })

  app.get('/login',(req,res)=>{
    res.render('login.hbs');
  })

  app.post('/register',(req,res,next)=>{

    var user = new User({
      first_name:req.body.first_name,
      last_name:req.body.last_name,
      email:req.body.email,
      password:req.body.password,
    });

    user.save().then((doc)=>{
      req.session.userId = user._id;
      res.redirect('/profile');
    },(e)=>{
      return next(error);
    });
  });

  app.post('/login',(req,res,next)=>{
    User.authenticate(req.body.logemail,req.body.logpassword,(err,user)=>{
      if (err||!user) {
        var err = new Error('Wrong email or password.');
        err.status = 401;
        return next(err);
      }else {
        req.session.userId=user._id;
        return res.redirect('/profile');
      }
    });
  })

  app.get('/profile',(req,res,next)=>{
    User.findById(req.session.userId)
      .exec((err,user)=>{
        if (err) {
          return next(err);
        }else {
          if (user===null) {
            var err = new Error('Not authorized! Go back!');
            err.status = 400;
            return next(err);
          }else {
            return res.send('<h1>Name: </h1>' + user.first_name + '<h2>Mail: </h2>' + user.email + '<br><a type="button" href="/logout">Logout</a>')
          }
        }
      });
  });

  app.get('/logout',(req,res,next)=>{
    if (req.session) {
      req.session.destroy(function (err) {
        if (err) {
          return next(err);
        }else {
          return res.redirect('/');
        }
      });
    }
  });
// COMMUNITY

  app.get('/community-create',(req,res)=>{
    res.render('community-create.hbs');
  });

  app.post('/community-create',(req,res)=>{
    var comm = new Community({
      name:req.body.name,
      description:req.body.description,
      createdAt: new Date().getTime(),
    });

    comm.save().then((doc)=>{
      // res.send(doc);
      res.redirect('/community/'+comm._id); //redirect to community page
    },(e)=>{
      res.status(400).send(e);
    });
  });

  app.patch('/community/:id',(req,res)=>{
    var id = req.params.id;
    var body = _.pick(req.body,['name','description','material']);

    if (!ObjectID.isValid(id)) {
      return res.status(404).send();
    }

    Community.findOneAndUpdate({_id:id},{$set:body},{new:true}).then((comm)=>{
      if (!comm) {
        return res.status(404).send();
      }
      res.send({comm});
    }).catch((e)=>{
      res.status(400).send();
    });
  });

  app.delete('/community/:id',(req,res)=>{
    var id = req.params.id;

    if (!ObjectID.isValid(id)) {
      return res.status(404).send();
    }

    Community.findOneAndRemove({
      _id:id
    }).then((comm)=>{
      if (!comm) {
        return res.status(404).send();
      }
      res.status(200).send({comm})
    }).catch((e)=>res.status(400).send());
  });

  app.get('/communities',(req,res)=>{ //GET all communities
    Community.find().then((comms)=>{
      res.status(200).render('community_list.hbs',{comms:comms})
      // res.send({comms});
    },(e)=>{
      if (e) {
        res.status(400).send(e)
      }
    });
  });

  app.get('/community/:id',(req,res)=>{ //GET specific community page
    var id = req.params.id;

    if (!ObjectID.isValid(id)) {
      return res.status(404).send();
    };

    Community.findById(id).then((comm)=>{
      if (!comm) {
        return res.status(404).send();
      }
      res.render('community.hbs',{community:comm,posts:comm.posts})
      // res.status(200).send({comm});
    }).catch((e)=>res.status(400).send());
  });

// POST

  app.post('/post/:id',(req,res)=>{
    var id = req.params.id;
    var post = new Post({
      message:req.body.message,
      createdAt: new Date().getTime(),
    });

    post.save().then((doc)=>{
      // res.status(200).send(doc);
      Community.findOneAndUpdate({_id:id},{$push:{posts:post.message}},{new:true}).then((comm)=>{
        if (!comm) {
          return res.status(404).send();
        }
        res.status(200).redirect('/community/'+id);
      }).catch((e)=>res.status(400).send());
      // res.status(200).render('community.hbs',{post:post})
    },(e)=>res.status(400).send(e));
  });

  app.post('/link/:id',(req,res)=>{
    var id = req.params.id;
    Community.findOneAndUpdate({_id:id},{$push:{material:req.body.link}},{new:true}).then((comm)=>{
      if (!comm) {
        return res.status(404).send();
      }
      res.status(200).redirect('/community/'+id);
    }).catch((e)=>res.status(400).send());
  },(e)=>res.status(400).send(e));

// TOPIC

  app.get('/topic-create',(req,res)=>{
    res.render('topic-create.hbs');
  });

  app.post('/topic-create',(req,res)=>{
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

  app.get('/topics',(req,res)=>{ //GET all communities
    Topic.find().then((topics)=>{
      res.send({topics});
    },(e)=>{
      if (e) {
        res.status(400).send(e)
      }
    });
  });

  app.get('/topic/:id',(req,res)=>{ //GET specific community page
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

// // USER
//
//   app.get('/users/signup',(req,res)=>{
//     res.render('signup.hbs');
//   })
//
//   app.post('/users/signup',(req,res)=>{
//     var body = _.pick(req.body,['first_name','last_name','email','password']);
//     var user = new User(body);
//     user.save().then((user)=>{
//       // res.send(user);
//       return user.generateAuthToken();
//     }).then((token)=>{
//       res.header('x-auth',token).send(user);
//     }).catch((e)=>{
//       res.status(400).send(e);
//     })
//   });
//
//   app.get('/users/profile/:id',authenticate,(req,res)=>{
//     var id = req.params.id;
//     if (!ObjectID.isValid(id)) {
//       return res.status(404).send();
//     }
//     User.findById(id).then((user)=>{
//       if (!user) {
//         return res.status(404).send();
//       }
//       res.status(200).send({user});
//     }).catch((e)=>done(e));
//   });
//
//   app.get('/users/login',(req,res)=>{
//     res.render('login.hbs');
//   })
//
//   app.post('/users/login',(req,res)=>{
//     var body = _.pick(req.body,['email','password']);
//
//     User.findByCredentials(body.email,body.password).then((user)=>{
//       return user.generateAuthToken().then((token)=>{
//         res.header('x-auth',token).send(user);
//       });
//     }).catch((e)=>{
//       res.status(400).send();
//     });
//   });
//
//   app.delete('/users/logout',authenticate,(req,res)=>{
//     req.user.removeToken(req.token).then(()=>{
//       res.status(200).send();
//     },()=>{
//       res.status(400).send();
//     });
//   });
//
}
