require('./config/config');

const express = require('express');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const bodyParser = require('body-parser');
const hbs = require('hbs');
const helmet = require('helmet');
const moment = require('moment');

const {mongoose} = require('./db/mongoose');

const publicPath = path.join(__dirname,'../public');
const viewsPath = path.join(__dirname,'../views');

var app = express();
var port = process.env.PORT;

app.use(session({
  secret:'work hard',
  resave:true,
  saveUninitialized:false,
  store:new MongoStore({
    mongooseConnection:mongoose.connection
  })
}));

app.use(helmet());

app.use(express.static(publicPath));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ //allows form submission to be read
  extended:true
}));

hbs.registerPartials(viewsPath+'/partials');
hbs.registerHelper("inc",(value,options)=>{
  return parseInt(value)+1;
});
hbs.registerHelper("date",(value,options)=>{
  return moment(value).format('MM/DD/YYYY h:mm a')
})
app.set('view engine','hbs');

require('./routes.js')(app);

app.listen(port,()=>{
  console.log('The magic happens on port',port);
});

module.exports = {app};
