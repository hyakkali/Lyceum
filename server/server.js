const express = require('express');

var app = express();
var port = process.env.PORT || 3000;

app.set('view engine','hbs');

require('./routes.js')(app);

app.listen(port,()=>{
  console.log('The magic happens on port',port);
});
