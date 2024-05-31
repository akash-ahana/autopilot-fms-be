const express = require("express");
const updateQualitySteps = express.Router();
//var MongoClient = require('mongodb').MongoClient;
const { MongoClient, ObjectId } = require('mongodb');
const axios = require('axios');
const { CurrentIST } = require('../helpers/convertGMTtoIST');
const { Console } = require("winston/lib/winston/transports");
const moment = require('moment-timezone');

updateQualitySteps.post("/updateQualitySteps", async (req, res) => {
   
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
   res
     .status(500)
     .send({error: "Error fetching user details", status: 500 });
   return;
 }

 try {
   // Connect to MongoDB and perform operations
   const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
   console.log("Connected to database");
   const db = client.db(companyUrl);
   const collection = db.collection("fmsTasks");

   const { value , qualityScore , stepsToRedone , scrap , status } = req.body;

    // to find document
    const query = { value , qualityScore , stepsToRedone , scrap , status };

    console.log("value" ,query.value);
    console.log("qualityScore" , query.qualityScore);
    console.log("stepsToRedone" , query.stepsToRedone);
    console.log("scrap" , query.scrap);
    console.log("status" , query.status);

    // const taskDocuments = await collection.find(query).toArray();


   res.json({ 
   message: "updated quality step successfully", 
   status: 200 
 });

 } catch (error) {
   console.error("Error Connecting to MongoDB", error);
    res.status(500).send({ error: "Failed to fetch performance calculation", status: 500 });
 }
});




module.exports = updateQualitySteps;