const express = require('express');
const app = express();
const { MongoClient, ObjectId } = require('mongodb');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const session = require('express-session');
const { mongoURI } = require('./dev');
const cors = require('cors');
app.use(cors());
const port = 3000;
require('dotenv').config();

app.use(session({
  secret: '암호화에 쓸 비번',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60 * 60 * 1000 }
}));

let db;
const url = mongoURI;

new MongoClient(url).connect().then((client) => {
  console.log('DB연결성공');
  db = client.db('allergic');
}).catch((err) => {
  console.log(err);
});

app.listen(port, () => {
  console.log(`http://localhost:${port} 에서 서버 실행중`);
});



app.get('/login', async (req, res) => {
  const userId = req.query.userid;
  const userPs = req.query.userpassword;
  let user= await db.collection('user').findOne({ userId:userId});
  console.log(userId)
  console.log(user.userId)
  console.log(userPs)
  console.log(user.userPs)
  if(!user){
    res.json({message:"아이디없음"})
  }
  else{
    if(user.userPs==userPs){
      res.json({userId:userId,userPs:userPs})
    }
    else{
      res.json({message:"비밀번호 틀림"})
    }
  }
  })
  
  app.get('/duplication',async (req,res)=>{
    const userId="huon";//req.query.userid;
    let user=await db.collection('user').findOne({userId:userId});
    if(user){
      console.log("아이디중복")
    }
    else{
      console.log("아이디쓸수있음")
    }
  })

  app.get('/signup',async (req,res)=>{
    const userId="huho";//req.query.userid;
    const userPs="1416";//req.query.userps;
    let user=await db.collection('user').findOne({userId:userId});
    if(user){
      console.log("아이디중복")
    }
    else{
      console.log("아이디쓸수있음")
      db.collection('user').insertOne( {
        userId : userId, 
        userPs : userPs,
        견과류:false,
        계란:false,
        닭고기:false,
        돼지고기:false,
        밀가루:false,
        바나나:false,
        사과:false,
        새우:false,
        생선:false,
        우유:false,
        포도:false,
        해산물:false
      });
    }
  })