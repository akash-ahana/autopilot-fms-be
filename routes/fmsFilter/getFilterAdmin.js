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

    const { status, employeeId, processId, select_date, week_no } = req.query;

    // Log the specific fields to debug
    console.log("fmsTaskStatus:", status);
    console.log("employeeId:", employeeId);
    console.log("select_date:", select_date);
    console.log("week_no:", week_no);

    // Construct the query object dynamically based on the presence of fields
    const query = {};

    if (status) query.fmsTaskStatus = status;
    if (employeeId) query['fmsTaskDoer.employeeId'] = parseInt(employeeId, 10);
    if (processId) query['fmsProcessID.processId'] = parseInt(processId, 10);;

    // Handle date filtering
    if (select_date || week_no) {
      query.fmsTaskPlannedCompletionTime = {};
    }

    if (select_date) {
      const date = new Date(select_date);
      if (!isNaN(date)) {
        const startOfDay = new Date(date);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setUTCHours(23, 59, 59, 999);

        query.fmsTaskPlannedCompletionTime.$gte = startOfDay;
        query.fmsTaskPlannedCompletionTime.$lt = endOfDay;

        console.log("Date range for select_date query:", {
          $gte: startOfDay.toISOString(),
          $lt: endOfDay.toISOString()
        });
      } else {
        console.error("Invalid select_date provided");
        return res.status(400).json({ error: "Invalid select_date provided" });
      }
    }

    if (week_no) {
      try {
        console.log("week_no input:", week_no);

        // Fetch company starting day of the week
        const companyStartingDayWeekResponse = await axios.post(process.env.MAIN_BE_STARTDAY_WEEK_URL, {
          verify_company_url: companyUrl
        });

        const responseResults = companyStartingDayWeekResponse.data.result;
        console.log("Response Results:", responseResults);

        // Log all available week numbers to verify
        responseResults.forEach(week => {
          console.log("Available week_no:", week.weekNo);
        });

        // Find the object that matches the provided week_number
        const matchingWeek = responseResults.find(week => week.weekNo === parseInt(week_no, 10));

        if (matchingWeek) {
          const { weekStartingDate } = matchingWeek;

          console.log("Fetched Week Starting Date:", weekStartingDate);

          const startOfWeek = new Date(weekStartingDate);
          startOfWeek.setUTCHours(0, 0, 0, 0);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(endOfWeek.getDate() + 6); // 7 days range
          endOfWeek.setUTCHours(23, 59, 59, 999);

          // Check if `select_date` is also provided and combine the date ranges
          if (query.fmsTaskPlannedCompletionTime.$gte) {
            query.fmsTaskPlannedCompletionTime.$gte = new Date(Math.max(query.fmsTaskPlannedCompletionTime.$gte, startOfWeek));
          } else {
            query.fmsTaskPlannedCompletionTime.$gte = startOfWeek;
          }

          if (query.fmsTaskPlannedCompletionTime.$lt) {
            query.fmsTaskPlannedCompletionTime.$lt = new Date(Math.min(query.fmsTaskPlannedCompletionTime.$lt, endOfWeek));
          } else {
            query.fmsTaskPlannedCompletionTime.$lt = endOfWeek;
          }

          console.log("Date range for week_no query:", {
            $gte: startOfWeek.toISOString(),
            $lt: endOfWeek.toISOString()
          });
        } else {
          console.error("Error: Provided week_no doesn't match any fetched week_no");
          return res.status(400).json({ error: "Invalid week_no provided" });
        }
      } catch (error) {
        console.error("Error while fetching week details:", error);
        return res.status(500).json({ error: "Internal server error" });
      }
    }

    // Log the final query before execution
    console.log("Final Query:", JSON.stringify(query, null, 2));

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
