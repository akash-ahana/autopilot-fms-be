const express = require("express");
const submitFmsQuestionare = express.Router();
var MongoClient = require('mongodb').MongoClient;
const axios = require('axios');

submitFmsQuestionare.post('/fmsUserQA' , async (req, res) => {
    console.log("inside fms fmsUserQA")
    console.log(req.body.fmsName)

    console.log(req.body.fmsName);

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

    try {

        // Connect to MongoDB and perform operations
        const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
        console.log('Connected to database');
        const db = client.db(companyUrl);
        const collection = db.collection('fms');

        // Find the last inserted document and get its incremental value
        const lastDocument = await collection.find().sort({ _id: -1 }).limit(1).toArray();
        let fmsQAId = 1;

        if (lastDocument.length > 0) {
            fmsQAId = lastDocument[0].fmsQAId + 1;
        }

        // Inserting data into the collection
        const result = await collection.insertOne({
            fmsQAId,
            fmsQACreatedBy: { userID: userID, userEmail: userEmail, userName: userName },
            fmsMasterID : req.body.fmsMasterID,
            fmsName: req.body.fmsName,
            fmsQA: req.body.fmsQA,
            
        });

        console.log(result);
        res.json({
            "message": `${req.body.fmsName} Step 1 is Successfully Created`,
            "status": 200
        });

        // Close the MongoDB connection
        await client.close();
        console.log('MongoDB connection closed');

    } catch (error) {
        console.error('Error posting data:', error);
        res.status(500).send({ message: 'Error Submitting QA', status: 500 });
        return;
    }

})

module.exports = submitFmsQuestionare;