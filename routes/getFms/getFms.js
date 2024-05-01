const express = require("express");
const getFms = express.Router();
var MongoClient = require('mongodb').MongoClient;

//find  Single FMS using FMS Name
getFms.post('/findSingleFms' , (req, res) => {
    
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
            "message" : `${req.body.fmsName} Could Not Find FMS`,
            "status" : 500
        })
    })

})

//find ALL FMS 
getFms.get('/findAllFms' , (req, res) => {
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
            "message" : `${req.body.fmsName} Could Not Find FMS`,
            "status" : 500
        })
    })

})

//find all fms and their forms the user has access to 
getFms.post('/findFmsQuestionaresForUser' , (req, res) => {
    //request the name of the FMS
    //let fmsName = req.body.fmsName;

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

        
        // Fething data into from the  collection
        const query = { fmsAccess : { $in: [req.body.fmsUser] } };
        //const document = await collection.findOne(query);
        const cursor = collection.find(query);
        const documents = await cursor.toArray();

        console.log(documents)
        res.json({
            "message" : documents,
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

//Get All DATES from fms questionare
getFms.post('/getAllFmsDates' , (req, res) => {

    
    
   let fmsName = req.body.fmsName;

   MongoClient.connect(process.env.MONGO_DB_STRING)
   .then(async client => {
       console.log('Connected to database')
       const db = client.db('fmsDb')
       const collection = db.collection('fmsCollection') 

       
       // Fething data into from the  collection
       //const query = { fmsName: req.body.fmsName };

       // Projection to include only the first name in the result
        //const projection = { "fmsQuestionare.question": 1, _id: 0 };
       //const document = await collection.findOne(query);
       //const cursor = collection.findOne(query);
       const document = await collection.findOne({ "fmsName": fmsName });

       if (!document) {
        return res.status(404).send('No document found with the provided fmsName');
        }

    const dateQuestions = document.fmsQuestionare.filter(question => question.answerType === "DATE");

    //res.json(dateQuestions);

       console.log(document)
       res.json({
           "message" : dateQuestions,
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

module.exports = getFms;