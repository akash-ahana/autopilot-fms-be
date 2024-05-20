const express = require("express");
const transferFmsTask = express.Router();
var MongoClient = require("mongodb").MongoClient;
const axios = require("axios");
const { ObjectId } = require("mongodb");

// transfer FMS using
transferFmsTask.post("/transferFmsTask", async (req, res) => {
  console.log('INSIDE TRANSFER FMS TASK ----------------------------------------------------')
  console.log('INSIDE TRANSFER FMS TASK ----------------------------------------------------')
  console.log('INSIDE TRANSFER FMS TASK ----------------------------------------------------')
  console.log(req.body)
  // Initialize variables to hold user details
  let userName = "";
  let userID = "";
  let companyUrl = "";
  let userEmail = "";

  console.log(req.headers.authorization)
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

  //try catch block to create a newFmsTask for the new Doer
  try {
    // Connect to MongoDB and perform operations
    const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
    //console.log("Connected to database");
    const db = client.db(companyUrl);
    const collection = db.collection("fmsTasks");

     // Find the last inserted document and get its incremental value
     const lastDocument = await collection.find().sort({ _id: -1 }).limit(1).toArray();
     let fmsTaskId = 1;

     if (lastDocument.length > 0) {
         fmsTaskId = lastDocument[0].fmsTaskId + 1;
     }

     // Inserting data into the collection
     const result = await collection.insertOne({
      fmsTaskId,
      fmsQAId : req.body.task.fmsQAId,
      fmsQACreatedBy : req.body.task.fmsQACreatedBy,
      fmsMasterId : req.body.task.fmsMasterId,
      fmsName: req.body.task.fmsName,
      fmsQA: req.body.task.fmsQA,
      fmsTaskDoer : req.body.fmsTransferredToUser,
      fmsTaskStatus : "OVERDUE",
      fmsTaskCompletedStatus : req.body.task.fmsTaskCompletedStatus,  //either ONTIME OR DELAYED
      fmsProcessID : req.body.task.fmsProcessID,
      plannedDate : req.body.task.plannedDate,
      what : req.body.task.what,
      how: req.body.task.how,
      stepId : req.body.task.stepId,
      stepType : req.body.task.stepType,
      //fmsTaskCreatedTime : CurrentIST(),
      //fmsTaskPlannedCompletionTime : new Date(new Date().setHours(new Date().getHours() + Number(timeHrs.trim()))),
      fmsTaskCreatedTime : req.body.task.fmsTaskCreatedTime,
      fmsTaskPlannedCompletionTime : req.body.task.fmsTaskPlannedCompletionTime,
      formStepsAnswers: null,
      fmsTaskQualityDetails : null,
      fmsTaskTransferredFrom : req.body.task.fmsTaskDoer,
      isTransferredFrom: true,    //is this task transferred FROM other Task
      isTranferredTo: false,       //is this task transferred TO other Task
      transferredFromTaskId : req.body.task.fmsTaskId, 
      transferredToTaskId : null,
      
  });

      console.log(result);
      console.log('Created the Task For New Doer');
  

      // Close the MongoDB connection
      await client.close();
      //console.log('MongoDB connection closed');

      //console.log("New task created for new Doer", newTaskDocument);

    //res.json({ message: "Task transferred successfully", status: 200 });
  } catch (error) {
    console.error("Error Connecting to MongoDB", error);
    res.status(500).send({ message: "Error transferring task", status: 500 });
  }

  res.json({ message: "Task transferred successfully", status: 200 });
});


// in request bodb he will send the task that is to be transferred 
// in this API /submitFmsUserQAcreateTaskStep1 THE LAST TRY CATCH BLOCK IS CREATING THE TASK
// IN THIS aPI /updateFmsTas THE LAST TRY CATCH WE ARE  CREATING A TASK
// add these filds in both these API while creating a task - isTransferredFrom(null if it not transferrd from any other task , otherwise store the transferredfrom taskId) and isTrsansferredTo(NULL INITIALLY , IF IT IS TRANSFERRED STORE THE NEXT TaskId) 
// ADD ONE MORE FIELD tasktRANFERREDBy - in task  QA(add the QA created by details only), 
//AND THEN UPDATE THE DOER FOT THAT TASK

module.exports = transferFmsTask;