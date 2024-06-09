const express = require("express");
const initialiseFms = express.Router();
var MongoClient = require('mongodb').MongoClient;
const axios = require('axios');
const moment = require('moment-timezone');
const { infoLogger, errorLogger } = require("../../middleware/logger");
const { fetchUserDetails } = require('../../helpers/fetchuserDetails');

initialiseFms.post('/fmsStep1', async (req, res) => {
  console.log("Fms Step 1 API hit");
  console.log(req.body);

  let userDetails = await fetchUserDetails(req.headers.authorization);
  let userName = userDetails.userName;
  let userID = userDetails.userID;
  let companyUrl = userDetails.companyUrl;
  let userEmail = userDetails.userEmail;

  try {
    // Connect to MongoDB and perform operations
    const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
    console.log('Connected to database');
    const db = client.db(companyUrl);
    const collection = db.collection('fmsMaster');
    infoLogger.log("info", `${userName} from company ${companyUrl} hit the api fmsStep1`)

    // Convert req.body.fmsName to lowercase and remove spaces
    const formattedFmsName = req.body.fmsName.toLowerCase().replace(/\s+/g, '');

    // Check if fmsName already exists in the collection (case-insensitive, ignoring spaces)
    const existingDocument = await collection.findOne({
      $expr: {
        $eq: [
          { $toLower: { $replaceAll: { input: "$fmsName", find: " ", replacement: "" } } },
          formattedFmsName
        ]
      }
    });

    if (existingDocument) {
      await client.close();
      errorLogger.log("error", `${userName} failed to create step1 fms title ${req.body.fmsName} already exists `);
      return res.status(400).json({ error: "The FMS Title already exists", status: 400 });
    }

    // Find the last inserted document and get its incremental value
    const lastDocument = await collection.find().sort({ _id: -1 }).limit(1).toArray();
    let fmsMasterId = 1;

    if (lastDocument.length > 0) {
      fmsMasterId = lastDocument[0].fmsMasterId + 1;
    }

    ////Fetch process details
    const instance = axios.create({ httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }) });
    const processDetailsResponse = await instance.post(process.env.MAIN_BE_PROCESS_URL, {
      p_id: req.body.fmsProcess,
      verify_company_url: companyUrl
    });

    //console.log( processDetailsResponse.data.result);

    const currentDate = moment().tz('Asia/Kolkata').format();
    // Inserting data into the collection
    const result = await collection.insertOne({
      fmsMasterId,
      fmsCreatedBy: { userID: userID, userEmail: userEmail, userName: userName },
      fmsName: req.body.fmsName,
      fmsDescription: req.body.fmsDescription,
      //fmsProcess: req.body.fmsProcess
      fmsProcess: processDetailsResponse.data.result[0],
      noOfLive: 0,
      creationDate: currentDate
    });

    // Retrieve the inserted document using its _id
    const insertedDocument = await collection.findOne({ _id: result.insertedId });

    console.log(insertedDocument);
    infoLogger.log("info", `${userName} is creating step1 by inserting data with ${JSON.stringify(req.body)}.Based on the request,step1 is created with the data ${JSON.stringify(insertedDocument)}`)
    res.json({
      "message": `${req.body.fmsName} Step 1 is Successfully Created`,
      "status": 200,
      "data": insertedDocument // Include the inserted document in the response
    });

    console.log(result);

    // Close the MongoDB connection
    await client.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error Connecting to MongoDB', error);
    errorLogger.log("error", `${userName} failed to create step1 due to ${error.message}`);
    return res.status(500).send({ error: error.message, status: 500 });
  }
});


//edit fmsStep 1
initialiseFms.post('/editFmsStep1', async (req, res) => {
  console.log(" Edit Fms Step 1 API hit");
  console.log(req.body);

  let userDetails = await fetchUserDetails(req.headers.authorization);
  let userName = userDetails.userName;
  let userID = userDetails.userID;
  let companyUrl = userDetails.companyUrl;
  let userEmail = userDetails.userEmail;

  try {
    // Connect to MongoDB and perform operations
    const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
    console.log('Connected to database');
    const db = client.db(companyUrl);
    const collection = db.collection('fmsMaster');
    infoLogger.log("info", `${userName} from company ${companyUrl}  hit the api editFmsStep1`)

    ////Fetch process details
    const instance = axios.create({ httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }) });
    const processDetailsResponse = await instance.post(process.env.MAIN_BE_PROCESS_URL, {
      p_id: req.body.fmsProcess,
      verify_company_url: companyUrl
    });

    //console.log( processDetailsResponse.data.result);

    //const currentDate = moment().tz('Asia/Kolkata').format();

    // Update object
    const update = {
      $set: {
        fmsName: req.body.fmsName,
        fmsDescription: req.body.fmsDescription,
        fmsProcessId: req.body.fmsProcessId
      }
    };

    // Find and update the document
    const result = await collection.findOneAndUpdate(
      { fmsMasterId: req.body.fmsMasterId },
      update,
      { returnOriginal: false } // returns the updated document
    );



    console.log('Document updated:', result.value);
    infoLogger.log("info", `${userName} has updated step1 by requesting data with ${JSON.stringify(req.body)}.Based on the request,step1 is updated with the data ${JSON.stringify(update)}`)
    res.json({
      "message": `${req.body.fmsName} Step 1 is Successfully Edited`,
      "status": 200,
      "data": result // Include the updated document in the response
    });

    console.log(result);

    // Close the MongoDB connection
    await client.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error Connecting to MongoDB', error);
    errorLogger.log("error", `${userName} failed to update step1 due to ${error.message}`);
    return res.status(500).send({ error: error.message, status: 500 });
  }
});





//Edit FMS -- ADD FMS Access, No Edit Access For Now
initialiseFms.post('/addFmsUserAccess', async (req, res) => {

  let userDetails = await fetchUserDetails(req.headers.authorization);
  let userName = userDetails.userName;
  let userID = userDetails.userID;
  let companyUrl = userDetails.companyUrl;
  let userEmail = userDetails.userEmail;

  try {
    // Connect to MongoDB and perform operations
    const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
    console.log('Connected to database');
    const db = client.db(companyUrl);
    const collection = db.collection('fmsMaster');
    infoLogger.log("info", `${userName} from company ${companyUrl}  hit the api addFmsUserAccess`)
    //const filter = { fmsName : req.body.fmsName };
    const filter = { fmsMasterId: req.body.fmsMasterId };
    const update = { $set: { fmsAccess: req.body.fmsUsers } };
    const options = { upsert: true };

    const result = await collection.updateOne(filter, update, options);

    if (result.upsertedCount === 1) {
      console.log('Document inserted');
    } else if (result.modifiedCount === 1) {
      console.log('Document updated');
    } else {
      console.log('No changes made to the document');
    }

    console.log(result)
    infoLogger.log("info", `${userName} assigned FMS Id:${req.body.fmsMasterId} task and provided an access to ${JSON.stringify(req.body.fmsUsers)}`)
    res.json({
      "message": `${req.body.fmsName} FMS Users is Successfully Added`,
      "status": 200
    })
    // Close the MongoDB connection
    await client.close();
    console.log('MongoDB connection closed');
  }
  catch (error) {
    console.error('Error Connecting to MongoDB', error);
    errorLogger.log("error", `${userName} failed to provide access due to ${error.message}`);
    return res.status(500).send({ error: error.message, status: 500 });
  }

})

////////////// ---------------------- Create Questionare ----------------------////////////////////

//file upload, text(string) , dropdown(array of strings) , checkboxes(array of strings) , date (single date)

initialiseFms.post('/createFmsQuestionare', async (req, res) => {

  let userDetails = await fetchUserDetails(req.headers.authorization);
  let userName = userDetails.userName;
  let userID = userDetails.userID;
  let companyUrl = userDetails.companyUrl;
  let userEmail = userDetails.userEmail;

  try {

    // Connect to MongoDB and perform operations
    const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
    console.log('Connected to database');
    const db = client.db(companyUrl);
    const collection = db.collection('fmsMaster');
    infoLogger.log("info", `${userName} from company ${companyUrl}  hit the api createFmsQuestionare`)

    //const filter = { fmsName : req.body.fmsName };
    const filter = { fmsMasterId: req.body.fmsMasterId };
    const update = { $set: { fmsQuestionare: req.body.fmsQuestionare } };
    const options = { upsert: true };

    const result = await collection.updateOne(filter, update, options);

    if (result.upsertedCount === 1) {
      console.log('Document inserted');
    } else if (result.modifiedCount === 1) {
      console.log('Document updated');
    } else {
      console.log('No changes made to the document');
    }

    console.log(result)
    infoLogger.log("info", `${userName} updating ${JSON.stringify(update)} questionary and successfully updated ${JSON.stringify(result)}`)
    res.json({
      "message": `${req.body.fmsName} FMS Questionare is Successfully Added`,
      "status": 200
    })

    // Close the MongoDB connection
    await client.close();
    //console.log('MongoDB connection closed');

  }
  catch (error) {
    console.error('Error Connecting to MongoDB', error);
    errorLogger.log("error", `${userName} failed to update fms questionries due to ${error.message}`);
    return res.status(500).send({ error: error.message, status: 500 });
  }
})

//CREATE FMS Steps
initialiseFms.post('/createFmsSteps', async (req, res) => {
  console.log('inside /createFmsSteps')
  console.log(req.body)

  let userDetails = await fetchUserDetails(req.headers.authorization);
  let userName = userDetails.userName;
  let userID = userDetails.userID;
  let companyUrl = userDetails.companyUrl;
  let userEmail = userDetails.userEmail;

  try {

    // Connect to MongoDB and perform operations
    const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
    console.log('Connected to database');
    const db = client.db(companyUrl);
    const collection = db.collection('fmsMaster');
    infoLogger.log("info", `${userName} from company ${companyUrl}  hit the api createFmsSteps`)
    //const filter = { fmsName : req.body.fmsName };
    const filter = { fmsMasterId: req.body.fmsMasterId };
    const update = { $set: { fmsSteps: req.body.fmsSteps } };
    const options = { upsert: true };

    const result = await collection.updateOne(filter, update, options);

    if (result.upsertedCount === 1) {
      console.log('Document inserted');
    } else if (result.modifiedCount === 1) {
      console.log('Document updated');
    } else {
      console.log('No changes made to the document');
    }

    console.log(result)
    infoLogger.log("info", `${userName} creating ${JSON.stringify(update)} fms steps and successfully updated ${JSON.stringify(result)} fms steps`)
    res.json({
      "message": `${req.body.fmsName} FMS Steps is Successfully Added`,
      "status": 200
    })



    // try {
    //     const sendWhatsapp = await axios.post(process.env.MAIN_BE_WHATSAPP_URL, {
    //     verify_company_url: companyUrl,
    //     fmsSteps: req.body.fmsSteps
    //     });
    //     console.log('WhatsApp message sent', sendWhatsapp.data);
    // } catch (whatsappError) {
    //     console.error('Error sending WhatsApp message:', whatsappError);
    // }

    // Close the MongoDB connection
    await client.close();
    console.log('MongoDB connection closed');

  }
  catch (error) {
    console.error('Error Connecting to MongoDB', error);
    errorLogger.log("error", `${userName} failed to create fms steps due to ${error.message}`);
    return res.status(500).send({ error: error.message, status: 500 });
  }


})


//CREATE FMS Steps
initialiseFms.post('/makeFmsLive', async (req, res) => {

  let userDetails = await fetchUserDetails(req.headers.authorization);
  let userName = userDetails.userName;
  let userID = userDetails.userID;
  let companyUrl = userDetails.companyUrl;
  let userEmail = userDetails.userEmail;

  try {

    // Connect to MongoDB and perform operations
    const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
    console.log('Connected to database');
    const db = client.db(companyUrl);
    const collection = db.collection('fmsMaster');
    infoLogger.log("info", `${userName} from company ${companyUrl}  hit the api makeFmsLive`)
    //const filter = { fmsName : req.body.fmsName };
    const filter = { fmsMasterId: req.body.fmsMasterId };
    const update = { $set: { fmsLive: req.body.fmsLive } };   //fmsLive means that fms is active
    const options = { upsert: true };

    const result = await collection.updateOne(filter, update, options);

    if (result.upsertedCount === 1) {
      console.log('Document inserted');
    } else if (result.modifiedCount === 1) {
      console.log('Document updated');
    } else {
      console.log('No changes made to the document');
    }

    console.log(result)
    infoLogger.log("info", `FMS id:${req.body.fmsMasterId} is set to live by ${userName}`)
    res.json({
      "message": `${req.body.fmsName} FMS Steps is Successfully Added`,
      "status": 200
    })

    // Close the MongoDB connection
    await client.close();
    console.log('MongoDB connection closed');

  }
  catch (error) {
    console.error('Error Connecting to MongoDB', error);
    errorLogger.log("error", `${userName} failed to make fms live due to ${error.message}`);
    return res.status(500).send({ error: error.message, status: 500 });
  }


})




module.exports = initialiseFms;
