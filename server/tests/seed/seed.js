const {ObjectID} = require('mongodb');

const {Community} = require('./../../models/community');

const commOneId = new ObjectID();
const commTwoId = new ObjectID();

const communities = [{
  _id:commOneId,
  name:'Quantum Computing',
  description:'Seed database description',
  createdAt:10000,
  material:[
    'https://thenounproject.com/',
    'https://en.wikipedia.org/wiki/Quantum_computing'
  ]
},{
  _id:commTwoId,
  name:'Hyperloop',
  description:'Seed database description 2',
  createdAt:150000,
  material:[
    'https://thenounproject.com/',
    'https://en.wikipedia.org/wiki/Quantum_computing'
  ]
}];

const populateComms = (done)=>{
  Community.remove({}).then(()=>{
    var commOne = new Community(communities[0]).save();
    var commTwo = new Community(communities[1]).save();

  return Promise.all([commOne,commTwo])
}).then(()=>done());
};

module.exports = {communities,populateComms};
