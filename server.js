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


let db;
const url = mongoURI;

new MongoClient(url).connect().then((client) => {
  console.log('DB연결성공');
  db = client.db('forum');
}).catch((err) => {
  console.log(err);
});

app.listen(port, () => {
  console.log(`http://localhost:${port} 에서 서버 실행중`);
});



app.get('/', (req, res) => {
  res.render('index.ejs', { title: 'EJS with Node.js' });
});



