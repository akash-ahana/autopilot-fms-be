var express = require('express');
var MongoClient = require('mongodb').MongoClient;
require('dotenv').config();
var app = express();

// Middleware to parse JSON bodies
app.use(express.json());

app.get('/hello', function (req, res) {
   res.send('Hello World');
})
// Database Name
const dbName = 'testDb';
const collection = 'testCollection'

// Data to be inserted
const dataToInsert =  { name: 'John Doe', age: 30, email: 'john@example.com' };



    /////////////////////////
    MongoClient.connect(process.env.MONGO_DB_STRING)
    .then(async client => {
        console.log('Connected to database')
        const db = client.db('testDb')
        const collection = db.collection('testCollection') 

        // Inserting data into the collection
        //const result = await collection.insertOne(dataToInsert);

        //console.log(result)
    })
    .catch(error=> console.error('Error Connecting to MongoDB' , error))

///////////////////////////////////////////////////////////////////////////////////////////////


//find  Single FMS using FMS Name
app.post('/findSingleFms' , (req, res) => {
    //request the name of the FMS
    let fmsName = req.body.fmsName;

    MongoClient.connect(process.env.MONGO_DB_STRING)
    .then(async client => {
        console.log('Connected to database')
        const db = client.db('fmsDb')
        const collection = db.collection('fmsCollection') 

        // Fething data into from the  collection
        const query = { fmsName: req.body.fmsName };
        const document = await collection.findOne(query);

        console.log(document)
        res.json({
            "message" : document,
            "status" : 200
        })
    })
    .catch(error => {
        console.error('Error Connecting to MongoDB' , error)
        res.json({
            "message" : `${req.body.fmsName} Coul Not Find FMS`,
            "status" : 500
        })
    })

})

//find ALL FMS 
app.get('/findAllFms' , (req, res) => {
    //request the name of the FMS
    let fmsName = req.body.fmsName;

    MongoClient.connect(process.env.MONGO_DB_STRING)
    .then(async client => {
        console.log('Connected to database')
        const db = client.db('fmsDb')
        const collection = db.collection('fmsCollection') 

        const cursor = collection.find();
        const documents = await cursor.toArray();

        console.log(documents)
        res.json({
            "message" : [documents],
            "status" : 200
        })
    })
    .catch(error => {
        console.error('Error Connecting to MongoDB' , error)
        res.json({
            "message" : `${req.body.fmsName} Coul Not Find FMS`,
            "status" : 500
        })
    })

})

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.post('/fmsStep1' , (req, res) => {

    MongoClient.connect(process.env.MONGO_DB_STRING)
    .then(async client => {
        console.log('Connected to database')
        const db = client.db('fmsDb')
        const collection = db.collection('fmsCollection') 

        // Inserting data into the collection
        const result = await collection.insertOne({
            fmsName : req.body.fmsName,
            fmsDescription : req.body.fmsDescription,
            fmsProcess : req.body.fmsProcess
        });

        console.log(result)
        res.json({
            "message" : `${req.body.fmsName} Step 1 is Successfully Created`,
            "status" : 200
        })
    })
    .catch(error => {
        console.error('Error Connecting to MongoDB' , error)
        res.json({
            "message" : `${req.body.fmsName} Step 1 is NOT Created`,
            "status" : 500
        })
    })


})

////////////////////////////////////////////////////////////////////////////////////////////
//Edit FMS -- ADD FMS Access, No Edit Access For Now
app.post('/addFmsUserAccess' , (req, res) => {
//dISCUSS WEATHER I NEED TO STORE id's or names
    MongoClient.connect(process.env.MONGO_DB_STRING)
    .then(async client => {
        
        const db = client.db('fmsDb')
        const collection = db.collection('fmsCollection') 

        const filter = { fmsName : req.body.fmsName };
        const update = { $set: { fmsAccess : req.body.fmsUsers } };
        const options = { upsert: true };
        
        const result = await collection.updateOne(filter, update, options);
        
        if (result.upsertedCount === 1) {
          console.log('Document inserted');
        } else if (result.modifiedCount === 1) {
          console.log('Document updated');
        } else {
          console.log('No changes made to the document');
        }

        console.log(result)
        res.json({
            "message" : `${req.body.fmsName} FMS Users is Successfully Added`,
            "status" : 200
        })
    })
    .catch(error => {
        console.error('Error Connecting to MongoDB' , error)
        res.json({
            "message" : `${req.body.fmsName} FMS Users is Successfully Added`,
            "status" : 500
        })
    })


})

//////////////////////////////////////////////////////////////////////////////////////////////////
////////////// ---------------------- Create Questionare ----------------------////////////////////

//file upload, text(string) , dropdown(array of strings) , checkboxes(array of strings) , date (single date)

app.post('/createFmsQuestionare' , (req, res) => {
    
        MongoClient.connect(process.env.MONGO_DB_STRING)
        .then(async client => {
            
            const db = client.db('fmsDb')
            const collection = db.collection('fmsCollection') 
    
            const filter = { fmsName : req.body.fmsName };
        const update = { $set: { fmsQuestionare : req.body.fmsQuestionare } };
        const options = { upsert: true };
        
        const result = await collection.updateOne(filter, update, options);
        
        if (result.upsertedCount === 1) {
          console.log('Document inserted');
        } else if (result.modifiedCount === 1) {
          console.log('Document updated');
        } else {
          console.log('No changes made to the document');
        }

        console.log(result)
        res.json({
            "message" : `${req.body.fmsName} FMS Questionare is Successfully Added`,
            "status" : 200
        })
    })
        .catch(error => {
            console.error('Error Connecting to MongoDB' , error)
            res.json({
                "message" : `${req.body.fmsName} FMS Questionare is Not Added`,
                "status" : 500
            })
        })
    })

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////-------------------Create Steps-------------------------------//////////////////////////

app.post('/createFmsSteps' , (req, res) => {
    
    MongoClient.connect(process.env.MONGO_DB_STRING)
    .then(async client => {
        
        const db = client.db('fmsDb')
        const collection = db.collection('fmsCollection') 

        const filter = { fmsName : req.body.fmsName };
    const update = { $set: { fmsSteps : req.body.fmsSteps } };
    const options = { upsert: true };
    
    const result = await collection.updateOne(filter, update, options);
    
    if (result.upsertedCount === 1) {
      console.log('Document inserted');
    } else if (result.modifiedCount === 1) {
      console.log('Document updated');
    } else {
      console.log('No changes made to the document');
    }

    console.log(result)
    res.json({
        "message" : `${req.body.fmsName} FMS Steps is Successfully Added`,
        "status" : 200
    })
})
    .catch(error => {
        console.error('Error Connecting to MongoDB' , error)
        res.json({
            "message" : `${req.body.fmsName} FMS Steps is Not  Added`,
            "status" : 500
        })
    })
})



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////----------------AWS S3 -------------------------------------------------------------///////////////////////
const AWS = require('aws-sdk');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Configure Multer for file upload
const upload = multer({ dest: 'uploads/' }); // Temporary storage

app.post('/uploadToS3' , upload.single('file') , (req, res) => {

    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
    
      // Read the file from disk
      const fileContent = fs.readFileSync(req.file.path);
    

    // Set the AWS credentials and region
AWS.config.update({
    accessKeyId: 'AKIAU6GDYAJNRFVBXRGM',
    secretAccessKey: 'nGDcPRkW/dG636RLMGflIjtFVzJnovEAm1VOiu9L',
    region: 'ap-south-1' // e.g., 'us-east-1'
  });
  
  // Create S3 service object
  const s3 = new AWS.S3();
  
  // Define the parameters for the upload
  const uploadParams = {
    //Bucket: 'bci-autopilot-qa-bucket',
    Bucket: 'bci-lms-uat-s3-student-portal',
    //Key: 'autopilot-folder/File-Storage.jpeg', // File name in the bucket
    Key: `uploads/${Date.now()}_${req.file.originalname}`,
    //Body: fs.createReadStream('./File-Storage.jpeg'),
    Body: fileContent
    //ACL: 'public-read' // Optionally, set the ACL to make the file publicly accessible
  };
  
  // Upload the file to the S3 bucket
  s3.upload(uploadParams, (err, data) => {
    if (err) {
      console.error("Upload error:", err);
      return res.status(500).json({ message: 'Error uploading file' });
    } else {
        // Delete the temporary file
    fs.unlinkSync(req.file.path);
      console.log("Upload successful:", data.Location);
      // Return the S3 link to the uploaded file
    res.json({ link: data.Location });
    }
  });
})

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var server = app.listen(process.env.PORT, function () {
   console.log(`Express App running on PORT ${process.env.PORT}`);
})