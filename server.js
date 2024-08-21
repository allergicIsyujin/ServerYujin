const express = require('express');
const app = express();
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const session = require('express-session');
const { mongoURI } = require('./dev');
const cors = require('cors');
const port = 3000;
require('dotenv').config();
let foodimage=0;

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


// POST 요청을 보내는 함수
async function openAI_api(url, data) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json' // 요청 본문이 JSON 형식임을 명시
      },
      body: JSON.stringify(data) // 객체를 JSON 문자열로 변환하여 본문에 포함
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    // console.log(result);
    return result;
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

app.post('/openAI/say', async(req, res) => {
  // 사용자 알러지 문자열로 담는 변수
  let userAllergies = null;
  try{
    // user 컬렉션에 접근
    const userCollection = db.collection('user');

    const userIfomation = await userCollection.findOne({ userId: req.body.id });
    // Boolean 값이 true인 필드의 키 추출
    const trueFields = Object.keys(userIfomation).filter(key => userIfomation[key] === true);

    userAllergies = trueFields.join(" "); // 결과 출력
  } catch(error) {
    console.error("Error fetching user information:", error);
  }

  const dataToSend = {
    allergy: userAllergies,
    food: req.body.food
  };
  console.log(dataToSend);

  const apiUrl = 'http://127.0.0.1:5000/openAI/say';
  const respond = await openAI_api(apiUrl, dataToSend);
  const result = JSON.parse(respond);
  
  console.log(result);
  res.send(result.ok);
});

app.post('/openAI/img', async(req, res) => {
  const { userId, foodImage } = req.body;
  foodimage = foodImage;
  
  if (!userId || !foodImage) {
    return res.status(400).json({ error: 'Invalid input data' });
  }
  console.log(foodImage);
  console.log(`Received image from user: ${userId}`);
  
  let userAllergies = null;
  try{
    // user 컬렉션에 접근
    const userCollection = db.collection('user');

    const userIfomation = await userCollection.findOne({ userId: userId });
    // Boolean 값이 true인 필드의 키 추출
    const trueFields = Object.keys(userIfomation).filter(key => userIfomation[key] === true);

    userAllergies = trueFields.join(" "); // 결과 출력
  } catch(error) {
    console.error("Error fetching user information:", error);
  }
  const dataToSend = {
    allergy : userAllergies,
    imgB64 : foodimage,
  }
  console.log(dataToSend);
  const apiUrl = 'http://127.0.0.1:5000/openAI/img';
  const respond = await openAI_api(apiUrl, dataToSend);
  const result = JSON.parse(respond);
  console.log(result);
  res.json(result);
  
});