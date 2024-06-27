const express = require("express");
const perfomanceCalculation = express.Router();
var MongoClient = require("mongodb").MongoClient;
const axios = require("axios");
const { log } = require("winston");

// transfer FMS using
perfomanceCalculation.post("/fmsPerfomanceCalculation", async (req, res) => {
  // Initialize variables to hold user details
  let userName = "";
  let userID = "";
  let companyUrl = "";
  let userEmail = "";

  console.log(req.headers.authorization);
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    console.log("error: Authorization header missing or malformed");
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];

  console.log("token fetched is ", token);

  try {
    // Fetch user details and company details based on the token
    const response = await axios.post(process.env.MAIN_BE_URL, {
      token: token,
    });
    console.log("Fetched User Details and Company Details", response.data);
    userName = response.data.emp_name;
    userID = response.data.user_id;
    companyUrl = response.data.verify_company_url;
    userEmail = response.data.email_id;
  } catch (error) {
    console.error("Error posting data:", error);
    return res.status(500).json({ error: error.message });
  }

  try {
    // Connect to MongoDB and perform operations
    const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
    console.log("Connected to database");
    const db = client.db(companyUrl);
    const collection = db.collection("fmsTasks");

    const {fmsMasterID} = req.body;

    const cursorFms = collection.find({ fmsMasterId: fmsMasterID });

    const taskDocuments = await cursorFms.toArray(); 

    console.log("taskDocuments" , taskDocuments);

    const TotalpendingCount = taskDocuments.filter(task => task.fmsTaskStatus === 'PENDING').length;
    const TotaloverdueCount = taskDocuments.filter(task => task.fmsTaskStatus === 'OVERDUE').length;
    const TotalcompletedCount = taskDocuments.filter(task => task.fmsTaskStatus === 'COMPLETED').length;
    const TotalDelayedCount = taskDocuments.filter(task => task.fmsTaskCompletedStatus === 'DELAY').length;

    // to find totalOverduePercentage 
    const TotalTask = TotaloverdueCount + TotalpendingCount;
    const PercentageofOverdueTask = TotalTask ? ((TotaloverdueCount / TotalTask) * 100) : 0;

    // to find totalDelayedPercentage

    // Percentage of delayed tasks - [ number of delayed tasks / number of completed tasks ]

    const TotalDelayedTaskPercentage = TotalcompletedCount ? ((TotalDelayedCount / TotalcompletedCount) * 100) : 0;

    console.log("TotalpendingCount", TotalpendingCount);
    console.log("TotaloverdueCount", TotaloverdueCount);
    console.log("TotalcompletedCount", TotalcompletedCount);
    console.log("TotalDelayedTaskPercentage" , TotalDelayedTaskPercentage);

    res.json({ 
    message: "performance calculated successfully", 
    TotalpendingCount: TotalpendingCount, 
    TotaloverdueCount: TotaloverdueCount, 
    TotalcompletedCount: TotalcompletedCount, 
    PercentageofOverdueTask: PercentageofOverdueTask, 
    TotalDelayedTaskPercentage: TotalDelayedTaskPercentage,
    TotalDelayedTaskPercentage : TotalDelayedTaskPercentage,
    status: 200 
  });

  } catch (error) {
    console.error("Error Connecting to MongoDB", error);
     return res.status(400).send({ error: "Failed to fetch fms performance calculations", status: 400 });
  }
});

module.exports = perfomanceCalculation;