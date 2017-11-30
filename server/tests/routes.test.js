const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');
const mongoose = require('mongoose');

const {app} = require('./../server');
const {Community} = require('./../models/community');
const {communities,populateComms} = require('./seed/seed');

beforeEach(populateComms);

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/CommunityTest');

describe('POST /community-create', ()=> {
  it('should create a new community', (done) =>{
    request(app)
      .post('/community-create')
      .send({
        name:'Relative Physics',
        description: 'Generic description',
        material:[
          'https://thenounproject.com/',
          'https://en.wikipedia.org/wiki/Quantum_computing'
        ]
      })
      .expect(302)
      // .expect((res)=>{
      //   expect(res.body.name).toBe('Relative Physics');
      //   expect(res.body.description).toBe('Generic description');
      //   expect(res.body.material).toEqual([
      //     'https://thenounproject.com/',
      //     'https://en.wikipedia.org/wiki/Quantum_computing'
      //   ]);
      // })
      .end((err,res)=>{
        if (err) {
          return done(err);
        }
        Community.find({
          name:'Relative Physics'
        }).then((comms)=>{
          expect(comms.length).toBe(1);
          done();
        }).catch((e)=>done(e));
      });
  });

  it('should not create community with invalid body data', (done) =>{
    request(app)
      .post('/community-create')
      .send({})
      .expect(400)
      .end((err,res)=>{
        if (err) {
          return done(err);
        }

        Community.find().then((comms)=>{
          expect(comms.length).toBe(2); //2 comms in seed data
          done();
        }).catch((e)=>done(e));
      });
  });
});

describe('GET /communities', ()=>{
  it('should return all communities', (done)=> {
    request(app)
      .get('/communities')
      .expect(200)
      .expect((res)=>{
        expect(res.body.comms.length).toBe(2);
      })
      .end(done);
  });
});

describe('GET /community/:id', ()=> {
  it('should return community', (done) =>{
    request(app)
      .get(`/community/${communities[0]._id.toHexString()}`)
      .expect(200)
      .expect((res)=>{
        expect(res.body.comm.name).toBe(communities[0].name);
        expect(res.body.comm.description).toBe(communities[0].description);
        expect(res.body.comm.createdAt).toBe(communities[0].createdAt);
        expect(res.body.comm.material).toEqual(communities[0].material);
      })
      .end(done);
  });
});

describe('PATCH /community/:id', ()=> {
  it('should update the todo', (done)=> {
    var id = communities[0]._id.toHexString();
    var name = 'Update name';
    var description = 'Update name';
    var material = ['https://calendar.google.com/','https://www.facebook.com/'];

    request(app)
      .patch(`/community/${id}`)
      .send({
        name,
        description,
        material
      })
      .expect(200)
      .expect((res)=>{
        expect(res.body.comm.name).toBe(name);
        expect(res.body.comm.description).toBe(description);
        expect(res.body.comm.material).toEqual(material);
      })
      .end(done)
  });
});

describe('DELETE /community/:id', ()=> {
  it('should remove a community', (done) =>{
    var id = communities[0]._id.toHexString();

    request(app)
      .delete(`/community/${id}`)
      .expect(200)
      .expect((res)=>{
        expect(res.body.comm._id).toBe(id)
      })
      .end((err,res)=>{
        if (err) {
          return done(err);
        }
        Community.findById(id).then((comm)=>{
          expect(comm).toBeFalsy();
          done();
        }).catch((e)=>done(e));
      });
  });

  it('should return a 404 if community not found', (done) =>{
    var id = new ObjectID().toHexString();
    request(app)
      .delete(`/community/${id}`)
      .expect(404)
      .end(done);
  });

  it('should return a 404 if object is invalid', (done) =>{
    request(app)
      .delete('/community/12344')
      .expect(404)
      .end(done);
  });
});
