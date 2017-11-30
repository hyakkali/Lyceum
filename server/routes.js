var {Community} = require('./models/community');
const moment = require('moment');
const {ObjectID} = require('mongodb');
const _ = require('lodash');

module.exports = (app)=>{
  app.get('/',(req,res)=>{
    res.render('index.hbs');
  });

  app.get('/community-create',(req,res)=>{
    res.render('community-create.hbs');
  });

  app.post('/community-create',(req,res)=>{
    var comm = new Community({
      name:req.body.name,
      description:req.body.description,
      createdAt: new Date().getTime(),
    });
    if (req.body.material) { //if material is posted
      comm.material=req.body.material
    }
    comm.save().then((doc)=>{
      // res.send(doc);
      res.redirect('/community/'+comm._id); //redirect to community page
    },(e)=>{
      res.status(400).send(e);
    });
  });

  app.patch('/community/:id',(req,res)=>{
    var id = req.params.id;
    var body = _.pick(req.body,['name','description','material']);

    if (!ObjectID.isValid(id)) {
      return res.status(404).send();
    }

    Community.findOneAndUpdate({_id:id},{$set:body},{new:true}).then((comm)=>{
      if (!comm) {
        return res.status(404).send();
      }
      res.send({comm});
    }).catch((e)=>{
      res.status(400).send();
    });
  });

  app.delete('/community/:id',(req,res)=>{
    var id = req.params.id;

    if (!ObjectID.isValid(id)) {
      return res.status(404).send();
    }

    Community.findOneAndRemove({
      _id:id
    }).then((comm)=>{
      if (!comm) {
        return res.status(404).send();
      }
      res.status(200).send({comm})
    }).catch((e)=>res.status(400).send());
  });

  app.get('/communities',(req,res)=>{ //GET all communities
    Community.find().then((comms)=>{
      res.send({comms});
    },(e)=>{
      if (e) {
        res.status(400).send(e)
      }
    });
  });

  app.get('/community/:id',(req,res)=>{ //GET specific community page
    var id = req.params.id;

    if (!ObjectID.isValid(id)) {
      return res.status(404).send();
    };

    Community.findById(id).then((comm)=>{
      if (!comm) {
        return res.status(404).send();
      }

      res.status(200).send({comm});
    }).catch((e)=>res.status(400).send());
  });
}
