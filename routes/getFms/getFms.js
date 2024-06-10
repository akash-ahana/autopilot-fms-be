const express = require("express");
const getFms = express.Router();
var MongoClient = require('mongodb').MongoClient;
const axios = require('axios');

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
        return res.status(500).json({ error: error.message });
    }

    try {

        // Connect to MongoDB and perform operations
        const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
        console.log('Connected to database');
        const db = client.db(companyUrl);
        const collection = db.collection('fmsMaster');

        // Fething data into from the  collection
        //const query = { fmsName: req.body.fmsName };
        const query = { fmsMasterId : req.body.fmsMasterId };
        const document = await collection.findOne(query);

        console.log(document)
        res.json({
            "message" : document,
            "status" : 200
        })

    } catch (error) {
        console.error('Error Connecting to MongoDB', error);
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
        return res.status(500).json({ error: error.message });
    }

    try {
        // Connect to MongoDB and perform operations
        const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
        console.log('Connected to database');
        const db = client.db(companyUrl);
        const collection = db.collection('fmsMaster');

        const cursor = collection.find();
        const documents = await cursor.toArray();

        console.log(documents)
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
        return res.status(500).json({ error: error.message });
    }

    try {

        // Connect to MongoDB and perform operations
        const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
        console.log('Connected to database');
        const db = client.db(companyUrl);
        const collection = db.collection('fmsMaster');

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
        res.json({
            "message" : documents,
            "status" : 200
        })

        // Close the MongoDB connection
        await client.close();
        console.log('MongoDB connection closed');



    } catch (error) {
        console.error('Error Connecting to MongoDB', error);
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
        return res.status(500).json({ error: error.message });;
    }

    try {
        // Connect to MongoDB and perform operations
        const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
        console.log('Connected to database');
        const db = client.db(companyUrl);
        const collection = db.collection('fmsMaster');

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
        return res.status(500).json({ error: error.message });
    }
})


//make an api where if I pass you fmsmasterid & stepid, can you give me list of NEXT stepids and what has to be done in an array
getFms.post('/findNextStepsDetails' , async (req, res) => {
  console.log(' inside /findNextStepsDetails')
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
       return res.status(500).json({ error: error.message });;
   }

   try {
       // Connect to MongoDB and perform operations
       const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
       console.log('Connected to database');
       const db = client.db(companyUrl);
       const collection = db.collection('fmsMaster');

       const cursor = collection.find({fmsMasterId : req.body.fmsMasterId});
       const documents = await cursor.toArray();
       const document = documents[0]

       function fetchNextSteps(fmsSteps, currentStepId) {
        let nextSteps = [];
        for (let i = 0; i < fmsSteps.length; i++) {
          if (fmsSteps[i].id === currentStepId) {
            for (let j = i + 1; j < fmsSteps.length; j++) {
              nextSteps.push(fmsSteps[j]);
            }
            break; // Exit the loop once we've found the current step
          }
        }
        return nextSteps;
      }
         

         const nextSteps = fetchNextSteps(document.fmsSteps, req.body.stepId);
         
         console.log(nextSteps);

       console.log(document)
       res.json({
           "message" : nextSteps,
           "status" : 200
       })

       // Close the MongoDB connection
       await client.close();
       console.log('MongoDB connection closed');
   } 
   catch (error) {
       console.error('Error Connecting to MongoDB', error);
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
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(" ")[1];

    //console.log('token fetched is ' , token)

    try {
      // Fetch user details and company details based on the token
      const response = await axios.post(process.env.MAIN_BE_URL, { token: token });
      //console.log('Fetched User Details and Company Details', response.data);
      userName = response.data.emp_name;
      userID = response.data.user_id;
      companyUrl = response.data.verify_company_url;
      userEmail = response.data.email_id;
  } catch (error) {
      //console.error('Error posting data:', error);
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

    // Fething data into from the  collection
    const query = { fmsMasterId: req.body.fmsMasterId };
    fmsMasterDocument = await collection.findOne(query);

    //console.log(fmsMasterDocument)
} catch (error) {
    console.error('Error Connecting to MongoDB', error);
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

  //console.log(fmsflows)
} catch (error) {
  console.error('Error Connecting to MongoDB', error);
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
        
    
        //console.log(allTasksForOneFlow)
    } catch (error) {
        console.error('Error Connecting to MongoDB', error);
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