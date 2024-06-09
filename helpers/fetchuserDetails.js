const axios = require('axios');
const { infoLogger, errorLogger } = require("../middleware/logger");

async function fetchUserDetails(authHeader) {

     // Initialize variables to hold user details
     let userName = "";
     let userID = "";
     let companyUrl = "";
     let userEmail = "";

    console.log('Iniside the Get User Details Function')
    console.log(authHeader)
      //const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer")) {
        console.log("error: Authorization header missing or malformed");
        errorLogger.log("error", `Token ${req.headers.authorization} is un-authorized as authorization header missing or malformed for api fmsStep1`);
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const token = authHeader.split(" ")[1];
      //infoLogger.log("info", `token ${token} is verified successfuly for the api fmsStep1`);
      console.log('token fetched is ' , token)


        const instance = axios.create({
          httpsAgent: new (require('https').Agent)({
            rejectUnauthorized: false
          })
        });
        const response = await instance.post(process.env.MAIN_BE_URL, { token: token })
        .then(response => {
        //console.log('Fetched User Details and Company Details', response.data);
        userName = response.data.emp_name;
        userID = response.data.user_id;
        companyUrl = response.data.verify_company_url;
        userEmail = response.data.email_id;
        })
        .catch(error => {
         console.error('Error:', error);
        });
        console.log("userName" , userName)
        console.log("userID" , userID)
        console.log("companyUrl" , companyUrl)
        console.log("userEmail" , userEmail)
        
        let userDetails = {
            userName : userName,
            userID : userID,
            companyUrl : companyUrl,
            userEmail : userEmail
        }

        return userDetails;
  }
  
  module.exports = { fetchUserDetails }; 