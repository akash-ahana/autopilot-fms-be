const express = require("express");
const getfilterAdmin = express.Router();
const MongoClient = require('mongodb').MongoClient;
const axios = require('axios');

getfilterAdmin.get('/getfilterAdmin', async (req, res) => {
  let userName = "";
  let userID = "";
  let companyUrl = "";
  let userEmail = "";

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

  try {
    // Connect to MongoDB
    const client = await MongoClient.connect(process.env.MONGO_DB_STRING, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Connected to database");
    const db = client.db(companyUrl);
    const collection = db.collection("fmsTasks");

    const { fmsTaskStatus, employeeId, processId, fmsTaskPlannedCompletionTime, week_number } = req.body;

    // Log the specific fields to debug
    console.log("fmsTaskStatus:", fmsTaskStatus);
    console.log("employeeId:", employeeId);

    // Construct the query object dynamically based on the presence of fields
    const query = {};

    if (fmsTaskStatus) query.fmsTaskStatus = fmsTaskStatus;
    if (employeeId) query['fmsTaskDoer.employeeId'] = employeeId;
    if (processId) query['fmsProcessID.processId'] = processId;

    if (fmsTaskPlannedCompletionTime) {
      const startOfDay = new Date(fmsTaskPlannedCompletionTime);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(fmsTaskPlannedCompletionTime);
      endOfDay.setUTCHours(23, 59, 59, 999);

      query.fmsTaskPlannedCompletionTime = {
        $gte: startOfDay.toISOString(),
        $lt: endOfDay.toISOString()
      };
    }

    if (week_number) {
      try {
        console.log("week_no input:", week_number);

        // Fetch company starting day of the week
        const companyStartingDayWeekResponse = await axios.post(process.env.MAIN_BE_STARTDAY_WEEK_URL, {
          verify_company_url: companyUrl
        });

        const responseResults = companyStartingDayWeekResponse.data.result;
        console.log(responseResults);

        // Find the object that matches the provided week_number
        const matchingWeek = responseResults.find(week => week.weekNo === week_number);

        if (matchingWeek) {
          const { weekStartingDate } = matchingWeek;

          console.log("Fetched Week Starting Date:", weekStartingDate);

          const startOfWeek = new Date(weekStartingDate);
          startOfWeek.setUTCHours(0, 0, 0, 0);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(endOfWeek.getDate() + 7);
          endOfWeek.setUTCHours(23, 59, 59, 999);

          // Construct the query with the date range
          query.fmsTaskPlannedCompletionTime = {
            $gte: startOfWeek.toISOString(),
            $lte: endOfWeek.toISOString()
          };

          console.log("Query result:", query.fmsTaskPlannedCompletionTime);
        } else {
          console.error("Error: Provided week_no doesn't match any fetched week_no");
          return res.status(400).json({ error: "Invalid week_no provided" });
        }
      } catch (error) {
        console.error("Error while fetching week details:", error);
        return res.status(500).json({ error: "Internal server error" });
      }
    }

    // Execute the query
    const taskDocuments = await collection.find(query).toArray();
    console.log("Task Documents:", taskDocuments);

    res.status(200).json({ message: taskDocuments, status: 200 });

    // Close the MongoDB connection
    await client.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error("Error connecting to MongoDB", error);
    return res.status(500).json({ message: "Error filtering tasks", status: 500 });
  }
});

module.exports = getfilterAdmin;