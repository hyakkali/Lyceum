var {Community} = require('./../models/community');
var {Resource} = require('./../models/resource');
var {Post} = require('./../models/post');


var requiresLogin = (req,res,next)=>{
  if (req.session && req.session.userId) {
    return next();
  }
  res.render('login_required.hbs');
}

var isAuthenticated = (req,res,next)=>{
  if (req.session && req.session.userId) {
    return next();
  }
  return res.render('index.hbs');
}

var requiresOwner = (req,res,next)=>{
  //already logged in from requiresLogin middleware
  Community.findById(req.params.id).then((comm)=>{
    if (!comm) {
      return res.status(404).render('error.hbs',{error:'Community could not be found.'});
    }
    if (comm.createdBy.equals(req.session.userId)) {
      return next();
    }
    return res.status(401).render('error.hbs',{error:'Only owner of community can access this page.'});
  })
}

var isOwner = (req,res,next)=>{
  id = req.params.id; //community id
  Community.findById(id).then((comm)=>{
    if (!comm) {
      return res.status(404).render('error.hbs',{error:'Community could not be found.'});
    }
    if (!comm.createdBy.equals(req.session.userId)) {
      return next();
    }
    Resource.find({community:id}).then((resources)=>{
      Post.find({community:id}).then((posts)=>{
        return res.render('community.hbs',{community:comm,posts:posts,resources:resources,owner:true});
      },(e)=> res.status(400).render('error.hbs',{error:"Posts could not be found."}));
    },(e)=> res.status(400).render('error.hbs',{error:"Resources could not be found."}));
  }).catch((e)=>res.status(400).render('error.hbs',{error:e}));
}

module.exports = {requiresLogin,isAuthenticated,requiresOwner,isOwner};
