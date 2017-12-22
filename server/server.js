const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const bodyParser = require('body-parser');
const hbs = require('hbs');

const publicPath = path.join(__dirname,'../public');

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI||'mongodb://localhost:27017/Communities');

var app = express();
var port = process.env.PORT || 3000;

app.use(session({
  secret:'work hard',
  resave:true,
  saveUninitialized:false,
  store:new MongoStore({
    mongooseConnection:mongoose.connection
  })
}));

app.use(express.static(publicPath));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ //allows form submission to be read
  extended:true
}));

hbs.registerPartials('./../views/partials');
app.set('view engine','hbs');

require('./routes.js')(app);

app.listen(port,()=>{
  console.log('The magic happens on port',port);
});

module.exports = {app};
