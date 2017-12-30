const {ObjectID} = require('mongodb');

const {Community} = require('./../../models/community');
// const {Topic} = require('./../../models/topic');
const {User} = require('./../../models/user');
const {Resource} = require('./../../models/resource');

const commOneId = new ObjectID();
const commTwoId = new ObjectID();
// const topicOneId = new ObjectID();
// const topicTwoId = new ObjectID();
const userOneId = new ObjectID();
const userTwoId = new ObjectID();

const resOneId = new ObjectID();
const resTwoId = new ObjectID();
const resThreeId = new ObjectID();


const communities = [{
  _id:commOneId,
  name:'Quantum Computing',
  description:'Seed database description',
  createdBy:userOneId,
  createdAt:10000,
},{
  _id:commTwoId,
  name:'Hyperloop',
  description:'Seed database description 2',
  createdBy:userTwoId,
  createdAt:150000,
}];

const resources = [{
  _id:resOneId,
  name:'Wikipedia on Quantum Computing',
  link:'https://en.wikipedia.org/wiki/Quantum_computing',
  description:'Wikipedia entry on quantum computing.',
  likes:4,
  dislikes:14,
  createdBy:'hyakkali',
  createdAt:'4:18 pm',
  community:commOneId,
  postedUsers:['randomusername','spencer']
},{
  _id:resTwoId,
  name:'Wikipedia on Hyperloop',
  link:'https://en.wikipedia.org/wiki/Hyperloop',
  description:'Wikipedia entry on hyperloop.',
  likes:5,
  dislikes:3,
  createdBy:'spencer',
  createdAt:'3:14 pm',
  community:commTwoId,
  postedUsers:[]
},{
  _id:resThreeId,
  name:'Facebook group on Hyperloop',
  link:'facebook.com',
  description:'Facebook group on hyperloop.',
  likes:4,
  dislikes:14,
  createdBy:'hyakkali',
  createdAt:'3:14 pm',
  community:commTwoId,
  postedUsers:['randomusername']
}];

// const topics = [{
//   _id:topicOneId,
//   name:'Quantum Physics',
//   description:'Seed database description for topic',
//   createdAt:10000,
//   material:[
//     'https://thenounproject.com/',
//     'https://en.wikipedia.org/wiki/Quantum_computing'
//   ]
// },{
//   _id:topicTwoId,
//   name:'Loop Physics',
//   description:'Seed database description 2 for topic',
//   createdAt:150000,
//   material:[
//     'https://thenounproject.com/',
//     'https://en.wikipedia.org/wiki/Quantum_computing'
//   ]
// }];

const users = [{
  _id:userOneId,
  first_name:'Hemanth',
  last_name:'Yakkali',
  email:'hemanth.yakkali@duke.edu',
  username:'hyakkali',
  password:'testpassword',
},{
  _id:userTwoId,
  first_name:'Spencer',
  last_name:'Schneier',
  email:'spencer@lyceum.network',
  username:'spencer',
  password:'testanotherpassword',
}];

const populateComms = (done)=>{
  Community.remove({}).then(()=>{
    var commOne = new Community(communities[0]).save();
    var commTwo = new Community(communities[1]).save();

  return Promise.all([commOne,commTwo])
}).then(()=>done());
};

// const populateTopics = (done)=>{
//   Topic.remove({}).then(()=>{
//     var topicOne = new Topic(topics[0]).save();
//     var topicTwo = new Topic(topics[1]).save();
//
//   return Promise.all([topicOne,topicTwo])
// }).then(()=>done());
// };

const populateResources = (done)=>{
  Resource.remove({}).then(()=>{
    var resOne = new Resource(resources[0]).save();
    var resTwo = new Resource(resources[1]).save();
    var resThree = new Resource(resources[2]).save();

    return Promise.all([resOne,resTwo,resThree])
  }).then(()=>done());
};

const populateUsers = (done)=>{
  User.remove({}).then(()=>{
    var userOne = new User(users[0]).save();
    var userTwo = new User(users[1]).save();

    return Promise.all([userOne,userTwo])
  }).then(()=>done());
};

module.exports = {
  communities,
  populateComms,
  // topics,
  // populateTopics,
  users,
  populateUsers,
  resources,
  populateResources
};
