module.exports = (app)=>{
  app.get('/',(req,res)=>{
    res.render('index.hbs');
  });

  app.get('/track-create',(req,res)=>{
    res.render('track-create.hbs');
  });
}
