const {ObjectID} = require('mongodb');
const jwt = require('jsonwebtoken');

const {Community} = require('./../../models/community');
const {Topic} = require('./../../models/topic');
const {User} = require('./../../models/user');


const commOneId = new ObjectID();
const commTwoId = new ObjectID();
const topicOneId = new ObjectID();
const topicTwoId = new ObjectID();
const userOneId = new ObjectID();
const userTwoId = new ObjectID();

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

const users = [{
  _id:userOneId,
  first_name:'Hemanth',
  last_name:'Yakkali',
  email:'hemanth.yakkali@duke.edu',
  password:'testpassword',
  tokens:[{
    access:'auth',
    token:jwt.sign({_id:userOneId,access:'auth'},'abc123').toString()
  }]
},{
  _id:userTwoId,
  first_name:'Spencer',
  last_name:'Schneier',
  email:'spencer@lyceum.network',
  password:'testanotherpassword',
  tokens:[{
    access:'auth',
    token:jwt.sign({_id:userTwoId,access:'auth'},'abc123').toString()
  }]
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

const populateUsers = (done)=>{
  User.remove({}).then(()=>{
    var userOne = new User(users[0]).save();
    var userTwo = new User(users[1]).save();

    return Promise.all([userOne,userTwo])
  }).then(()=>done());
};

module.exports = {communities,populateComms,topics,populateTopics,users,populateUsers};
