const express = require('express');
const app = express();
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const session = require('express-session');
const { mongoURI } = require('./dev');
const cors = require('cors');
const port = 3000;
require('dotenv').config();

app.use(cors());
app.use(express.json({ limit: '100mb' })); // JSON 데이터 크기 제한
app.use(express.urlencoded({ limit: '100mb', extended: true })); // URL-encoded 데이터 크기 제한

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

// 로그인 엔드포인트
app.get('/login', async (req, res) => {
  const userId = req.query.userid;
  const userPs = req.query.userpassword;
  let user = await db.collection('user').findOne({ userId: userId });
  if (!user) {
    res.json({ message: "아이디없음" });
  } else {
    if (user.userPs == userPs) {
      res.json({ userId: userId, userPs: userPs });
    } else {
      res.json({ message: "비밀번호 틀림" });
    }
  }
});

// 아이디 중복 확인 엔드포인트
app.get('/duplication', async (req, res) => {
  const userId = req.query.userId;
  let user = await db.collection('user').findOne({ userId: userId });
  if (user) {
    res.json({ message: "아이디가 중복입니다." });
  } else {
    res.json({ message: "아이디 사용가능합니다." });
  }
});

// 회원가입 엔드포인트
app.get('/signup', async (req, res) => {
  console.log('통신중입니다.')
  const userId = req.query.userId;
  const userPs = req.query.userPs;
  const userRPs = req.query.userRPs;
  let user = await db.collection('user').findOne({ userId: userId });
  if (user) {
    res.json({ message: "아이디가 중복입니다." });
  } else {
    if (userPs === userRPs) {
      console.log(userRPs, userPs)
      db.collection('user').insertOne({
        userId: userId,
        userPs: userPs,
        견과류: false,
        계란: false,
        닭고기: false,
        돼지고기: false,
        밀가루: false,
        바나나: false,
        사과: false,
        새우: false,
        생선: false,
        우유: false,
        포도: false,
        해산물: false
      });
      res.json({ userId: userId });
    } else {
      console.log(userPs, userRPs)
      res.json({ message: "비밀번호가 일치하지 않습니다." });
    }
  }
});

// Base64 이미지 데이터 처리 엔드포인트
app.post('/base64', (req, res) => {
  const { userid, food } = req.body;
  // db.collection('image').insertOne({userId:userid,food:food})
  if (!userid || !food) {
    return res.status(400).json({ error: 'Invalid input data' });
  }
  console.log(food)
  console.log(`Received image from user: ${userid}`);
  res.json({
    userId: userid,
    message: '이미지가 성공적으로 처리되었습니다.'
  });
});


