const express = require("express");
const updateFmsTask = express.Router();
var MongoClient = require('mongodb').MongoClient;
const axios = require('axios');

updateFmsTask.post('/updateFmsTask' , async (req, res) => {
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
        const collection = db.collection('fmsTasks');

        // Filter document to find the document to update
        const filter = { fmsTaskId: req.body.fmsTaskId };

        //Update document with new values
        //const update = { $set: { fmsTaskStatus: "COMPLETED" } };

        const update = {
            $set: { fmsTaskStatus: "COMPLETED" },
            $currentDate: { at: true }
          };

        //Options object (optional)
        //const options = { upsert: false }; // Set to true if you want to insert a new document if no documents match the filter

        //Perform the update operation
        const result = await collection.updateOne(filter, update);

        console.log(result);
        res.json({
            "message": `Task is successfully updated`,
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

module.exports = updateFmsTask;