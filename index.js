var express = require('express');
const cors = require('cors');
var MongoClient = require('mongodb').MongoClient;
require('dotenv').config();
var app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Use CORS middleware
app.use(cors());

//Checking to see for deployment test
app.get('/hello', function (req, res) {
   res.send('Hello World');
})

//API to see for MongoDB Connection
app.get('/helloMongo', function (req, res) {
  MongoClient.connect(process.env.MONGO_DB_STRING)
  .then(async client => {
      console.log('Connected to MongoDB')
      res.send('Connected to MongoDB ')
      //const db = client.db('testDb')
      //const collection = db.collection('testCollection') 

  })
  .catch(error=> {
    console.error('Error Connecting to MongoDB' , error)
    res.send('Error Connecting to MongoDB' , error)
  })
})      

//Checking to see for MongoDB Connection on Node Startup
MongoClient.connect(process.env.MONGO_DB_STRING)
.then(async client => {
  console.log('Connected to MongoDB')
  //const db = client.db('testDb')
  //const collection = db.collection('testCollection') 
})
.catch(error=> {
console.error('Error Connecting to MongoDB' , error)
})    
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



//--GET FMS------------------------------------------------------------//
const getFms = require("./routes/getFms/getFms");
app.use("/getFms", getFms);


//--FMS INITIALISATION--------------------------------------------------//
const fmsInitilisation = require("./routes/initializeFms/initialiseFms");
app.use("/fmsInitilisation", fmsInitilisation);


//--AWS S3-------------------------------------------------------------//
const aws = require("./routes/s3Functions/awsS3functions");
app.use("/awsS3", aws);
//--------------------------------------------------------------------//


var server = app.listen(process.env.PORT, function () {
   console.log(`Express App running on PORT ${process.env.PORT}`);
})