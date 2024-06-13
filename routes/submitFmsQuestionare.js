const express = require("express");
const submitFmsQuestionare = express.Router();
var MongoClient = require('mongodb').MongoClient;
const axios = require('axios');
//const moment = require('moment-timezone');
const { CurrentIST, addHrs, addDays, addDaysToADate, formatDateFromDateObjectToString, getCurrentDateInIST } = require('../helpers/convertGMTtoIST');
const moment = require('moment');
const {calculateFmsPlannedComplitionTime} = require("../helpers/calculateFmsPlannedComplitionTime")

submitFmsQuestionare.post('/submitFmsUserQAcreateTaskStep1', async (req, res) => {
    console.log("inside fms fmsUserQA create task for step 1")


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

    //console.log('token fetched is ', token)

    try {
        // Fetch user details and company details based on the token
        const response = await axios.post(process.env.MAIN_BE_URL, { token: token });
        //console.log('Fetched User Details and Company Details', response.data);
        userName = response.data.emp_name;
        userID = response.data.user_id;
        companyUrl = response.data.verify_company_url;
        userEmail = response.data.email_id;
    } catch (error) {
        console.error('Error posting data:', error);
        return res.status(500).send({ error: 'Error fetching user details', status: 500 });

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
            fmsMasterId: req.body.fmsMasterID,
            fmsName: req.body.fmsName,
            fmsQA: req.body.fmsQA,
            fmsQAisLive: true
        });
        console.log('Submitted the QA');
        // Close the MongoDB connection
        await client.close();
        //console.log('MongoDB connection closed');

    } catch (error) {
        console.error('Error posting data:', error);
        return res.status(500).send({ error: 'Error Submitting QA', status: 500 });

    }

    //try catch block to increment the live fms no
    try {

        // Connect to MongoDB and perform operations
        const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
        //console.log('Connected to database');
        const db = client.db(companyUrl);
        const collection = db.collection('fmsMaster');

        // Find the document and increment the noofFmsLive field
        const result = await collection.findOneAndUpdate(
            { fmsMasterId: req.body.fmsMasterID }, // Filter based on fmsMasterId
            { $inc: { noOfLive: 1 } }, // Update operation
            { returnOriginal: false } // Options (returnOriginal: false means return the modified document)
        );

        //console.log(result);

        // Close the MongoDB connection
        await client.close();
        //console.log('MongoDB connection closed');

    } catch (error) {
        console.error('Error posting data:', error);
        return res.status(500).send({ error: error.message, status: 500 });

    }

    console.log('QA is submitted and fmsMaster is also incremented')


    //////////////////////////////////try catch block to find all the detials required for Task Creation
    //try block to fetch the next task
    let shouldcreateNextTask;
    let nextTask;
    let employee;
    let processId;
    let plannedDate;
    let what;
    let how;
    let stepId;
    let stepType;
    let duration;
    let durationType;  //either hrs or days
    let working;        //this is only for hrs --> values can only be "INSIDE" or "OUTSIDE"
    let isWhatsAppEnabled;
    let whatsappData;
    let fmsSteps;
 
    try {
        console.log('inside try block for fetching doer for step 1 from fmsMaster')
        // Connect to MongoDB and perform operations
        const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
        console.log('Connected to database');
        const db = client.db(companyUrl);
        const collection = db.collection('fmsMaster');
     

        // Find documents where fmsMasterId matches the given ID
        //const documents = await collection.find({ fmsMasterId }).toArray();

        const cursor = collection.find({ fmsMasterId: req.body.fmsMasterID });
     

        const documents = await cursor.toArray();      
      


        // Check if documents were found
        if (!documents.length) {
            console.log('No documents found with the given fmsMasterId.');
            return;
        }

        // Extract the first document
        const document = documents[0];
      
        // console.log("document for fms" , document);

        // Find the first object in the "who" array where "typeOfShift" is "All"
        const whoObject = document.fmsSteps.find(step => step.who.typeOfShift === 'All');

        // Check if the "who" object was found
        if (!whoObject) {
            console.log('No "who" object found with typeOfShift "All".');
            return;
        }

        //console.log('stepId IS ' , req.body.stepId)
        console.log('no of steps in that fms', document.fmsSteps.length)
        if (document.fmsSteps.length >= 1) {
            // WE SHOULD CREATE THE NEXT TASK AS THIS IS NOT THE LAST STEP IN THE FMS
            console.log('THERE ARE OTHER STEPS')
            shouldcreateNextTask = true
        
            // Extract the first employee's information from the "employees" array
            employee = whoObject.who.employees[0];
            processId = document.fmsProcess
            plannedDate = document.fmsSteps[0].plannedDate
            what = document.fmsSteps[0].what
            how = document.fmsSteps[0].how
            stepId = document.fmsSteps[0].id
            stepType = document.fmsSteps[0].stepType   //DOER OR QUALITY
            duration = document.fmsSteps[0].plannedDate.duration
            durationType = document.fmsSteps[0].plannedDate.durationType
            //fetch working only when durationType is hrs else set it to null
            if (durationType == "hrs") {
                working = document.fmsSteps[0].plannedDate.working
            } else {
                working = null
            }
            isWhatsAppEnabled = document.fmsSteps[0].isWhatsAppEnabled
            whatsappData = document.fmsSteps[0].whatsappData
            fmsSteps = document.fmsSteps
        } else {
            //WE SHOULD NOT CREATE THE NEXT TASK AS THIS IS THE LAST STEP IN THE FMS
            shouldcreateNextTask = false
            console.log('THIS IS THE LAST STEP')
            updateAndCountDocuments(companyUrl, req.body.fmsQAId, req.body.fmsMasterId);
        }

        await client.close();
        console.log('MongoDB connection closed');

    } catch (error) {
        console.error('Error posting data:', error);
        return res.status(500).send({ error: error.message, status: 500 });
        // return;
    }

    //try catch block to create next Task
    // create nex ttask only if it is not the last step in the FMS
    console.log('Creating the next task if ', shouldcreateNextTask)
    if (shouldcreateNextTask) {
        /////////////////////////////////////creating the task for the user in fmsTasks collection
        let plannedCompletionTime;
        let plannedCompletionTimeIST
        try {
            //calculation of fmsTaskPlannedCompletionTime (start time - form submitted time, and tat in hrs or days)
            // Connect to MongoDB and perform operations
        const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
        console.log('Connected to database');
        const db = client.db(companyUrl);
        const collection = db.collection('fmsTasks');

        const fmsCollection = db.collection('fms');
        const cursorFms = fmsCollection.find({ fmsMasterId: req.body.fmsMasterID });

        const fmsdocuments = await cursorFms.toArray(); 
        const fmsdocument = fmsdocuments[0];

        // console.log("fmsdocument" , fmsdocument);

        const decisionforPlannedComplitionTime = fmsdocument.fmsQA[0];
        console.log("decisionforPlannedComplitionTime" , decisionforPlannedComplitionTime);
       
        // Find the last inserted document and get its incremental value
        const lastDocument = await collection.find().sort({ _id: -1 }).limit(1).toArray();
        let fmsTaskId = 1;

        if (lastDocument.length > 0) {
            fmsTaskId = lastDocument[0].fmsTaskId + 1;
        }

            plannedCompletionTimeIST = await calculateFmsPlannedComplitionTime(companyUrl, duration, durationType, working, plannedCompletionTime, plannedCompletionTimeIST, decisionforPlannedComplitionTime);

            const currentDate = moment().tz('Asia/Kolkata').format();
            // Inserting data into the collection
            const result = await collection.insertOne({
                fmsTaskId,
                fmsQAId,
                fmsQACreatedBy: { userID: userID, userEmail: userEmail, userName: userName },
                fmsMasterId: req.body.fmsMasterID,
                fmsName: req.body.fmsName,
                fmsQA: req.body.fmsQA,
                fmsTaskDoer: employee,
                fmsTaskStatus: "PENDING",
                fmsTaskCompletedStatus: "null",  //either ONTIME OR DELAYED
                fmsProcessID: processId,
                plannedDate: plannedDate,
                what: what,
                how: how,
                stepId: stepId,
                stepType: stepType,
                fmsTaskCreatedTime: currentDate,
                fmsTaskPlannedCompletionTime: plannedCompletionTimeIST,
                formStepsAnswers: null,
                fmsTaskQualityDetails: null,
                isTransferredFrom: false,    //is this task transferred FROM other Task
                isTranferredTo: false,       //is this task transferred TO other Task
                transferredFromTaskId: null,
                transferredToTaskId: null,
                isWhatsAppEnabled: isWhatsAppEnabled,
                whatsappData: whatsappData,
                at: null
            });

            console.log(result);
            console.log('Created the Task');

            // Close the MongoDB connection
            await client.close();
            console.log('MongoDB connection closed');

        } catch (error) {
            console.error('Error posting data:', error);
            return res.status(500).send({ error: error.message, status: 500 });

        }

    }


    // //-------------------------Triggr Whatsapp Messages---------------------------------------//
    // console.log('trigger Whatsapp messages')
    // console.log(fmsSteps)
    // // const lastFmsStep = fmsSteps[fmsSteps.length - 1];
    // try {
    //     const sendWhatsapp = await axios.post(process.env.MAIN_BE_WHATSAPP_URL, {
    //     verify_company_url: companyUrl,
    //     fmsSteps: fmsSteps
    //     });
    //     console.log('WhatsApp message sent', sendWhatsapp.data);
    // } catch (whatsappError) {
    //     console.error('Error sending WhatsApp message:', whatsappError);
    // }

    //-------------------------Triggr Whatsapp Messages---------------------------------------//
    console.log('trigger Whatsapp messages')

    if (Array.isArray(fmsSteps) && fmsSteps.length > 0) {
        const lastFmsStep = fmsSteps[fmsSteps.length - 1];
        const whatsappData = lastFmsStep.whatsappData;

        console.log('Last fmsStep:', lastFmsStep);
        console.log('WhatsApp data to send:', whatsappData);

        try {
            const sendWhatsapp = await axios.post(process.env.MAIN_BE_WHATSAPP_URL, {
                verify_company_url: companyUrl,
                fmsSteps: lastFmsStep,
                whatsappData: whatsappData // Include whatsappData if needed
            });
            console.log('WhatsApp message sent', sendWhatsapp.data);
        } catch (whatsappError) {
            console.error('Error sending WhatsApp message:', whatsappError);
        }
    } else {
        console.error('fmsSteps is not an array or is empty');
    }



    //-------------------------Triggr Android Notification---------------------------------------//
    ///sending android notification data
    console.log('sending android notification')
    const currentDate = moment().tz('Asia/Kolkata').format();
    // try {
    //     const sendAndroidNotification = await axios.post(process.env.MAIN_ANDROID_NOTIFICATION, {
    //     verify_company_url: companyUrl,
    //     assigned_to: employee.employeeId,
    //     user_id:userID,
    //     fmsName:req.body.fmsName,
    //     what:what,
    //     fmsTaskCreatedTime:currentDate,
    //     fmsTaskPlannedCompletionTime: plannedCompletionTime,
    //     });
    //     console.log('Android Notification sent', sendAndroidNotification.data);
    // } catch (androidError) {
    //     console.error('Error sending WhatsApp message:', androidError);
    // }



    res.json({
        "message": `FMS form is submitted and Step 1 task is Createed`,
        "status": 200
    });

})
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function updateAndCountDocuments(companyUrl, fmsQAId, fmsMasterId) {

    //update the fms to false
    try {
        const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
        await client.connect();
        const db = client.db(companyUrl);
        const collection = db.collection('fms');

        // Update a document based on fmsQAId
        await collection.updateOne(
            { fmsQAId: fmsQAId },
            { $set: { fmsQAisLive: false } }
        );
        await client.close();
    } catch (error) {
        return res.status(500).send({ error: error.message, status: 500 });
        //console.error("Error:", error);

    }

    //find  no of fms flows that are still active for that master id
    let count;
    try {
        const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
        await client.connect();
        const db = client.db(companyUrl);
        const collection = db.collection('fms');


        // Define the query for counting documents
        const query = {
            fmsMasterId: fmsMasterId,
            fmsQAisLive: true
        };

        // Count documents matching the query
        count = await collection.countDocuments(query);
        console.log('NO OF FMS THAT ARE LIVE ', count);
        await client.close();
    } catch (error) {

        console.error("Error:", error);
        return res.status(500).send({ error: error.message, status: 500 });

    }

    //update in fmsMaster the total no of fms's flow that are still active
    try {
        const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
        await client.connect();
        const db = client.db(companyUrl);
        const collection = db.collection('fmsMaster');

        const updateResult = await collection.updateOne(
            { fmsMasterId: fmsMasterId }, // Use the document's _id to find and update
            { $set: { noOfLive: count } }
        );

        console.log(`${updateResult.matchedCount} document(s) matched the filter, updated ${updateResult.modifiedCount} document(s) in the 'fmsMaster' collection.`);

        await client.close();
        return count;
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).send({ error: error.message, status: 500 });

    }
}




module.exports = submitFmsQuestionare;
