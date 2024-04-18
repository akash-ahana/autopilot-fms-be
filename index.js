var express = require('express');
const cors = require('cors');
var MongoClient = require('mongodb').MongoClient;
require('dotenv').config();
var app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Use CORS middleware
app.use(cors());

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
const aws = require("./routes/s3Functions/awsS3functions");
app.use("/awsS3", aws);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var server = app.listen(process.env.PORT, function () {
   console.log(`Express App running on PORT ${process.env.PORT}`);
})