const express = require("express");
const initialiseFms = express.Router();
var MongoClient = require('mongodb').MongoClient;
const axios = require('axios');

initialiseFms.post('/fmsStep1' , (req, res) => {
    console.log("inside fms step1")
    console.log(req.body.fmsName)

    //based on the token get the username and company name
    console.log(req.headers.token)
    let userName = ""
    let userID = ""
    let companyUrl = ""
    let userEmail = ""
    axios.post(process.env.MAIN_BE_URL, {token : req.headers.token})
    .then(response => {
      console.log('Data posted successfully:', response.data);
      userName = response.data.emp_name
      userID = response.data.user_id
      companyUrl = response.data.verify_company_url
      userEmail = response.data.email_id
      //res.send(response.data); // Return the response data
    })
    .catch(error => {
      console.error('Error posting data:', error);
      //res.send(error); // Rethrow the error to be handled by the caller
    });

    MongoClient.connect(process.env.MONGO_DB_STRING)
    .then(async client => {
        console.log('Connected to database')
        const db = client.db(companyUrl)
        const collection = db.collection('fmsMaster')
        
        // Find the last inserted document and get its incremental value
        const lastDocument = await collection.find().sort({ _id: -1 }).limit(1).toArray();
        let fmsMasterId = 1;

        if (lastDocument.length > 0) {
            fmsMasterId = lastDocument[0].fmsMasterId + 1;
        }

        // Inserting data into the collection
        const result = await collection.insertOne({
            fmsMasterId,
            fmsCreatedBy : {userID : userID , userEmail: userEmail , userName : userName},
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

//Edit FMS -- ADD FMS Access, No Edit Access For Now
initialiseFms.post('/addFmsUserAccess' , (req, res) => {

    //based on the token get the username and company name
    console.log(req.headers.token)
    let userName = ""
    let userID = ""
    let companyUrl = ""
    let userEmail = ""
    axios.post(process.env.MAIN_BE_URL, {token : req.headers.token})
    .then(response => {
      console.log('Data posted successfully:', response.data);
      userName = response.data.emp_name
      userID = response.data.user_id
      companyUrl = response.data.verify_company_url
      userEmail = response.data.email_id
      //res.send(response.data); // Return the response data
    })
    .catch(error => {
      console.error('Error posting data:', error);
      //res.send(error); // Rethrow the error to be handled by the caller
    });

        MongoClient.connect(process.env.MONGO_DB_STRING)
        .then(async client => {
            
            const db = client.db(companyUrl)
            const collection = db.collection('fmsMaster') 
    
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

////////////// ---------------------- Create Questionare ----------------------////////////////////

//file upload, text(string) , dropdown(array of strings) , checkboxes(array of strings) , date (single date)

initialiseFms.post('/createFmsQuestionare' , (req, res) => {
    //based on the token get the username and company name
    console.log(req.headers.token)
    let userName = ""
    let userID = ""
    let companyUrl = ""
    let userEmail = ""
    axios.post(process.env.MAIN_BE_URL, {token : req.headers.token})
    .then(response => {
      console.log('Data posted successfully:', response.data);
      userName = response.data.emp_name
      userID = response.data.user_id
      companyUrl = response.data.verify_company_url
      userEmail = response.data.email_id
      //res.send(response.data); // Return the response data
    })
    .catch(error => {
      console.error('Error posting data:', error);
      //res.send(error); // Rethrow the error to be handled by the caller
    });

    MongoClient.connect(process.env.MONGO_DB_STRING)
    .then(async client => {
        
        const db = client.db(companyUrl)
        const collection = db.collection('fmsMaster') 

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

//CREATE FMS Steps
initialiseFms.post('/createFmsSteps' , (req, res) => {

    //based on the token get the username and company name
    console.log(req.headers.token)
    let userName = ""
    let userID = ""
    let companyUrl = ""
    let userEmail = ""
    axios.post(process.env.MAIN_BE_URL, {token : req.headers.token})
    .then(response => {
      console.log('Data posted successfully:', response.data);
      userName = response.data.emp_name
      userID = response.data.user_id
      companyUrl = response.data.verify_company_url
      userEmail = response.data.email_id
      //res.send(response.data); // Return the response data
    })
    .catch(error => {
      console.error('Error posting data:', error);
      //res.send(error); // Rethrow the error to be handled by the caller
    });
    
    MongoClient.connect(process.env.MONGO_DB_STRING)
    .then(async client => {
        
        const db = client.db(companyUrl)
        const collection = db.collection('fmsMaster') 

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

//edit FMS option
initialiseFms.post('/editFmsLive' , (req, res) => {

    //based on the token get the username and company name
    console.log(req.headers.token)
    let userName = ""
    let userID = ""
    let companyUrl = ""
    let userEmail = ""
    axios.post(process.env.MAIN_BE_URL, {token : req.headers.token})
    .then(response => {
      console.log('Data posted successfully:', response.data);
      userName = response.data.emp_name
      userID = response.data.user_id
      companyUrl = response.data.verify_company_url
      userEmail = response.data.email_id
      //res.send(response.data); // Return the response data
    })
    .catch(error => {
      console.error('Error posting data:', error);
      //res.send(error); // Rethrow the error to be handled by the caller
    });
    
    MongoClient.connect(process.env.MONGO_DB_STRING)
    .then(async client => {
        
        const db = client.db(companyUrl)
        const collection = db.collection('fmsMaster') 

        const filter = { fmsName : req.body.fmsName };
    const update = { $set: { fmsLive : req.body.fmsLive } };
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
        "message" : `${req.body.fmsName} Fms is made ${req.body.fmsLive} successfully `,
        "status" : 200
    })
})
    .catch(error => {
        console.error('Error Connecting to MongoDB' , error)
        res.json({
            "message" : `${req.body.fmsName} Fms is NOT made ${req.body.fmsLive} successfully`,
            "status" : 500
        })
    })
})



module.exports = initialiseFms;
