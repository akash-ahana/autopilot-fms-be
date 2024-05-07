const express = require("express");
const submitFmsQuestionare = express.Router();
var MongoClient = require('mongodb').MongoClient;
const axios = require('axios');







submitFmsQuestionare.post('/submitFmsUserQAcreateTaskStep1' , async (req, res) => {
    console.log("inside fms fmsUserQA create task for step 1")
    console.log(req.body.fmsName)

    console.log(req.body.fmsName);

    // Initialize variables to hold user details
    let userName = "";
    let userID = "";
    let companyUrl = "";
    let userEmail = "";

    console.log(req.headers.authorization)
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer")) {
        console.log("error: Authorization header missing or malformed");
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const token = authHeader.split(" ")[1];

      console.log('token fetched is ' , token)

    try {
        // Fetch user details and company details based on the token
        const response = await axios.post(process.env.MAIN_BE_URL, { token: token });
        console.log('Fetched User Details and Company Details', response.data);
        userName = response.data.emp_name;
        userID = response.data.user_id;
        companyUrl = response.data.verify_company_url;
        userEmail = response.data.email_id;
    } catch (error) {
        console.error('Error posting data:', error);
        res.status(500).send({ message: 'Error fetching user details', status: 500 });
        return;
    }


    ///////////////////////////////////////////try catch block to submit QA
    let fmsQAId;
    try {

        // Connect to MongoDB and perform operations
        const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
        console.log('Connected to database');
        const db = client.db(companyUrl);
        const collection = db.collection('fms');

        // Find the last inserted document and get its incremental value
        const lastDocument = await collection.find().sort({ _id: -1 }).limit(1).toArray();
        fmsQAId = 1;

        if (lastDocument.length > 0) {
            fmsQAId = lastDocument[0].fmsQAId + 1;
        }

        // Inserting data into the collection
        const result = await collection.insertOne({
            fmsQAId,
            fmsQACreatedBy: { userID: userID, userEmail: userEmail, userName: userName },
            fmsMasterID : req.body.fmsMasterID,
            fmsName: req.body.fmsName,
            fmsQA: req.body.fmsQA,
            
        });

        console.log(result);
        console.log('Submitted the QA');
        // res.json({
        //     "message": `${req.body.fmsName} Step 1 is Successfully Created`,
        //     "status": 200
        // });

        // Close the MongoDB connection
        await client.close();
        console.log('MongoDB connection closed');

    } catch (error) {
        console.error('Error posting data:', error);
        res.status(500).send({ message: 'Error Submitting QA', status: 500 });
        return;
    }

    //////////////////////////////////try catch block to find the user required 
    let employee;
    let processId;
    let plannedDate;
    let what;
    let how;
    let stepId;
    let stepType;
    let r;
    let durationType;
    try {
        console.log('inside try block for fetching doer for step 1 from fmsMaster')
        // Connect to MongoDB and perform operations
        const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
        console.log('Connected to database');
        const db = client.db(companyUrl);
        const collection = db.collection('fmsMaster');

        // Find documents where fmsMasterId matches the given ID
    //const documents = await collection.find({ fmsMasterId }).toArray();

    const cursor = collection.find({fmsMasterId : req.body.fmsMasterID});
    const documents = await cursor.toArray();

    
    // Check if documents were found
    if (!documents.length) {
      console.log('No documents found with the given fmsMasterId.');
      return;
    }

    // Extract the first document
    const document = documents[0];

    // Find the first object in the "who" array where "typeOfShift" is "All"
    const whoObject = document.fmsSteps.find(step => step.who.typeOfShift === 'All');

    // Check if the "who" object was found
    if (!whoObject) {
      console.log('No "who" object found with typeOfShift "All".');
      return;
    }

    // Extract the first employee's information from the "employees" array
    employee = whoObject.who.employees[0];
    processId = document.fmsProcess
    plannedDate = document.fmsSteps[0].plannedDate
    what = document.fmsSteps[0].what
    how = document.fmsSteps[0].how
    stepId = document.fmsSteps[0].id
    stepType = document.fmsSteps[0].stepType
    timeHrs = document.fmsSteps[0].plannedDate.duration
    console.log(`Process ID: ${document.fmsProcess}`);

    // Log the employee information
    console.log(employee);
        // Close the MongoDB connection
        await client.close();
        console.log('MongoDB connection closed');

    } catch (error) {
        console.error('Error posting data:', error);
        res.status(500).send({ message: 'Error Submitting QA', status: 500 });
        return;
    }

    

    /////////////////////////////////////creating the task for the user in fmsTasks collection
    try {

        //calculation of fmsTaskPlannedCompletionTime (start time - form submitted time, and tat in hrs or days)

        // Connect to MongoDB and perform operations
        const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
        console.log('Connected to database');
        const db = client.db(companyUrl);
        const collection = db.collection('fmsTasks');

        // Find the last inserted document and get its incremental value
        const lastDocument = await collection.find().sort({ _id: -1 }).limit(1).toArray();
        let fmsTaskId = 1;

        if (lastDocument.length > 0) {
            fmsTaskId = lastDocument[0].fmsTaskId + 1;
        }

        // Inserting data into the collection
        const result = await collection.insertOne({
            fmsTaskId,
            fmsQAId,
            fmsQACreatedBy: { userID: userID, userEmail: userEmail, userName: userName },
            fmsMasterID : req.body.fmsMasterID,
            fmsName: req.body.fmsName,
            fmsQA: req.body.fmsQA,
            fmsTaskDoer : employee,
            fmsTaskStatus : "PENDING",
            fmsProcessID : processId,
            plannedDate : plannedDate,
            what : what,
            how: how,
            stepId : stepId,
            stepType : stepType,
            fmsTaskCreatedTime : new Date(),
            fmsTaskPlannedCompletionTime : new Date(new Date().setHours(new Date().getHours() + Number(timeHrs.trim())))
            
            
        });

        console.log(result);
        console.log('Created the Task');
        // res.json({
        //     "message": `${req.body.fmsName} Step 1 is Successfully Created`,
        //     "status": 200
        // });

        // Close the MongoDB connection
        await client.close();
        console.log('MongoDB connection closed');

    } catch (error) {
        console.error('Error posting data:', error);
        res.status(500).send({ message: 'Error Submitting QA', status: 500 });
        return;
    }

    res.json({
            "message": `FMS form is submitted and Step 1 task is Createed`,
            "status": 200
        });

})

module.exports = submitFmsQuestionare;