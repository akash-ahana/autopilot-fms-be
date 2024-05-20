const express = require("express");
const updateFmsTask = express.Router();
var MongoClient = require('mongodb').MongoClient;
const axios = require('axios');
const { CurrentIST } = require('../helpers/convertGMTtoIST');

//update fms tasks 
//first it updates the task that is send 
//fetch the next task , 
//create a task for that user
updateFmsTask.post('/updateFmsTask' , async (req, res) => {
    console.log("inside UPDATE FMS TASK")
    //console.log(req.body)
    

    // Initialize variables to hold user details
    let userName = "";
    let userID = "";
    let companyUrl = "";
    let userEmail = "";

    //console.log(req.headers.authorization)
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer")) {
        //console.log("error: Authorization header missing or malformed");
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const token = authHeader.split(" ")[1];

      //console.log('token fetched is ' , token)

    try {
        // Fetch user details and company details based on the token
        const response = await axios.post(process.env.MAIN_BE_URL, { token: token });
        //console.log('Fetched User Details and Company Details', response.data);
        userName = response.data.emp_name;
        userID = response.data.user_id;
        companyUrl = response.data.verify_company_url;
        userEmail = response.data.email_id;
    } catch (error) {
        //console.error('Error posting data:', error);
        res.status(500).send({ message: 'Error fetching user details', status: 500 });
        return;
    }

    //console.log('FETCHED DETAILS FROM BEARER TOKEN')
    //try block to update the task
    try {
        // Connect to MongoDB and perform operations
        const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
        console.log('Connected to database');
        const db = client.db(companyUrl);
        const collection = db.collection('fmsTasks');

        // Filter document to find the document to update
        const filter = { fmsTaskId: req.body.fmsTaskId };

        //Update document with new values
        //const update = { $set: { fmsTaskStatus: "COMPLETED" } };

        const update = {
            $set: {
              fmsTaskStatus: "COMPLETED",
              formStepsAnswers: req.body.formStepsAnswers,
              fmsTaskQualityDetails : req.body.fmsTaskQualityDetails
            },
            $currentDate: { at: true }
          };
        

        //Perform the update operation
        const result = await collection.updateOne(filter, update);

        console.log(result);
       

        // Close the MongoDB connection
        await client.close();
        console.log('MongoDB connection closed');

    } catch (error) {
        console.error('Error posting data:', error);
        res.status(500).send({ message: 'Error Submitting QA', status: 500 });
        return;
    }
    console.log('updated the task')

     //try block to fetch the next task
     let nextTask;
     let employee;
     let processId;
    let plannedDate;
    let what;
    let how;
    let stepId;
    let stepType;
    try {
        // Connect to MongoDB and perform operations
        const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
        console.log('Connected to database');
        const db = client.db(companyUrl);
        const collection = db.collection('fmsMaster');

        const cursor = collection.find({ fmsMasterId: req.body.fmsMasterID });
        const documents = await cursor.toArray();

        // Extract the first document
        const document = documents[0];
        console.log(document)

        // Find the first object in the "who" array where "typeOfShift" is "All"
        const whoObject = document.fmsSteps.find(step => step.who.typeOfShift === 'All');

        // Check if the "who" object was found
        if (!whoObject) {
        console.log('No "who" object found with typeOfShift "All".');
        return;
        }


        //documents[0].fmsSteps
        // nextTask = document.fmsSteps[1 - req.body.stepId]
        // // Extract the first employee's information from the "employees" array
        // employee = whoObject.who.employees[0];
        // processId = document.fmsProcess
        // plannedDate = document.fmsSteps[1 - req.body.stepId].plannedDate
        // what = document.fmsSteps[1 - req.body.stepId].what
        // how = document.fmsSteps[1 - req.body.stepId].how
        // stepId = document.fmsSteps[1 - req.body.stepId].id
        // stepType = document.fmsSteps[1 - req.body.stepId].stepType
        timeHrs = document.fmsSteps[req.body.stepId].plannedDate.duration
        console.log('Next task is ' , document.fmsSteps[req.body.stepId])

        nextTask = document.fmsSteps[req.body.stepId]
        // Extract the first employee's information from the "employees" array
        //employee = whoObject.who.employees[0];
        employee = document.fmsSteps[req.body.stepId].who.employees[0];
        processId = document.fmsProcess
        plannedDate = document.fmsSteps[req.body.stepId].plannedDate
        what = document.fmsSteps[req.body.stepId].what
        how = document.fmsSteps[req.body.stepId].how
        stepId = document.fmsSteps[req.body.stepId].id
        stepType = document.fmsSteps[req.body.stepId].stepType
        timeHrs = document.fmsSteps[req.body.stepId].plannedDate.duration

        


        // Close the MongoDB connection
        await client.close();
        console.log('MongoDB connection closed');

    } catch (error) {
        console.error('Error posting data:', error);
        res.status(500).send({ message: 'Error Submitting Fms Task ', status: 500 });
        return;
    }


    //TRIGGER NEXT TASK IF THE STEP TYPE IS DOER
    // if(nextTask.stepType == "DOER") {
        //try catch block to create bext Task
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
                fmsQAId : req.body.fmsQAId,
                fmsMasterId : req.body.fmsMasterID,
                fmsName: req.body.fmsName,
                fmsQA: req.body.fmsQA,
                formStepsQustions : req.body.formStepsQustions,
                fmsTaskDoer : employee,
                fmsTaskStatus : "PENDING",
                fmsTaskCompletedStatus : "null",  //either ONTIME OR DELAYED
                fmsProcessID : processId,
                plannedDate : plannedDate,
                what : what,
                how: how,
                stepId : stepId,
                stepType : stepType,
                fmsTaskCreatedTime : CurrentIST(),
                fmsTaskPlannedCompletionTime : new Date(new Date().setHours(new Date().getHours() + Number(timeHrs.trim()))),
                formStepsAnswers: null,
                fmsTaskQualityDetails : null,
                isTransferredFrom: false,    //is this task transferred FROM other Doer
                isTranferredTo: false,       //is this task transferred TO other Doer
                transferredFromTaskId : null, 
                transferredToTaskId : null
                
            });
    
            console.log(result);
            console.log('Created the Task');
            
    
            // Close the MongoDB connection
            await client.close();
            console.log('MongoDB connection closed');
    
        } catch (error) {
            console.error('Error posting data:', error);
            res.status(500).send({ message: 'Error Submitting QA', status: 500 });
            return;
        }

   // }

   res.json({
    "message": `Task Updated`,
    "status": 200
});
})

module.exports = updateFmsTask;