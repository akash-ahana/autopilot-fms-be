const express = require("express");
const getFms = express.Router();
var MongoClient = require('mongodb').MongoClient;
const axios = require('axios');
const { infoLogger, errorLogger } = require("../../middleware/logger");


//find  Single FMS using FMS Name
getFms.post('/findSingleFms' , async (req, res) => {
    
    // Initialize variables to hold user details
    let userName = "";
    let userID = "";
    let companyUrl = "";
    let userEmail = "";

    console.log(req.headers.authorization)
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer")) {
        console.log("error: Authorization header missing or malformed");
        errorLogger.log("error", `Token ${req.headers.authorization} is un-authorized as authorization header missing or malformed for api findSingleFms`);
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const token = authHeader.split(" ")[1];
      infoLogger.log("info", `token ${token} is verified successfuly for the api findSingleFms`);
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
        return res.status(500).json({ error: error.message });
    }

    try {

        // Connect to MongoDB and perform operations
        const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
        console.log('Connected to database');
        const db = client.db(companyUrl);
        const collection = db.collection('fmsMaster');
        infoLogger.log("info", `${userName} from company ${companyUrl} hit the api findSingleFms`)

        // Fething data into from the  collection
        //const query = { fmsName: req.body.fmsName };
        const query = { fmsMasterId : req.body.fmsMasterId };
        const document = await collection.findOne(query);

        console.log(document)
        infoLogger.log("info", `${userName} successfully fetch the single fms task:${JSON.stringify(document)}`)
        res.json({
            "message" : document,
            "status" : 200
        })

    } catch (error) {
        console.error('Error Connecting to MongoDB', error);
        errorLogger.log("error" , `${userName} failed to fetch the single fms task due to ${error.message}`);
        return res.status(500).json({ error: error.message });    }
})

//find ALL FMS 
getFms.get('/findAllFms' , async (req, res) => {
   
    // Initialize variables to hold user details
    let userName = "";
    let userID = "";
    let companyUrl = "";
    let userEmail = "";

    console.log(req.headers.authorization)
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer")) {
        console.log("error: Authorization header missing or malformed");
        errorLogger.log("error", `Token ${req.headers.authorization} is un-authorized as authorization header missing or malformed for api findAllFms`);
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const token = authHeader.split(" ")[1];
      infoLogger.log("info", `token ${token} is verified successfuly for the api findAllFms`);
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
        return res.status(500).json({ error: error.message });
    }

    try {
        // Connect to MongoDB and perform operations
        const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
        console.log('Connected to database');
        const db = client.db(companyUrl);
        const collection = db.collection('fmsMaster');
        infoLogger.log("info", `${userName} from company ${companyUrl} hit the api findAllFms`)

        const cursor = collection.find();
        const documents = await cursor.toArray();

        console.log(documents)
        infoLogger.log("info", `${userName} successfully fetch all fms tasks:${JSON.stringify(documents)}`)
        res.json({
            "message" : [documents],
            "status" : 200
        })

        // Close the MongoDB connection
        await client.close();
        console.log('MongoDB connection closed');
    } 
    catch (error) {
        console.error('Error Connecting to MongoDB', error);
        errorLogger.log("error" , `${userName} failed to fetch all fms tasks due to ${error.message}`);
        return res.status(500).json({ error: error.message });    }
})

//find all fms and their forms the user has access to 
getFms.get('/findFmsQuestionaresForUser' , async (req, res) => {
    // Initialize variables to hold user details
    let userName = "";
    let userID = "";
    let companyUrl = "";
    let userEmail = "";

    console.log(req.headers.authorization)
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer")) {
        console.log("error: Authorization header missing or malformed");
        errorLogger.log("error", `Token ${req.headers.authorization} is un-authorized as authorization header missing or malformed for api findFmsQuestionaresForUser`);
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const token = authHeader.split(" ")[1];
      infoLogger.log("info", `token ${token} is verified successfuly for the api findFmsQuestionaresForUser`);
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
        return res.status(500).json({ error: error.message });
    }

    try {

        // Connect to MongoDB and perform operations
        const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
        console.log('Connected to database');
        const db = client.db(companyUrl);
        const collection = db.collection('fmsMaster');
        infoLogger.log("info", `${userName} from company ${companyUrl} hit the api findFmsQuestionaresForUser`)

        // Fething data into from the  collection
        //const namesArray = userNameArray.map(obj => obj.name);
        //const query = { fmsAccess : { $in: [userName] } };
        const query = {
            fmsAccess: {
              $elemMatch: {
                name: userName
              }
            }
          };
        //const document = await collection.findOne(query);
        const cursor = collection.find(query);
        const documents = await cursor.toArray();

        console.log(documents)
        infoLogger.log("info", `${userName} successfully fetch fms questionares:${JSON.stringify(documents)}`)
        res.json({
            "message" : documents,
            "status" : 200
        })

        // Close the MongoDB connection
        await client.close();
        console.log('MongoDB connection closed');



    } catch (error) {
        console.error('Error Connecting to MongoDB', error);
        errorLogger.log("error" , `${userName} failed to fetch fms questionares due to ${error.message}`);
        return res.status(500).json({ error: error.message });
    }

    

})









//make an api where if I pass you fmsmasterid & stepid, can you give me list of previous stepids and what has to be done in an array
getFms.post('/findPreviousStepsDetails' , async (req, res) => {
   console.log(' inside /findPreviousStepsDetails')
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
        errorLogger.log("error", `Token ${req.headers.authorization} is un-authorized as authorization header missing or malformed for api findPreviousStepsDetails`);
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const token = authHeader.split(" ")[1];
      infoLogger.log("info", `token ${token} is verified successfuly for the api findPreviousStepsDetails`);
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
        return res.status(500).json({ error: error.message });;
    }

    try {
        // Connect to MongoDB and perform operations
        const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
        console.log('Connected to database');
        const db = client.db(companyUrl);
        const collection = db.collection('fmsMaster');
        infoLogger.log("info", `${userName} from company ${companyUrl} hit the api findPreviousStepsDetails`)

        const cursor = collection.find({fmsMasterId : req.body.fmsMasterId});
        const documents = await cursor.toArray();
        const document = documents[0]

        function fetchPreviousSteps(fmsSteps, currentStepId) {
            let previousSteps = [];
            for (let i = 0; i < fmsSteps.length; i++) {
              if (fmsSteps[i].id === currentStepId) {
                // Stop one step earlier to exclude the current step
                for (let j = 0; j < i; j++) {
                  previousSteps.push(fmsSteps[j]);
                }
                break; // Exit the loop once we've found the current step
              }
            }
            return previousSteps;
          }
          

          const previousSteps = fetchPreviousSteps(document.fmsSteps, req.body.stepId);
          
          console.log(previousSteps);

        console.log(document)
        infoLogger.log("info", `${userName} successfully fetch previous step details:${JSON.stringify(previousSteps)}`)

        res.json({
            "message" : previousSteps,
            "status" : 200
        })

        // Close the MongoDB connection
        await client.close();
        console.log('MongoDB connection closed');
    } 
    catch (error) {
        console.error('Error Connecting to MongoDB', error);
        errorLogger.log("error" , `${userName} failed to fetch previous step details due to ${error.message}`);
        return res.status(500).json({ error: error.message });
    }
})




//new ---------------------------------------------------------------------------------------------------
//find  Single FMS all QA and all tasks for that QA
getFms.post('/findAllDetailsForOneMasterFmstest' , async (req, res) => {
  console.log('inside findAllDetailsForOneMasterFmstest')
    
  // Initialize variables to hold user details
  let userName = "";
  let userID = "";
  let companyUrl = "";
  let userEmail = "";

  //console.log(req.headers.authorization)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer")) {
      console.log("error: Authorization header missing or malformed");
      errorLogger.log("error", `Token ${req.headers.authorization} is un-authorized as authorization header missing or malformed for api findAllDetailsForOneMasterFmstest`);
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(" ")[1];
    infoLogger.log("info", `Token ${token} is verified successfuly for the api findAllDetailsForOneMasterFmstest`);

    //console.log('token fetched is ' , token)

    try {
      // Fetch user details and company details based on the token
      const response = await axios.post(process.env.MAIN_BE_URL, { token: token });
      //console.log('Fetched User Details and Company Details', response.data);
      userName = response.data.emp_name;
      userID = response.data.user_id;
      companyUrl = response.data.verify_company_url;
      userEmail = response.data.email_id;
      infoLogger.log("info", `${JSON.stringify(response.data)} logged in autopilot fms`)

  } catch (error) {
      //console.error('Error posting data:', error);
      errorLogger.log("error",`Failed to fetch user details due to ${error.message}`)
      return res.status(500).json({ error: error.message });
  }

  //find the requested FMS
  // let requestedFms;
  // try {
  //     // Connect to MongoDB and perform operations
  //     const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
  //     //console.log('Connected to database');
  //     const db = client.db(companyUrl);
  //     const collection = db.collection('fmsMaster');

  //     // Fething data into from the  collection
  //     const query = { fmsMasterId: req.body.fmsMasterId };
  //     requestedFms = await collection.findOne(query);

  //     //console.log('Requested Fms' , requestedFms)
  //     console.log(requestedFms)
      

  // } catch (error) {
  //     //console.error('Error Connecting to MongoDB', error);
  //     res.status(500).send({ error: `${req.body.fmsName}  NOT found`, status: 500 });
  // }

  //find the masterfms document that is requested
  let fmsMasterDocument;
  try {
    // Connect to MongoDB and perform operations
    const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
    console.log('Connected to database');
    const db = client.db(companyUrl);
    const collection = db.collection('fmsMaster');
    infoLogger.log("info", `${userName} from company ${companyUrl} hit the api findAllDetailsForOneMasterFmstest`)

    // Fething data into from the  collection
    const query = { fmsMasterId: req.body.fmsMasterId };
    fmsMasterDocument = await collection.findOne(query);
    infoLogger.log("info", `${userName} successfully fetch fms master document:${JSON.stringify(fmsMasterDocument)}`)

    //console.log(fmsMasterDocument)
} catch (error) {
    console.error('Error Connecting to MongoDB', error);
    errorLogger.log("error" , `${userName} failed to fetch  fms master document due to ${error.message}`);
    return res.status(500).json({ error: error.message });
}

//find all fmsQA's(fmsQAid) - (all flows for that fms) for the single fms that is requested
let fmsflows;
try {
  // Connect to MongoDB and perform operations
  const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
  console.log('Connected to database');
  const db = client.db(companyUrl);
  const collection = db.collection('fms');

  const cursor = collection.find({ fmsMasterId: req.body.fmsMasterId });
  fmsflows = await cursor.toArray();
  infoLogger.log("info", `${userName} successfully fetch fms flows:${JSON.stringify(fmsflows)}`)

  //console.log(fmsflows)
} catch (error) {
  console.error('Error Connecting to MongoDB', error);
  errorLogger.log("error" , `${userName} failed to fetch fms flows due to ${error.message}`);
  return res.status(500).json({ error: error.message });
}


//////////////////////////////////////////////////////////////////////////////
// let StepsTaskObject = {
//   fmsStep : null, 
//   allTasksForOneStep : null
// }
let allStepsTasks = []

console.log(fmsMasterDocument.fmsSteps.length)
for(let i = 1; i<=fmsMasterDocument.fmsSteps.length;i++) {
  let allTasksForOneFlowForStep;
        try {
        // Connect to MongoDB and perform operations
        const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
        console.log('Connected to database');
        const db = client.db(companyUrl);
        const collection = db.collection('fmsTasks');
        
        console.log('query' , req.body.fmsMasterId , i)
        const cursor = collection.find({fmsMasterId : req.body.fmsMasterId ,stepId:i});
        allTasksForOneFlowForStep = await cursor.toArray();

        console.log('allTasksForOneFlowForStep', i  , allTasksForOneFlowForStep)

  //   StepsTaskObject = {
  //     fmsStep : fmsMasterDocument.fmsSteps[i], 
  //     allTasksForOneStep : allTasksForOneFlowForStep
  // }

    allStepsTasks.push(allTasksForOneFlowForStep)
    infoLogger.log("info", `${userName} successfully fetch all steps task:${JSON.stringify(allStepsTasks)}`)
  
    
        //console.log(allTasksForOneFlow)
    } catch (error) {
        console.error('Error Connecting to MongoDB', error);
        errorLogger.log("error" , `${userName} failed to fetch all steps task due to ${error.message}`);
        return res.status(500).json({ error: error.message });
    }
}


//let allSteps = fmsMasterDocument.fmsSteps.push({ stepTasks : allStepsTasks});
  res.json({
      "message" : {
          masterFMS : fmsMasterDocument,
          allFlows : fmsflows, 
          allSteps: allStepsTasks,
          
      },
      "status" : 200
  })
 
})



module.exports = getFms;