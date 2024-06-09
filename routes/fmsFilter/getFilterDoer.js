const express = require("express");
const getfilterDoer = express.Router();
const MongoClient = require('mongodb').MongoClient;
const axios = require('axios');

getfilterDoer.get('/getfilterDoer', async (req, res) => {
  let userDetails = await fetchUserDetails(req.headers.authorization);
  let userName = userDetails.userName;
  let userID = userDetails.userID;
  let companyUrl = userDetails.companyUrl;
  let userEmail = userDetails.userEmail;


    // Use userID as employeeId
    const employeeId = userID;
  // Extract query parameters from request body
  let { status, processId, select_date, week_no } = req.query;
  
    // Only convert status to uppercase if it is defined
      if (status!== undefined) {
        status = status.toUpperCase();
      }

  try {
    // Connect to MongoDB
    const client = await MongoClient.connect(process.env.MONGO_DB_STRING, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Connected to database");
    const db = client.db(companyUrl);
    const collection = db.collection("fmsTasks");

    // Log the specific fields to debug
    console.log("fmsTaskStatus:", status);
    console.log("processId:", processId);
    console.log("fmsTaskPlannedCompletionTime:", select_date);
    console.log("week_number:", week_no);

    // Construct the query object dynamically based on the presence of fields
    const query = {'fmsTaskDoer.employeeId':employeeId};
    if (status) query.fmsTaskStatus = status;
    if (processId) query['fmsProcessID.processId'] = parseInt(processId, 10);

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
        console.log("Received week_no:", week_no);

        // Fetch company starting day of the week
        const companyStartingDayWeekResponse = await axios.post(process.env.MAIN_BE_STARTDAY_WEEK_URL, {
          verify_company_url: companyUrl
        });

        const responseResults = companyStartingDayWeekResponse.data.result;
        console.log("Company Starting Day Week Response Results:", responseResults);

        // Find the object that matches the provided week_number
        const matchingWeek = responseResults.find(week => week.weekNo === parseInt(week_no, 10));

        if (matchingWeek) {
          const { weekStartingDate, weekStartingDay, weekNo } = matchingWeek;

          console.log("Fetched Week Starting Date:", weekStartingDate);
          console.log("Fetched Week Starting Day:", weekStartingDay);
          console.log("Fetched Week Number:", weekNo);
          console.log("Received Week Number:", week_no);

          const startOfWeek = new Date(weekStartingDate);
          startOfWeek.setUTCHours(0, 0, 0, 0);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6); // 6 days after the start date
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
        return res.status(500).json({ error:error.message });
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
    return res.status(500).json({ error: error.message });
  }
});

module.exports = getfilterDoer;
