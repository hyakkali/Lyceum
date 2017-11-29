module.exports = (app)=>{
  app.get('/',(req,res)=>{
    res.render('index.hbs');
  });

  app.get('/community-create',(req,res)=>{
    res.render('community-create.hbs');
  });
}
