const mongoose  = require('mongoose');

var ResourceSchema = mongoose.Schema({
  name:{
    type:String,
    required:true,
    trim:true,
    minlength:1,
    unique:true
  },
  link:{
    type:String,
    required:true,
    trim:true,
    minlength:1,
    unique:true
  },
  description:{
    type:String,
    required:true,
    trim:true,
    minlength:1,
    unique:false
  },
  likes:{
    type:Number,
    required:true,
  },
  dislikes:{
    type:Number,
    required:true
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
  },
  community:{
    type:mongoose.Schema.Types.ObjectId,
    required:true,
  },
  postedUsers:[{
    type:String,
    trim:true,
    minlength:1,
    required:false,
  }]
});

var Resource = mongoose.model('Resource',ResourceSchema);

module.exports = {Resource};
