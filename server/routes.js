var {Community} = require('./models/community');
const moment = require('moment');

module.exports = (app)=>{
  app.get('/',(req,res)=>{
    res.render('index.hbs');
  });

  app.get('/community-create',(req,res)=>{
    res.render('community-create.hbs');
  });

  app.post('/community-create',(req,res)=>{
    if (req.body.material) {
      var comm = new Community({
        name:req.body.name,
        description:req.body.description,
        createdAt: new Date().getTime(),
        material:req.body.material
      });
    }else {
      var comm = new Community({
        name:req.body.name,
        description:req.body.description,
        createdAt: new Date().getTime(),
      });
    }
    comm.save().then((doc)=>{
      res.send(doc);
    },(e)=>{
      res.status(400).send(e);
    });
  });
}
