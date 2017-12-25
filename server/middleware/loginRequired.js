var {Community} = require('./../models/community');

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
  Community.findById(req.params.id).then((comm)=>{
    if (!comm) {
      return res.status(404).render('error.hbs',{error:'Community could not be found.'});
    }
    if (!comm.createdBy.equals(req.session.userId)) {
      return next();
    }
    return res.render('community.hbs',{community:comm,posts:comm.posts,owner:true})
  })
}

module.exports = {requiresLogin,isAuthenticated,requiresOwner,isOwner};
