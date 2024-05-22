const express = require("express");
const getfilterDoer = express.Router();
var MongoClient = require('mongodb').MongoClient;
const axios = require('axios');

getfilterDoer.get('/getfilterDoer', async (req, res) => {
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
  const response = await axios.post(process.env.MAIN_BE_URL, { token: token });
  console.log("Fetched User Details and Company Details", response.data);
  userName = response.data.emp_name;
  userID = response.data.user_id;
  companyUrl = response.data.verify_company_url;
  userEmail = response.data.email_id;
} catch (error) {
  console.error("Error posting data:", error);
  return res.status(500).send({ message: "Error fetching user details", status: 500 });
}

const { employeeId } = req.body;

// Check if employeeId matches userID
if (employeeId !== userID) {
  console.error("Error: employeeId does not match userID");
  return res.status(403).send({ message: "Forbidden: employeeId does not match userID", status: 403 });
}

try {
  // Connect to MongoDB and perform operations
  const client = await MongoClient.connect(process.env.MONGO_DB_STRING, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log("Connected to database");
  const db = client.db(companyUrl);
  const collection = db.collection("fmsTasks");

  
  const { fmsTaskStatus, employeeId , processId } = req.body;
   
  // Log the specific fields to debug
  console.log("fmsTaskStatus:", fmsTaskStatus);
  console.log("employeeId:", employeeId);

  // Construct the query object dynamically based on the presence of fields
  const query = {};
  if (fmsTaskStatus) query.fmsTaskStatus = fmsTaskStatus;
  if (employeeId) query['fmsTaskDoer.employeeId'] = employeeId;
  if (processId) query['fmsProcessID.processId'] = processId;

  const taskDocuments = await collection.find(query).toArray();

  console.log(taskDocuments);

  // Send the fetched documents as the response
  res.status(200).json({
    message: taskDocuments,
    status: 200
  });

  // Close the MongoDB connection
  await client.close();
  console.log('MongoDB connection closed');
} catch (error) {
  console.error("Error Connecting to MongoDB", error);
  return res.status(500).send({ message: "Error transferring task", status: 500 });
}
});

module.exports = getfilterDoer