const mongoose  = require('mongoose');

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

var ResourceSchema = mongoose.Schema({
  name:{
    type:String,
    required:true,
    trim:true,
    minlength:1,
    unique:false
  },
  link:{
    type:String,
    required:true,
    trim:true,
    minlength:1,
    unique:false
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
  reviews:[PostSchema],
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

var Resource = mongoose.model('Resource',ResourceSchema);

module.exports = {Resource};
