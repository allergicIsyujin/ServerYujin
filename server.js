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
let Result=0;
const api_IP = "127.0.0.1:5000";

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
app.post('/base64', async (req, res) => {
  const { userid, food } = req.body;
  foodimage=food;
  // db.collection('image').insertOne({userId:userid,food:food})
  if (!userid || !food) {
    return res.status(400).json({ error: 'Invalid input data' });
  }
  console.log(food)
  console.log(`Received image from user: ${userid}`);
 // openAI_IMG(userid)로 이미지를 처리하는 부분을 여기에 구현하세요.
//  const imageProcessingResult = openAI_IMG(userid); // 예시: 이미지 처리 함수 호출
  await openAI_IMG(userid);
 await console.log(Result);
 await res.json({
   result: Result// 이미지 처리 결과를 포함시킬 수도 있습니다.
 });
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
    console.error('Fetch error:', error)
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

  const apiUrl = `http://${api_IP}/openAI/say`;
  const respond = await openAI_api(apiUrl, dataToSend);
  const result = JSON.parse(respond);
  console.log(result);
  res.send(result.ok);
});

async function openAI_IMG(userId) {
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
  const apiUrl = `http://${api_IP}/openAI/img`;
  const respond = await openAI_api(apiUrl, dataToSend);
  const result = JSON.parse(respond);
  console.log(result);
  Result=result;
};

// 아이디 중복 확인 엔드포인트
app.get('/saveImage', async (req, res) => {
  const userId = req.query.userId;
  let image=await db.collection('image').insertOne({userId:userId,food:foodimage})
  console.log(image.insertedId);
  db.collection('record').insertOne({_id:image.insertedId,ok:Result.ok,foodName:Result.foodName,ingredient:Result.ingredients,notIngredients:Result.notIngredients})
  await res.json({
    message: "success"// 이미지 처리 결과를 포함시킬 수도 있습니다.
  });
});

app.post('/save/allergy', async(req, res) => {
  const { userId, food } = req.body;
  try{
    const userCollection = db.collection('user');

    let userInformation = await userCollection.findOne({ userId: userId });
    const filter = { _id: userInformation._id  };
    // 아이디가 같은 문서 추출
    let documentKeys = Object.keys(userInformation);
    for (const value of food) {
      console.log(value);
      if(!(userInformation.hasOwnProperty(value))){
        console.log('이놈이다');
        const updateDoc = {
          $set: {
            [value] : false // 추가할 필드와 값
          }
        };
        const result = await userCollection.updateOne(filter, updateDoc);
        console.log(result.matchedCount);
      }
    }
    userInformation = await userCollection.findOne({ userId: userId });
    documentKeys = Object.keys(userInformation);
    const filteredList = food.filter(value => documentKeys.includes(value));

    const updateFields = {};
    // 반전된 값을 오브젝트 형식으로 넣어주기
    for (const value of filteredList) {
      updateFields[value] = !userInformation[value];
    };

    console.log(updateFields);
    // 업데이트 해주기
    await userCollection.updateOne(
      { userId: userId },
      { $set: updateFields }
    );
    res.send('알러지를 수정하였습니다.');
  } catch(error) {
    console.error("Error fetching user information:", error);
  }
});

app.post('/myAllergy', async(req, res) => {
  const { userId } = req.body;
  try{
    const userCollection = db.collection('user');
    let userInformation = await userCollection.findOne({ userId: userId });
    // Boolean 값이 true인 필드의 키 추출
    const trueFields = Object.keys(userInformation).filter(key => userInformation[key] === true);
    res.send(trueFields);
  } catch(error) {
    console.error("Error fetching user information:", error);
  }
});

app.get('/newAllergy', async(req,res) => {
  const userId = req.query.userId;
  try{
    const newAllergies = [];
    const fields = ['_id', 'userId', 'userPs', '계란', '밀가루', '우유', '닭고기', '돼지고기', '견과류', '새우', '해산물', '생선', '포도', '바나나', '사과'];
    const userCollection = db.collection('user');
    let userInformation = await userCollection.findOne({ userId: userId });
    let documentKeys = Object.keys(userInformation);
    documentKeys.forEach(allergy => {
      const find = fields.find(item => item === allergy);
      if(find === undefined)
        newAllergies.push(allergy);
    });
    res.send(newAllergies);
  } catch(error) {
    console.error("Error : ",error);
  }
})

app.get('/foodRecord',async (req,res)=>{
  let userId=req.query.userid;
  const cursor= await db.collection('image').find({userId:userId})
  const documents = await cursor.toArray();
  let responseArray = [];
  for (let i = 0; i < documents.length; i++) {
    let pussy=0;
    pussy=await db.collection('record').findOne({_id:documents[i]._id});
    responseArray.push({foodName:pussy.foodName,backgroundColor:pussy.ok==='O'?1:0,image:documents[i].food,description:pussy.ingredient});
  }
  console.log(responseArray)
  res.json(responseArray)
})

// app.get('/foodRecord', async (req, res) => {
//   const userId = req.query.userId;
//   let user = await db.collection('user').findOne({ userId: userId });
//   if (user) {
//     res.json({ message: "아이디가 중복입니다." });
//   } else {
//     res.json({ message: "아이디 사용가능합니다." });
//   }
// });
// const foodData = [
//   {
//     foodName: "김치찌개",
//     backgroundColor: true,
//     image: "https://example.com/images/kimchi-jjigae.jpg",
//     description: "매운 김치찌개"
//   },
//   {
//     foodName: "불고기",
//     backgroundColor: false,
//     image: "https://example.com/images/bulgogi.jpg",
//     description: "달콤한 불고기"
//   }
// ];
app.get('/saveImage', async (req, res) => {
  const userId = req.query.userId;
  let image=await db.collection('image').insertOne({userId:userId,food:foodimage})
  db.collection('record').insertOne({_id:ObjectId(image._id),ok:Result.ok,foodName:Result.foodName,ingredient:Result.ingredients,notIngredients:Result.notIngredients})
  await res.json({
    message: "success"// 이미지 처리 결과를 포함시킬 수도 있습니다.
  });
});
