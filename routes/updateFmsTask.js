const express = require("express");
const updateFmsTask = express.Router();
//var MongoClient = require('mongodb').MongoClient;
const { MongoClient, ObjectId } = require('mongodb');
const axios = require('axios');
const { CurrentIST } = require('../helpers/convertGMTtoIST');
const { Console } = require("winston/lib/winston/transports");

//update fms tasks 
//first it updates the task that is send 
//fetch the next task , 
//create a task for that user
updateFmsTask.post('/updateFmsTask' , async (req, res) => {
    console.log("inside UPDATE FMS TASK -----------------------------------------------------------")
    console.log("inside UPDATE FMS TASK -----------------------------------------------------------")
    console.log("inside UPDATE FMS TASK -----------------------------------------------------------")
    console.log('REQUEST BODY' , req.body)
    

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
    await updateTaskStatus(companyUrl , req.body.fmsTaskId, req.body.formStepsAnswers, req.body.fmsTaskQualityDetails);

    //GETTING THE TASK THAT NEEDS TO BE UPDATED
    //let taskToBeUpdated = getTaskToBeUpdated(companyUrl, req.body.fmsTaskId);
    //console.log("taskToBeUpdated" , taskToBeUpdated)
   

   
    //console.log('Updating The Task')
    //updateTask(companyUrl , req.body.fmsTaskId, req.body.formStepsAnswers, req.body.fmsTaskQualityDetails)
    //console.log('Updated The Task')

    console.log('fetching info to create next task')

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
    let fmsTaskTransferredFrom;
    let formStepsAnswers;
    let fmsTaskQualityDetails;
    let isTransferredFrom;   
    let isTranferredTo;   
    let transferredFromTaskId;
    let transferredToTaskId;   
    try {
        // Connect to MongoDB and perform operations
        const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
        console.log('Connected to database to fetch next task info');
        console.log('companyUrl' , companyUrl)
        const db = client.db(companyUrl);
        const collection = db.collection('fmsMaster');

        const cursor = collection.find({ fmsName: req.body.fmsName });
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

        console.log('stepId IS ' , req.body.stepId)
        console.log('no of steps in that fms' , document.fmsSteps.length)
        if(req.body.stepId <   document.fmsSteps.length) {
            shouldcreateNextTask = true
            timeHrs = document.fmsSteps[req.body.stepId].plannedDate.duration
            console.log('timeHrs' , timeHrs )
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
            fmsTaskTransferredFrom = document.fmsSteps[req.body.stepId].plannedDate.fmsTaskTransferredFrom
            formStepsAnswers =  document.fmsSteps[req.body.stepId].plannedDate.formStepsAnswers
            fmsTaskQualityDetails = document.fmsSteps[req.body.stepId].plannedDate.fmsTaskQualityDetails
            isTransferredFrom = document.fmsSteps[req.body.stepId].plannedDate.isTransferredFrom
            isTranferredTo = document.fmsSteps[req.body.stepId].plannedDate.isTranferredTo
        } else {
            shouldcreateNextTask = false
            console.log('this is the last step')
            try {
                const clientUpdate = await MongoClient.connect(process.env.MONGO_DB_STRING);
                console.log('Connected to database');
                const db = clientUpdate.db(companyUrl);
   
                // const masterCollection = db.collection('fmsMaster');
                // await masterCollection.updateOne(
                //     { fmsMasterId: req.body.fmsMasterID },
                //     { $inc: { noOfLive: -1 } }
                // );

                const masterCollection = db.collection('fmsMaster');
                const masterDocument = await masterCollection.findOne({ fmsName: req.body.fmsName });
                console.log('recieved document' , masterDocument)
                const newNoOfLive = masterDocument.noOfLive - 1;
                await masterCollection.updateOne(
                    { fmsMasterId: req.body.fmsMasterId },
                    { $set: { noOfLive: newNoOfLive } }
                );
   
                const fmsCollection = db.collection('fms');
                await fmsCollection.updateOne(
                    { fmsQAId: req.body.fmsQAId },
                    { $set: { fmsQAisLive: false } }
                );
   
                await clientUpdate.close();
                console.log('MongoDB connection closed');
   
            } catch (error) {
                console.error('Error updating final task details:', error);
                res.status(500).send({ message: 'Error updating final task details', status: 500 });
                return;
            }
        }
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
        // create nex ttask only if it is not the last step in the FMS
        if(shouldcreateNextTask) {
            try {

                //calculation of fmsTaskPlannedCompletionTime (start time - form submitted time, and tat in hrs or days)
        
                // Connect to MongoDB and perform operations
                const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
                console.log('Connected to database to create the next task');
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
                    fmsTaskTransferredFrom : null,
                    fmsTaskTransferredFrom : null,
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
                res.status(500).send({ message: 'Error Creating Next Task', status: 500 });
                return;
            }
        }
       

   // }

   res.json({
    "message": `Task Updated`,
    "status": 200
});
})

// async function updateTask(companyUrl , taskId, formStepsAnswers,fmsTaskQualityDetails) {
//     //try block to update the task
//     try {
//     // Connect to MongoDB and perform operations
//     const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
//     console.log('Connected to database');
//     const db = client.db(companyUrl);
//     const collection = db.collection('fmsTasks');

//     // Filter document to find the document to update
//     const filter = { fmsTaskId: taskId };

//     const update = {
//         $set: {
//             fmsTaskStatus: "COMPLETED",
//             formStepsAnswers: formStepsAnswers,
//             fmsTaskQualityDetails : fmsTaskQualityDetails
//         },
//         $currentDate: { currentTime: true }
//         };
    

//     //Perform the update operation
//     const result = await collection.updateOne(filter, update);

//      console.log('update task result' , result);
    

//     // Close the MongoDB connection
//     await client.close();
//     console.log('MongoDB connection closed');

//     } catch (error) {
//     console.error('Error posting data:', error);
//     res.status(500).send({ message: 'Error Submitting QA', status: 500 });
//     return;
//     }
//     console.log('updated the task')
// }

// async function getTaskToBeUpdated(companyUrl , taskId) {
//     let taskToBeUpdated;
//      try {
//         // Connect to MongoDB and perform operations
//         const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
//         console.log('Connected to database to get overDueTasksForPc');
//         const db = client.db(companyUrl);
//         const collection = db.collection('fmsTasks');

//         // Query to find documents with processCoordinatorId of 1
//         const query = { fmsTaskId: taskId };
          
//         taskToBeUpdated = await collection.find(query).toArray();

        

//         //console.log('taskToBeUpdated' , taskToBeUpdated);
       
//         // Close the MongoDB connection
//         await client.close();
//         console.log('MongoDB connection closed');
//         return taskToBeUpdated
//     } 
//     catch (error) {
//         console.error('Error Connecting to MongoDB', error);
//         res.status(500).send({ message: `${taskId}  Task ID NOT found`, status: 500 });
//     }
// }

async function updateTaskStatus(companyUrl ,fmsTaskId, formStepsAnswers,fmsTaskQualityDetails) {
    console.log('INSIDE THE FUNCTION TO UPDATE THE TASK STATUS TO COMPLETED')
    const dbName = companyUrl; // replace with your database name
    const client = await MongoClient.connect(process.env.MONGO_DB_STRING);

    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection('fmsTasks'); // replace with your collection name

        // Recursive function to update task and its transferred tasks
        async function updateTaskRecursively(taskId) {
            console.log('TASK THAT IS GETTING UPDATED IS (RECURSIVE FUNCTION)' , taskId)
            const task = await collection.findOneAndUpdate(
                { fmsTaskId: taskId },
                {  $set: {
                    fmsTaskStatus: "COMPLETED",
                    formStepsAnswers: formStepsAnswers,
                    fmsTaskQualityDetails : fmsTaskQualityDetails
                }, },
                { returnOriginal: false }
            );

            if (!task.fmsTaskId) {
                console.log(`Task with fmsTaskId ${taskId} not found`);
                return;
            }

            console.log('Task updated:', task.fmsTaskId);

            // Check if the task is transferred from another task
            console.log('CHECKING IF THE TASK IS TRANSFERRD FROM SOME OTHER TASK')
            console.log(task.isTransferredFrom , 'task.isTransferredFrom')
            if (task.isTransferredFrom) {
                console.log('YES THE TASK IS TRANSFERRED FROM SOME OTHER TASK'  ,task.isTransferredFrom)
                const transferredFromTaskId = task.transferredFromTaskId;
                console.log('transferredFromTaskId' ,  transferredFromTaskId)
                // Recursively update the transferred task
                await updateTaskRecursively(transferredFromTaskId);
            }
        }

        // Start the recursive update with the initial task
        await updateTaskRecursively(fmsTaskId);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}



module.exports = updateFmsTask;