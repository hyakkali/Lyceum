const {ObjectID} = require('mongodb');

const {Topic} = require('./../models/topic');
const {User} = require('./../models/user');
const {Resource} = require('./../models/resource');
const {Review} = require('./../models/review');

const topicOneId = new ObjectID();
const topicTwoId = new ObjectID();

const userOneId = new ObjectID();
const userTwoId = new ObjectID();

const resOneId = new ObjectID();
const resTwoId = new ObjectID();
const resThreeId = new ObjectID();
const resFourId = new ObjectID();

const reviewOneId = new ObjectID();
const reviewTwoId = new ObjectID();

const topics = [{
  _id:topicOneId,
  name:'Quantum Computing',
  description:'Seed database description',
  image:'http://www.wallquotes.com/sites/default/files/arts0153-81.png',
  createdBy:'hyakkali',
  createdAt:10000,
},{
  _id:topicTwoId,
  name:'Hyperloop',
  description:'Seed database description 2',
  image:'http://www.wallquotes.com/sites/default/files/styles/uc_canvas/public/arts0154-83.png?itok=Z9YWDF1k',
  createdBy:'spencer',
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
  createdAt:'2018-1-4 13:06:02',
  topic:topicOneId,
  postedUsers:['randomusername','spencer']
},{
  _id:resTwoId,
  name:'Wikipedia on Hyperloop',
  link:'https://en.wikipedia.org/wiki/Hyperloop',
  description:'Wikipedia entry on hyperloop.',
  likes:5,
  dislikes:3,
  createdBy:'spencer',
  createdAt:'2018-1-4 13:06:02',
  topic:topicOneId,
  postedUsers:[]
},{
  _id:resThreeId,
  name:'Facebook group on Hyperloop',
  link:'facebook.com',
  description:'Facebook group on hyperloop.',
  likes:4,
  dislikes:14,
  createdBy:'hyakkali',
  createdAt:'2018-1-4 13:06:02',
  topic:topicTwoId,
  postedUsers:['randomusername']
},{
  _id:resFourId,
  name:'Slack group on Hyperloop',
  link:'slack.com',
  description:'Slack group on hyperloop.',
  likes:10,
  dislikes:3,
  createdBy:'hyakkali',
  createdAt:'2018-1-4 13:06:02',
  topic:topicTwoId,
  postedUsers:['randomusername']
}];

const reviews = [{
  _id:reviewOneId,
  message:'Love this resource!',
  liked:true,
  disliked:false,
  createdBy:'spencer',
  createdAt:'2018-1-4 13:06:02',
  resource: resFourId
},{
  _id:reviewTwoId,
  message:'Hate this resource!',
  liked:false,
  disliked:true,
  createdBy:'spencer',
  createdAt:'2018-1-4 13:06:02',
  resource:resThreeId
}];

const users = [{
  _id:userOneId,
  first_name:'Hemanth',
  last_name:'Yakkali',
  email:'hemanth.yakkali@duke.edu',
  username:'hyakkali',
  password:'testpassword',
  createdAt:'2018-1-4 13:06:02',
  lastLogin:'2018-1-4 13:06:02'
},{
  _id:userTwoId,
  first_name:'Spencer',
  last_name:'Schneier',
  email:'spencer@lyceum.network',
  username:'spencer',
  password:'testanotherpassword',
  createdAt:'2018-1-4 13:06:02',
  lastLogin:'2018-1-4 13:20:10'
}];

const populateTopics = (done)=>{
  Topic.remove({}).then(()=>{
    var topicOne = new Topic(topics[0]).save();
    var topicTwo = new Topic(topics[1]).save();

  return Promise.all([topicOne,topicTwo])
}).then(()=>done());
};

const populateResources = (done)=>{
  Resource.remove({}).then(()=>{
    var resOne = new Resource(resources[0]).save();
    var resTwo = new Resource(resources[1]).save();
    var resThree = new Resource(resources[2]).save();
    var resFour = new Resource(resources[3]).save();

    return Promise.all([resOne,resTwo,resThree,resFour])
  }).then(()=>done());
};

const populateReviews = (done)=>{
  Review.remove({}).then(()=>{
    var reviewOne = new Review(reviews[0]).save();
    var reviewTwo = new Review(reviews[1]).save();

    return Promise.all([reviewOne,reviewTwo])
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
  topics,
  populateTopics,
  users,
  populateUsers,
  resources,
  populateResources,
  reviews,
  populateReviews
};
