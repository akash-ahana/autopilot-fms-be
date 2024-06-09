const express = require("express");
const perfomanceCalculation = express.Router();
var MongoClient = require("mongodb").MongoClient;
const axios = require("axios");
const { log } = require("winston");
const { fetchUserDetails } = require('../helpers/fetchuserDetails');

// transfer FMS using
perfomanceCalculation.post("/fmsPerfomanceCalculation", async (req, res) => {
  // Initialize variables to hold user details
  let userDetails = await fetchUserDetails(req.headers.authorization);
  let userName = userDetails.userName;
  let userID = userDetails.userID;
  let companyUrl = userDetails.companyUrl;
  let userEmail = userDetails.userEmail;

  try {
    // Connect to MongoDB and perform operations
    const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
    console.log("Connected to database");
    const db = client.db(companyUrl);
    const collection = db.collection("fmsTasks");

    const { fmsMasterID } = req.body;

    // to find document
    const query = { fmsMasterID };
    console.log("fmsMasterID", fmsMasterID);

    const taskDocuments = await collection.find(query).toArray();

    const TotalpendingCount = taskDocuments.filter(task => task.fmsTaskStatus === 'PENDING').length;
    const TotaloverdueCount = taskDocuments.filter(task => task.fmsTaskStatus === 'OVERDUE').length;
    const TotalcompletedCount = taskDocuments.filter(task => task.fmsTaskStatus === 'COMPLETED').length;
    const TotalDelayedCount = taskDocument.filter(task => task.fmsTaskCompletedStatus === 'DELAY').length;

    // to find totalOverduePercentage 
    const TotalTask = TotaloverdueCount + TotalpendingCount;
    const PercentageofOverdueTask = TotalTask ? ((TotaloverdueCount / TotalTask) * 100) : 0;

    // to find totalDelayedPercentage

    // Percentage of delayed tasks - [ number of delayed tasks / number of completed tasks ]

    const TotalDelayedTaskPercentage = ((TotalDelayedCount / TotalcompletedCount) * 100);
    console.log("");
    console.log("TotalpendingCount", TotalpendingCount);
    console.log("TotaloverdueCount", TotaloverdueCount);
    console.log("TotalcompletedCount", TotalcompletedCount);


    res.json({ 
    message: "Task fetched successfully", 
    TotalpendingCount: TotalpendingCount, 
    TotaloverdueCount: TotaloverdueCount, 
    TotalcompletedCount: TotalcompletedCount, 
    PercentageofOverdueTask: PercentageofOverdueTask, 
    TotalDelayedTaskPercentage: TotalDelayedTaskPercentage,
    status: 200 
  });

  } catch (error) {
    console.error("Error Connecting to MongoDB", error);
     return res.status(500).send({ error: "Failed to fetch performance calculation", status: 500 });
  }
});

module.exports = perfomanceCalculation;