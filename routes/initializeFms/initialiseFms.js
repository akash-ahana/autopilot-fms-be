const express = require("express");
const initialiseFms = express.Router();
var MongoClient = require('mongodb').MongoClient;
const axios = require('axios');
const moment = require('moment-timezone');

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
        const collection = db.collection('fmsMaster');

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
        res.status(500).send({ message: ` Step 1 is NOT Created`, status: 500 });
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
      const collection = db.collection('fmsMaster');

      
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
      res.status(500).send({ message: ` Step 1 is NOT Edited`, status: 500 });
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
                const collection = db.collection('fmsMaster');

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
                res.status(500).send({ message: `${req.body.fmsName} Step 1 is NOT Added`, status: 500 });
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
        const collection = db.collection('fmsMaster');

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
        res.status(500).send({ message: `${req.body.fmsName} FMS Questionare is Not Added`, status: 500 });
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
        const collection = db.collection('fmsMaster');

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
        res.status(500).send({ message: `${req.body.fmsName} FMS Steps is NOT  Added`, status: 500 });
    }

    
})


//CREATE FMS Steps
initialiseFms.post('/makeFmsLive' , async (req, res) => {

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
        const collection = db.collection('fmsMaster');

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
        res.status(500).send({ message: `${req.body.fmsName} FMS Steps is NOT  Added`, status: 500 });
    }

    
})




module.exports = initialiseFms;
