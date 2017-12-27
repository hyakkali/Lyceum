const mongoose  = require('mongoose');

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
  createdBy:{
    type:mongoose.Schema.Types.ObjectId,
    required:true,
  },
  createdAt:{
    type:Number,
    required:true
  },
});

var Community = mongoose.model('Community',CommunitySchema);

module.exports = {Community};
