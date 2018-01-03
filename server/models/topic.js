const mongoose  = require('mongoose');

var TopicSchema = mongoose.Schema({
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
  createdBy:{
    type:mongoose.Schema.Types.ObjectId,
    required:true,
  },
  createdAt:{
    type:Number,
    required:true
  },
});

var Topic = mongoose.model('Topic',TopicSchema);

module.exports = {Topic};
