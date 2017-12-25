var {User} = require('./../models/user');

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

module.exports = {requiresLogin,isAuthenticated};
