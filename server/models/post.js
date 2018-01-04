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
  },
  topic:{
    type:mongoose.Schema.Types.ObjectId,
    required:true,
  }
});

var Post = mongoose.model('Post',PostSchema);

module.exports = {Post};
