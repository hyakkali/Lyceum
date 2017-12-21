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
    required:false,
    trim:true,
    minlength:1,
    unique:false
  },
  createdAt:{
    type:Number,
    required:true
  }
});

var Post = mongoose.model('Post',PostSchema);

module.exports = {Post};
