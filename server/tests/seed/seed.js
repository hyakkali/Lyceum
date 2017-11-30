const {ObjectID} = require('mongodb');

const {Community} = require('./../../models/community');
const {Topic} = require('./../../models/topic');

const commOneId = new ObjectID();
const commTwoId = new ObjectID();
const topicOneId = new ObjectID();
const topicTwoId = new ObjectID();

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

const topics = [{
  _id:topicOneId,
  name:'Quantum Physics',
  description:'Seed database description for topic',
  createdAt:10000,
  material:[
    'https://thenounproject.com/',
    'https://en.wikipedia.org/wiki/Quantum_computing'
  ]
},{
  _id:topicTwoId,
  name:'Loop Physics',
  description:'Seed database description 2 for topic',
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

const populateTopics = (done)=>{
  Topic.remove({}).then(()=>{
    var topicOne = new Topic(topics[0]).save();
    var topicTwo = new Topic(topics[1]).save();

  return Promise.all([topicOne,topicTwo])
}).then(()=>done());
};

module.exports = {communities,populateComms,topics,populateTopics};
