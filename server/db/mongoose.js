const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

// mongoose.connect(process.env.MONGODB_URI,{
//   useMongoClient:true
// });

var prodURI = 'mongodb://hyakkali:XLGXf6WBTErBarre@ds141657.mlab.com:41657/lyceummvp';

mongoose.connect(prodURI,{
  useMongoClient:true
});

var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

module.exports = {mongoose};
