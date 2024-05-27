const express = require("express");
const getfilterDoer = express.Router();
const MongoClient = require('mongodb').MongoClient;
const axios = require('axios');

getfilterDoer.get('/getfilterDoer', async (req, res) => {
  let userName = "";
  let userID = "";
  let companyUrl = "";
  let userEmail = "";

  // Check for authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("Error: Authorization header missing or malformed");
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];

  console.log("Token fetched is", token);

  try {
    // Fetch user details and company details based on the token
    const response = await axios.post(process.env.MAIN_BE_URL, { token });
    console.log("Fetched User Details and Company Details", response.data);
    userName = response.data.emp_name;
    userID = response.data.user_id;
    companyUrl = response.data.verify_company_url;
    userEmail = response.data.email_id;
  } catch (error) {
    console.error("Error posting data:", error);
    return res.status(500).json({ message: "Error fetching user details", status: 500 });
  }

  // Use userID as employeeId
  const employeeId = userID;

  // Extract query parameters from request body
  const { status, processId, select_date, week_no } = req.body;

  try {
    // Connect to MongoDB
    const client = await MongoClient.connect(process.env.MONGO_DB_STRING, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Connected to database");
    const db = client.db(companyUrl);
    const collection = db.collection("fmsTasks");

    // Log the specific fields to debug
    console.log("fmsTaskStatus:", status);
    console.log("employeeId:", employeeId);
    console.log("processId:", processId);
    console.log("fmsTaskPlannedCompletionTime:", select_date);
    console.log("week_number:", week_no);

    // Construct the query object dynamically based on the presence of fields
    const query = {};
    if (status) query.fmsTaskStatus = status;
    if (employeeId) query['fmsTaskDoer.employeeId'] = employeeId;
    if (processId) query['fmsProcessID.processId'] = processId;
    if (select_date) {
      const startOfDay = new Date(select_date);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(select_date);
      endOfDay.setUTCHours(23, 59, 59, 999);

      query.fmsTaskPlannedCompletionTime = {
        $gte: startOfDay.toISOString(),
        $lt: endOfDay.toISOString()
      };
    }

    if (week_no) {
      try {
        console.log("week_no input:", week_no);

        // Fetch company starting day of the week
        const companyStartingDayWeekResponse = await axios.post(process.env.MAIN_BE_STARTDAY_WEEK_URL, {
          verify_company_url: companyUrl
        });

        const responseResults = companyStartingDayWeekResponse.data.result;
        console.log(responseResults);

        // Find the object that matches the provided week_number
        const matchingWeek = responseResults.find(week => week.weekNo === week_no);

        if (matchingWeek) {
          const { weekStartingDate } = matchingWeek;

          console.log("Fetched Week Starting Date:", weekStartingDate);

          const startOfWeek = new Date(weekStartingDate);
          startOfWeek.setUTCHours(0, 0, 0, 0);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(endOfWeek.getDate() + 7);
          endOfWeek.setUTCHours(0, 0, 0, 0);

          // Construct the query with the date range
          query.fmsTaskPlannedCompletionTime = {
            $gte: startOfWeek.toISOString(),
            $lte: endOfWeek.toISOString()
          };

          console.log("Query result:", query.fmsTaskPlannedCompletionTime);
        }
      } catch (error) {
        console.error("Error while fetching week details:", error);
        return res.status(500).json({ error: "Internal server error" });
      }
    }

    const taskDocuments = await collection.find(query).toArray();

    console.log("Task Documents:", taskDocuments);

    // Send the fetched documents as the response
    res.status(200).json({
      message: taskDocuments,
      status: 200
    });

    // Close the MongoDB connection
    await client.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error("Error connecting to MongoDB", error);
    return res.status(500).json({ message: "Error filter task", status: 500 });
  }
});

module.exports = getfilterDoer;
