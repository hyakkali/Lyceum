var {Topic} = require('./../models/topic');
var {Resource} = require('./../models/resource');
var {Post} = require('./../models/post');
var {User} = require('./../models/user');
var {Review} = require('./../models/review');

var requiresLogin = (req,res,next)=>{
  if (req.session && req.session.userId) {
    return next();
  }
  res.status(401).render('login_required.hbs');
}

var requiresOwner = (req,res,next)=>{
  //already logged in from requiresLogin middleware
  Topic.findById(req.params.id).then((topic)=>{
    if (!topic) {
      return res.status(404).render('error.hbs',{error:'Topic could not be found.'});
    }
    if (topic.createdBy===req.session.username) {
      return next();
    }
    return res.status(401).render('error.hbs',{error:'Only owner of topic can access this page.'});
  })
}

var isOwner = (req,res,next)=>{
  id = req.params.id; //topic id
  Topic.findById(id).then((topic)=>{
    if (!topic) {
      return res.status(404).render('error.hbs',{error:'Topic could not be found.'});
    }
    if (topic.createdBy!==req.session.username) {
      return next();
    }
    Resource.find({topic:id}).then((resources)=>{
      return res.render('topic.hbs',{topic:topic,resources:resources,user:true,owner:true});
    },(e)=> res.status(400).render('error.hbs',{error:"Resources could not be found."}));
  }).catch((e)=>res.status(400).render('error.hbs',{error:e}));
}

var hasPostedReview = (req,res,next)=>{
  id = req.params.id; //resource id
  //find resource with that id
  Resource.findById(id).then((resource)=>{
    if (!resource) {
      return res.status(404).render('error.hbs',{error:'Resource could not be found.'});
    }
    //check if userid is in resource.postedUsers
    //if inside, return error page
    User.findById(req.session.userId).then((user)=>{
      if (!user) {
        return res.status(404).render('error.hbs',{error:'User could not be found.'});
      }
      if (resource.postedUsers.indexOf(user.username)>-1) {
        return res.status(401).render('error.hbs',{error:"You have already posted a review."});
      }
      //otherwise return next()
      return next();
    }).catch((e)=>res.status(400).render('error.hbs',{error:e}));
  }).catch((e)=>res.status(400).render('error.hbs',{error:e}));
}

var isResourceOwner = (req,res,next)=>{ //for making sure owner can't post review on created resource
  Resource.findById(req.params.id).then((resource)=>{ //resource id
    if (!resource) {
      return res.status(404).render('error.hbs',{error:'Resource could not be found.'});
    }
    User.findById(req.session.userId).then((user)=>{
      if (!user) {
        return res.status(404).render('error.hbs',{error:'User could not be found.'});
      }
      if (resource.createdBy!==user.username) {
        return next();
      }
      return res.status(401).render('error.hbs',{error:"Owner of resource cannot post review."});
    }).catch((e)=>res.status(400).render('error.hbs',{error:e}));
  }).catch((e)=>res.status(400).render('error.hbs',{error:e}));
}

module.exports = {requiresLogin,requiresOwner,isOwner,hasPostedReview,isResourceOwner};
