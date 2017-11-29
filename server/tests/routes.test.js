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
      .expect(200)
      .expect((res)=>{
        expect(res.body.name).toBe('Relative Physics');
        expect(res.body.description).toBe('Generic description');
        expect(res.body.material).toEqual([
          'https://thenounproject.com/',
          'https://en.wikipedia.org/wiki/Quantum_computing'
        ]);
      })
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
