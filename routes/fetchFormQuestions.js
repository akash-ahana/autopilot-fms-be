const express = require("express");
const fetchFormQuestions = express.Router();
var MongoClient = require("mongodb").MongoClient;
const axios = require("axios");
const { log, error } = require("winston");

// transfer FMS using
fetchFormQuestions.get("/fetchFormQuestions", async (req, res) => {
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
    const collection = db.collection("fmsMaster");

    const {fmsMasterID} = req.body;
    const cursorFms = collection.find({ fmsMasterId: fmsMasterID });

    const document = await cursorFms.toArray(); 
    console.log("docuemnt" , document);
    
    if(document.length === 0){
        return res.status(404).json({ error : "No Data Found"})
    }
    const fetchQuestions = document[0].fmsQuestionare;

  
    console.log("fetchQuestions", fetchQuestions);

    let questionBank = [];
    for (let i = 0; i < fetchQuestions.length; i++) {
        const element = fetchQuestions[i];
        if(element.answerType === 'DATE'){
            questionBank.push(element)
        }
        console.log("element", element);
    }

    console.log("questionBank" , questionBank);

    res.json({ 
    message: "Task fetched successfully", 
    questionBank:questionBank,
    status: 200 
  });

  } catch (error) {
    console.error("Error Connecting to MongoDB", error);
     return res.status(500).send({ error: "Failed to fetch form dates", status: 500 });
  }
});

module.exports = fetchFormQuestions;