const express = require("express");
const transferFmsTask = express.Router();
var MongoClient = require("mongodb").MongoClient;
const axios = require("axios");
const { ObjectId } = require("mongodb");

// transfer FMS using
transferFmsTask.post("/transferFmsTask", async (req, res) => {
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

  //try catch block to create a newFmsTask for the new Doer
  try {
    // Connect to MongoDB and perform operations
    const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
    console.log("Connected to database");
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
      fmsQAId : req.body.fmsQAId,
      fmsMasterID : req.body.fmsMasterID,
      fmsName: req.body.fmsName,
      fmsQA: req.body.fmsQA,
      formStepsQustions : req.body.formStepsQustions,
      fmsTaskDoer : req.body.newDoer,
      fmsTaskStatus : "PENDING",
      fmsProcessID : req.body.processId,
      plannedDate : req.body.plannedDate,
      what : req.body.what,
      how: req.body.how,
      stepId : req.body.stepId,
      stepType : req.body.stepType,
      //fmsTaskCreatedTime : CurrentIST(),
      //fmsTaskPlannedCompletionTime : new Date(new Date().setHours(new Date().getHours() + Number(timeHrs.trim()))),
      fmsTaskCreatedTime : req.body.fmsTaskCreatedTime,
      fmsTaskPlannedCompletionTime : req.body.fmsTaskPlannedCompletionTime,
      formStepsAnswers: null,
      fmsTaskQualityDetails : null,
      isTransferredFrom: true,    //is this task transferred FROM other Doer
      isTranferredTo: false       //is this task transferred TO other Doer
  });

      console.log(result);
      console.log('Created the Task For New Doer');
  

      // Close the MongoDB connection
      await client.close();
      console.log('MongoDB connection closed');

      console.log("New task created for new Doer", newTaskDocument);

    //res.json({ message: "Task transferred successfully", status: 200 });
  } catch (error) {
    console.error("Error Connecting to MongoDB", error);
    res.status(500).send({ message: "Error transferring task", status: 500 });
  }
});


// in request bodb he will send the task that is to be transferred 
// in this API /submitFmsUserQAcreateTaskStep1 THE LAST TRY CATCH BLOCK IS CREATING THE TASK
// IN THIS aPI /updateFmsTas THE LAST TRY CATCH WE ARE  CREATING A TASK
// add these filds in both these API while creating a task - isTransferredFrom(null if it not transferrd from any other task , otherwise store the transferredfrom taskId) and isTrsansferredTo(NULL INITIALLY , IF IT IS TRANSFERRED STORE THE NEXT TaskId) 
// ADD ONE MORE FIELD tasktRANFERREDBy - in task  QA(add the QA created by details only), 
//AND THEN UPDATE THE DOER FOT THAT TASK

module.exports = transferFmsTask;