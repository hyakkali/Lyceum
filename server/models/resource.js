const mongoose  = require('mongoose');

var ResourceSchema = mongoose.Schema({
  link:{
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
  }
});

var Resource = mongoose.model('Resource',ResourceSchema);

module.exports = {Resource};
