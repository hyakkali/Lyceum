const mongoose  = require('mongoose');
const validator = require('validator');

var PostSchema = mongoose.Schema({
  message:{
    type:String,
    required:true,
    trim:true,
    minlength:1,
    unique:false
  },
  createdBy:{
    type:String,
    required:true,
    trim:true,
    minlength:1,
    unique:false
  },
  createdAt:{
    type:String,
    required:true
  }
});

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

var CommunitySchema = mongoose.Schema({
  name:{
    type:String,
    required:true,
    trim:true,
    minlength:1,
    unique:true
  },
  description:{
    type:String,
    required:true,
    minlength:1,
    unique:false
  },
  topic:[{
    type:mongoose.Schema.Types.ObjectId,
    required:false
  }],
  posts:[PostSchema],
  users:[UserSchema],
  createdBy:{
    type:mongoose.Schema.Types.ObjectId,
    required:true,
  },
  createdAt:{
    type:Number,
    required:true
  },
  material:[{
    type:String,
    validate:{
      validator:validator.isURL,
      message:'{VALUE} is not a valid URL'
    }
  }]
});

var Community = mongoose.model('Community',CommunitySchema);

module.exports = {Community};
