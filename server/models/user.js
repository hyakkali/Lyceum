const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

var UserSchema = new mongoose.Schema({
  first_name:{
    type:String,
    required:true,
    trim:true,
    minlength:1,
    unique:false
  },
  last_name:{
    type:String,
    required:true,
    trim:true,
    minlength:1,
    unique:false
  },
  email:{
    type:String,
    required:true,
    trim:true,
    minlength:1,
    unique:true,
    validate:{
      validator:validator.isEmail,
      message:'{VALUE} is not a valid e-mail'
    }
  },
  username:{
    type:String,
    required:true,
    trim:true,
    minlength:1,
    unique:true
  },
  password:{
    type:String,
    required:true,
    minlength:6
  },
});

UserSchema.statics.authenticate = function(email,password,callback){
  User.findOne({email:email})
    .exec(function (err,user) {
      if (err) {
        return callback(err)
      }else if (!user) {
        var err = new Error('User not found.');
        err.status = 401;
        return callback(err);
      }
      bcrypt.compare(password,user.password,function(err,result){
        if (result==true) {
          return callback(null,user);
        }else {
          return callback();
        }
      })
    });
}

UserSchema.pre('save',function (next) {
  var user = this;
  bcrypt.hash(user.password,10,function (err,hash) {
    if (err) {
      return next(err);
    }
    user.password=hash;
    next();
  })
});

var User = mongoose.model('User',UserSchema);

module.exports = {User};
