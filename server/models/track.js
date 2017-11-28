const mongoose  = require('mongoose ');
const validator = require('validator');

var trackSchema = mongoose.Schema({
  name:{
    type:String,
    required:true,
    trim:true,
    minlength:1,
    unique:false
  },
  description:{
    type:String,
    required:true,
    minlength:1,
    unique:false
  },
  createdBy:{
    type: mongoose.Schema.Types.ObjectId,
    required:true
  },
  createdAt:{
    type:Number,
    required:true
  },
  material:[{
    type:String
    validate:{
      validator:validator.isURL,
      message:'{VALUE} is not a valid URL'
    }
  }]
});

var Track = mongoose.model('Track',trackSchema);

module.exports = {Track};
