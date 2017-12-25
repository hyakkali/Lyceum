var {Community} = require('./models/community');
var {Topic} = require('./models/topic');
var {User} = require('./models/user');
var {Post} = require('./models/post');

var {requiresLogin,isAuthenticated} = require('./middleware/loginRequired');

const moment = require('moment');
const {ObjectID} = require('mongodb');
const _ = require('lodash');

module.exports = (app)=>{

  app.get('/',isAuthenticated,(req,res)=>{
    var user = true;
    res.render('index.hbs',{user:user});
  });

// USER

  app.get('/register',(req,res)=>{
    res.render('signup.hbs');
  })

  app.get('/login',(req,res)=>{
    res.render('login.hbs');
  })

  app.post('/register',(req,res)=>{

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
      res.status(400).send(e);
    });
  });

  app.post('/login',(req,res,next)=>{
    User.authenticate(req.body.email,req.body.password,(err,user)=>{
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

  app.get('/profile',requiresLogin,(req,res,next)=>{
    User.findById(req.session.userId)
      .exec((err,user)=>{
        if (err) {
          return next(err);
        }
        if (user===null) {
          var err = new Error('Not authorized! Go back!');
          err.status = 400;
          return next(err);
        }
        return res.status(200).render('profile.hbs',{user:user});
      });
  });

  app.get('/logout',requiresLogin,(req,res,next)=>{
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

  app.post('/community-create',requiresLogin,(req,res)=>{
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

  app.patch('/community/:id',requiresLogin,(req,res)=>{
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

  app.delete('/community/:id',requiresLogin,(req,res)=>{
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

  app.get('/community/:id',requiresLogin,(req,res)=>{ //GET specific community page
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

  app.post('/post/:id',requiresLogin,(req,res)=>{
    var id = req.params.id; // community id
    var time = new Date().getTime();
    User.findById(req.session.userId)
      .exec((err,user)=>{
        if (err) {
          return next(err);
        }
        if (user===null) {
          var err = new Error('Not authorized! Go back!');
          err.status = 400;
          return next(err);
        }
        var post = new Post({
          message:req.body.message,
          createdAt: moment(time).format('h:mm a'),
          createdBy:user.first_name+' '+user.last_name
        });

        post.save().then((doc)=>{
          // res.status(200).send(doc);
          Community.findOneAndUpdate({_id:id},{$push:{posts:post}},{new:true}).then((comm)=>{
            if (!comm) {
              return res.status(404).send();
            }
            res.status(200).redirect('/community/'+id); //reload same page with new post saved
          }).catch((e)=>res.status(400).send());
        },(e)=>res.status(400).send(e));
      })
  });

  app.post('/link/:id',requiresLogin,(req,res)=>{
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
