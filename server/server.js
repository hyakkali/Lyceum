const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const hbs = require('hbs');

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI||'mongodb://localhost:27017/Communities');

var app = express();
var port = process.env.PORT || 3000;

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
