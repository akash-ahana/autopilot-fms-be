const express = require("express");
const initialiseFms = express.Router();
var MongoClient = require('mongodb').MongoClient;
const axios = require('axios');
const moment = require('moment-timezone');
const { infoLogger, errorLogger } = require("../../middleware/logger");

initialiseFms.post('/fmsStep1', async (req, res) => {
    console.log("Fms Step 1 API hit");
    console.log(req.body);

    // Initialize variables to hold user details
    let userName = "";
    let userID = "";
    let companyUrl = "";
    let userEmail = "";

    console.log(req.headers.authorization)
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer")) {
        console.log("error: Authorization header missing or malformed");
        errorLogger.log("error", `Token ${req.headers.authorization} is un-authorized as authorization header missing or malformed for api fmsStep1`);
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const token = authHeader.split(" ")[1];
      infoLogger.log("info", `token ${token} is verified successfuly for the api fmsStep1`);
      console.log('token fetched is ' , token)

    try {
        // Fetch user details and company details based on the token
        const response = await axios.post(process.env.MAIN_BE_URL, { token: token });
        console.log('Fetched User Details and Company Details', response.data);
        userName = response.data.emp_name;
        userID = response.data.user_id;
        companyUrl = response.data.verify_company_url;
        userEmail = response.data.email_id;
        //infoLogger.log("info", `${JSON.stringify(response.data)} logged in autopilot fms`)
    } catch (error) {
        console.error('Error posting data:', error);
        errorLogger.log("error",`Failed to fetch user details due to ${error.message}`)
         return res.status(500).send({ error: 'Error fetching user details', status: 500 });
       
    }

    console.log(userName , "userName")
    console.log(userID , "userID")
    console.log(companyUrl , "companyUrl")
    console.log(userEmail , "userEmail")


    try {
        // Connect to MongoDB and perform operations
        const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
        console.log('Connected to database');
        const db = client.db(companyUrl);
        const collection = db.collection('fmsMaster');
       // infoLogger.log("info", `${userName} from company ${companyUrl} hit the api fmsStep1`)

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
           errorLogger.log("error" , `${userName} failed to create step1 fms title ${req.body.fmsName} already exists `);
           return res.status(400).json({ error: "The FMS Title already exists", status: 400 });
       }
       console.log('existing fms name validation done')

        // Find the last inserted document and get its incremental value
        const lastDocument = await collection.find().sort({ _id: -1 }).limit(1).toArray();
        let fmsMasterId = 1;

        if (lastDocument.length > 0) {
            fmsMasterId = lastDocument[0].fmsMasterId + 1;
        }

        console.log("token",token);
        ////Fetch process details
        const processDetailsResponse = await axios.post(process.env.MAIN_BE_PROCESS_URL, {
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
            noOfLive : 0,
            creationDate: currentDate
        });

        //added return 

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
        // res.json({
        //     "message": `${req.body.fmsName} Step 1 is Successfully Created`,
        //     "status": 200
        // });

        // Close the MongoDB connection
        await client.close();
        console.log('MongoDB connection closed');
    } catch (error) {
        console.error('Error Connecting to MongoDB', error);
        errorLogger.log("error" , `${userName} failed to create step1 due to ${error.message}`);
        return res.status(500).send({ error: error.message, status: 500 });
    }
});


//edit fmsStep 1
initialiseFms.post('/editFmsStep1', async (req, res) => {
  console.log(" Edit Fms Step 1 API hit");
  console.log(req.body);

  // Initialize variables to hold user details
  let userName = "";
  let userID = "";
  let companyUrl = "";
  let userEmail = "";

  console.log(req.headers.authorization)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer")) {
      console.log("error: Authorization header missing or malformed");
      errorLogger.log("error", `Token ${req.headers.authorization} is un-authorized as authorization header missing or malformed for api editFmsStep`);
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(" ")[1];
    infoLogger.log("info", `token ${token} is verified successfuly for the api editFmsStep1`);
    console.log('token fetched is ' , token)

  try {
      // Fetch user details and company details based on the token
      const response = await axios.post(process.env.MAIN_BE_URL, { token: token });
      console.log('Fetched User Details and Company Details', response.data);
      userName = response.data.emp_name;
      userID = response.data.user_id;
      companyUrl = response.data.verify_company_url;
      userEmail = response.data.email_id;
      infoLogger.log("info", `${JSON.stringify(response.data)} logged in autopilot fms`)
  } catch (error) {
      console.error('Error posting data:', error);
      errorLogger.log("error",`Failed to fetch user details due to ${error.message}`)
       return res.status(500).send({ error: 'Error fetching user details', status: 500 });
      
  }

  try {
      // Connect to MongoDB and perform operations
      const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
      console.log('Connected to database');
      const db = client.db(companyUrl);
      const collection = db.collection('fmsMaster');
      infoLogger.log("info", `${userName} from company ${companyUrl}  hit the api editFmsStep1`)
      
      ////Fetch process details
      const processDetailsResponse = await axios.post(process.env.MAIN_BE_PROCESS_URL, {
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

      // if (!result.value) {
      //     console.log(`Document with fmsMasterId ${req.body.fmsMasterId} not found`);
      //     return;
      // }

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
      errorLogger.log("error" , `${userName} failed to update step1 due to ${error.message}`);
      return res.status(500).send({ error: error.message, status: 500 });
  }
});





//Edit FMS -- ADD FMS Access, No Edit Access For Now
initialiseFms.post('/addFmsUserAccess' , async (req, res) => {

    // Initialize variables to hold user details
    let userName = "";
    let userID = "";
    let companyUrl = "";
    let userEmail = "";

    console.log(req.headers.authorization)
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer")) {
        console.log("error: Authorization header missing or malformed");
        errorLogger.log("error", `Token ${req.headers.authorization} is un-authorized as authorization header missing or malformed for api addFmsUserAccess`);
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const token = authHeader.split(" ")[1];
      infoLogger.log("info", `token ${token} is verified successfuly for the api addFmsUserAccess`);
      console.log('token fetched is ' , token)

    try {
        // Fetch user details and company details based on the token
        const response = await axios.post(process.env.MAIN_BE_URL, { token: token });
        console.log('Fetched User Details and Company Details', response.data);
        userName = response.data.emp_name;
        userID = response.data.user_id;
        companyUrl = response.data.verify_company_url;
        userEmail = response.data.email_id;
        infoLogger.log("info", `${JSON.stringify(response.data)} logged in autopilot fms`)
    } catch (error) {
        console.error('Error posting data:', error);
        errorLogger.log("error",`Failed to fetch user details due to ${error.message}`)
        return res.status(500).send({ error: 'Error fetching user details', status: 500 });
       
    }

            try {
                // Connect to MongoDB and perform operations
                const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
                console.log('Connected to database');
                const db = client.db(companyUrl);
                const collection = db.collection('fmsMaster');
                infoLogger.log("info", `${userName} from company ${companyUrl}  hit the api addFmsUserAccess`)
                //const filter = { fmsName : req.body.fmsName };
                const filter = { fmsMasterId : req.body.fmsMasterId };
                const update = { $set: { fmsAccess : req.body.fmsUsers } };
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
                    "message" : `${req.body.fmsName} FMS Users is Successfully Added`,
                    "status" : 200
                })
                 // Close the MongoDB connection
                    await client.close();
                    console.log('MongoDB connection closed');
            } 
            catch (error) {
                console.error('Error Connecting to MongoDB', error);
                errorLogger.log("error" , `${userName} failed to provide access due to ${error.message}`);
                return res.status(500).send({ error: error.message, status: 500 });
            }

        
    })

////////////// ---------------------- Create Questionare ----------------------////////////////////

//file upload, text(string) , dropdown(array of strings) , checkboxes(array of strings) , date (single date)

initialiseFms.post('/createFmsQuestionare' , async (req, res) => {
    
    // Initialize variables to hold user details
    let userName = "";
    let userID = "";
    let companyUrl = "";
    let userEmail = "";

    console.log(req.headers.authorization)
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer")) {
        console.log("error: Authorization header missing or malformed");
        errorLogger.log("error", `Token ${req.headers.authorization} is un-authorized as authorization header missing or malformed for api createFmsQuestionare`);
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const token = authHeader.split(" ")[1];
      infoLogger.log("info", `token ${token} is verified successfuly for the api createFmsQuestionare`);
      console.log('token fetched is ' , token)

    try {
        // Fetch user details and company details based on the token
        const response = await axios.post(process.env.MAIN_BE_URL, { token: token });
        console.log('Fetched User Details and Company Details', response.data);
        userName = response.data.emp_name;
        userID = response.data.user_id;
        companyUrl = response.data.verify_company_url;
        userEmail = response.data.email_id;
        infoLogger.log("info", `${JSON.stringify(response.data)} logged in autopilot fms`)
    } catch (error) {
        console.error('Error posting data:', error);
        errorLogger.log("error",`Failed to fetch user details due to ${error.message}`)
        return res.status(500).send({ error: 'Error fetching user details', status: 500 });
       
    }
    
    try {

        // Connect to MongoDB and perform operations
        const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
        console.log('Connected to database');
        const db = client.db(companyUrl);
        const collection = db.collection('fmsMaster');
        infoLogger.log("info", `${userName} from company ${companyUrl}  hit the api createFmsQuestionare`)

        //const filter = { fmsName : req.body.fmsName };
        const filter = { fmsMasterId : req.body.fmsMasterId };
        const update = { $set: { fmsQuestionare : req.body.fmsQuestionare } };
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
        "message" : `${req.body.fmsName} FMS Questionare is Successfully Added`,
        "status" : 200
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
initialiseFms.post('/createFmsSteps' , async (req, res) => {
    console.log('inside /createFmsSteps')
    console.log(req.body)

    // Initialize variables to hold user details
    let userName = "";
    let userID = "";
    let companyUrl = "";
    let userEmail = "";

    console.log(req.headers.authorization)
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer")) {
        console.log("error: Authorization header missing or malformed");
        errorLogger.log("error", `Token ${req.headers.authorization} is un-authorized as authorization header missing or malformed for api createFmsSteps`);
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const token = authHeader.split(" ")[1];
      infoLogger.log("info", `token ${token} is verified successfuly for the api createFmsSteps`);
      console.log('token fetched is ' , token)

    try {
        // Fetch user details and company details based on the token
        const response = await axios.post(process.env.MAIN_BE_URL, { token: token });
        console.log('Fetched User Details and Company Details', response.data);
        userName = response.data.emp_name;
        userID = response.data.user_id;
        companyUrl = response.data.verify_company_url;
        userEmail = response.data.email_id;
        infoLogger.log("info", `${JSON.stringify(response.data)} logged in autopilot fms`)
        
    } catch (error) {
        console.error('Error posting data:', error);
        errorLogger.log("error",`Failed to fetch user details due to ${error.message}`)
        return res.status(500).send({ error: 'Error fetching user details', status: 500 });
        
    }

    try {

        // Connect to MongoDB and perform operations
        const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
        console.log('Connected to database');
        const db = client.db(companyUrl);
        const collection = db.collection('fmsMaster');
        infoLogger.log("info", `${userName} from company ${companyUrl}  hit the api createFmsSteps`)
        //const filter = { fmsName : req.body.fmsName };
        const filter = { fmsMasterId : req.body.fmsMasterId };
    const update = { $set: { fmsSteps : req.body.fmsSteps  } };
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
        "message" : `${req.body.fmsName} FMS Steps is Successfully Added`,
        "status" : 200
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

//API Edit and Store Decision Details
initialiseFms.post('/editStoreDecisionDetails' , async (req, res) => {
  console.log('------------INSIDE EDIT DECISION DETAILS -------------------')
  console.log('------------INSIDE EDIT DECISION DETAILS -------------------')
  console.log('------------INSIDE EDIT DECISION DETAILS -------------------')
  console.log(req.body)

  // Initialize variables to hold user details
  let userName = "";
  let userID = "";
  let companyUrl = "";
  let userEmail = "";

  console.log(req.headers.authorization)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer")) {
      errorLogger.log("error", `Token ${req.headers.authorization} is un-authorized as authorization header missing or malformed for api makeFmsLive`);
      console.log("error: Authorization header missing or malformed");
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(" ")[1];
    infoLogger.log("info", `token ${token} is verified successfuly for the api makeFmsLive`);
    console.log('token fetched is ' , token)

  // try {
  //     // Fetch user details and company details based on the token
  //     const response = await axios.post(process.env.MAIN_BE_URL, { token: token });
  //     console.log('Fetched User Details and Company Details', response.data);
  //     userName = response.data.emp_name;
  //     userID = response.data.user_id;
  //     companyUrl = response.data.verify_company_url;
  //     userEmail = response.data.email_id;  
  //     infoLogger.log("info", `${JSON.stringify(response.data)} logged in autopilot fms`)
  // } catch (error) {
  //     console.error('Error posting data:', error);
  //     errorLogger.log("error",`Failed to fetch user details due to ${error.message}`)
  //     return res.status(500).send({ error: 'Error fetching user details', status: 500 });
     
  // }

  // try {

  //     // Connect to MongoDB and perform operations
  //     const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
  //     console.log('Connected to database');
  //     const db = client.db(companyUrl);
  //     const collection = db.collection('fmsMaster');
  //     infoLogger.log("info", `${userName} from company ${companyUrl}  hit the api makeFmsLive`)
  //     //const filter = { fmsName : req.body.fmsName };
  //     const filter = { fmsMasterId : req.body.fmsMasterId };
  // const update = { $set: { fmsLive : req.body.fmsLive } };   //fmsLive means that fms is active
  // const options = { upsert: true };
  
  // const result = await collection.updateOne(filter, update, options);
  
  // if (result.upsertedCount === 1) {
  //   console.log('Document inserted');
  // } else if (result.modifiedCount === 1) {
  //   console.log('Document updated');
  // } else {
  //   console.log('No changes made to the document');
  // }

  // console.log(result)
  // infoLogger.log("info", `FMS id:${req.body.fmsMasterId} is set to live by ${userName}`)
  // res.json({
  //     "message" : `${req.body.fmsName} FMS Steps is Successfully Added`,
  //     "status" : 200
  // })

  // // Close the MongoDB connection
  // await client.close();
  // console.log('MongoDB connection closed');

  // }
  // catch (error) {
  //     console.error('Error Connecting to MongoDB', error);
  //     errorLogger.log("error", `${userName} failed to make fms live due to ${error.message}`);
  //     return res.status(500).send({ error: error.message, status: 500 });
  // }

  res.json({
    "message" : `${req.body.fmsName}  - Decision Details Successfully Added`,
    "status" : 200
})

  
})


//API to make FMS Live 
initialiseFms.post('/makeFmsLive' , async (req, res) => {

    // Initialize variables to hold user details
    let userName = "";
    let userID = "";
    let companyUrl = "";
    let userEmail = "";

    console.log(req.headers.authorization)
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer")) {
        errorLogger.log("error", `Token ${req.headers.authorization} is un-authorized as authorization header missing or malformed for api makeFmsLive`);
        console.log("error: Authorization header missing or malformed");
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const token = authHeader.split(" ")[1];
      infoLogger.log("info", `token ${token} is verified successfuly for the api makeFmsLive`);
      console.log('token fetched is ' , token)

    try {
        // Fetch user details and company details based on the token
        const response = await axios.post(process.env.MAIN_BE_URL, { token: token });
        console.log('Fetched User Details and Company Details', response.data);
        userName = response.data.emp_name;
        userID = response.data.user_id;
        companyUrl = response.data.verify_company_url;
        userEmail = response.data.email_id;  
        infoLogger.log("info", `${JSON.stringify(response.data)} logged in autopilot fms`)
    } catch (error) {
        console.error('Error posting data:', error);
        errorLogger.log("error",`Failed to fetch user details due to ${error.message}`)
        return res.status(500).send({ error: 'Error fetching user details', status: 500 });
       
    }

    try {

        // Connect to MongoDB and perform operations
        const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
        console.log('Connected to database');
        const db = client.db(companyUrl);
        const collection = db.collection('fmsMaster');
        infoLogger.log("info", `${userName} from company ${companyUrl}  hit the api makeFmsLive`)
        //const filter = { fmsName : req.body.fmsName };
        const filter = { fmsMasterId : req.body.fmsMasterId };
    const update = { $set: { fmsLive : req.body.fmsLive } };   //fmsLive means that fms is active
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
        "message" : `${req.body.fmsName} FMS Steps is Successfully Added`,
        "status" : 200
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

//API to make FMS Live 
initialiseFms.post('/addStepNamesInitial' , async (req, res) => {

  console.log('---/addStepNamesInitial------------')
  console.log('---/addStepNamesInitial------------')
  console.log('---/addStepNamesInitial------------')
  console.log(req.body)

 // Initialize variables to hold user details
 let userName = "";
 let userID = "";
 let companyUrl = "";
 let userEmail = "";

 //console.log(req.headers.authorization)
 //console.log("req.headers.authorization" , req.headers.authorization)
   const authHeader = req.headers.authorization;
   if (!authHeader || !authHeader.startsWith("Bearer")) {
     errorLogger.log("error", `Token ${req.headers.authorization} is un-authorized as authorization header missing or malformed for api makeFmsLive`);
     //console.log("error: Authorization header missing or malformed");
     return res.status(401).json({ error: 'Unauthorized' });
   }
   const token = authHeader.split(" ")[1];
   //infoLogger.log("info", `token ${token} is verified successfuly for the api makeFmsLive`);
   //console.log('token fetched is ' , token)

 try {
     // Fetch user details and company details based on the token
     const response = await axios.post(process.env.MAIN_BE_URL, { token: token });
     console.log('Fetched User Details and Company Details', response.data);
     userName = response.data.emp_name;
     userID = response.data.user_id;
     companyUrl = response.data.verify_company_url;
     userEmail = response.data.email_id;  
     //infoLogger.log("info", `${JSON.stringify(response.data)} logged in autopilot fms`)
 } catch (error) {
     //console.error('Error posting data:', error);
     errorLogger.log("error",`Failed to fetch user details due to ${error.message}`)
     return res.status(500).send({ error: 'Error fetching user details', status: 500 });
    
 }

 //add initial Steps
  try {
    // Connect to MongoDB and perform operations
    const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
    console.log('Connected to database');
    const db = client.db(companyUrl);
    const collection = db.collection('fmsMaster');
    //infoLogger.log("info", `${userName} from company ${companyUrl}  hit the api makeFmsLive`)
    //const filter = { fmsName : req.body.fmsName };

    ////
    // Prepare the update object using a for loop instead of forEach
    // const updates = {};
    // for (let i = 0; i < req.body.fmsSteps.length; i++) {
    //     updates[`steps.${i}.id`] = stepIds[i+1];
    //     updates[`steps.${i}.content`] = fmsSteps[i]; // Assuming each step has a content field
    
    function accepTheStepWhats(array) {
     // Check if the input is an array
      if (!Array.isArray(array)) {
        throw new Error("Input must be an array");
      }
      // Initialize an empty array to hold the converted objects
      let result = [];
      // Iterate over each element in the array
      array.forEach((element, index) => {
        // Create an object for each element
        const obj = {
          what: element,
          id: index + 1, // Consecutive ID starting from 1
        };

        // Add the object to the result array
        result.push(obj);
      });
      return result;
    }
    // }
    let inputWhats = req.body.fmsSteps
    let StepWhatandId = accepTheStepWhats(inputWhats)




    const filter = { fmsMasterId: req.body.fmsMasterId };
    const update = { $set: { fmsWhats: StepWhatandId } };   //fmsLive means that fms is active
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
      "message": `${req.body.fmsName} FMS Initial Steps is Successfully Added`,
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
