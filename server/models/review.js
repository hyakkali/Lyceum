const mongoose  = require('mongoose');

var ReviewSchema = mongoose.Schema({
  message:{
    type:String,
    required:false,
    trim:true,
    unique:false
  },
  liked:{
    type:Boolean,
    required:true
  },
  disliked:{
    type:Boolean,
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
    type:Number,
    required:true
  },
  resource:{
    type:mongoose.Schema.Types.ObjectId,
    required:true,
  }
})

var Review = mongoose.model('Review',ReviewSchema);

module.exports = {Review};
