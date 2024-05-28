const express = require("express");
const submitFmsQuestionare = express.Router();
var MongoClient = require('mongodb').MongoClient;
const axios = require('axios');
//const moment = require('moment-timezone');
const { CurrentIST, addHrs, addDays , addDaysToADate , formatDateFromDateObjectToString,   getCurrentDateInIST } = require('../helpers/convertGMTtoIST');
const moment = require('moment');



//currentTime - is the questionare submitted Time
//timeIst - time in hrs "duration" - fmsSteps.Duration
//Function To Clcuate Planned Completion Time
// function calculatePlannedCompletionTime(currentTimeIST, duration, shiftStartTime, shiftEndTime, holidayNonWorkingDays) {
    
//     console.log('Recieved currentTimeIST in the function' , currentTimeIST)
//     console.log('Recieved duration in the function' , duration)
//     console.log('Recieved shiftStartTime in the function' , shiftStartTime)
//     console.log('Recieved shiftEndTime in the function' , shiftEndTime)
//     console.log('Recieved nonWorkingDays in the function' , holidayNonWorkingDays)
//     let endTime = new Date(currentTimeIST);
//     let hoursToAdd = duration;

//     const shiftStart = new Date(currentTimeIST);
//     shiftStart.setHours(...shiftStartTime.split(':'), 0, 0);

//     const shiftEnd = new Date(currentTimeIST);
//     shiftEnd.setHours(...shiftEndTime.split(':'), 0, 0);

//     while (hoursToAdd > 0) {
//         // If current time is before shift start, set current time to shift start
//         if (endTime < shiftStart) {
//             endTime = shiftStart;
//         }

//         // If adding hours exceeds the shift end, calculate remaining hours for the next day
//         if (endTime.getTime() + hoursToAdd * 60 * 60 * 1000 > shiftEnd.getTime()) {
//             const remainingHours = (shiftEnd.getTime() - endTime.getTime()) / (60 * 60 * 1000);
//             hoursToAdd -= remainingHours;
//             endTime.setDate(endTime.getDate() + 1); // Move to the next day

//             // Check if the next date is a holiday or non-working day
//             while (holidayNonWorkingDays.includes(formatDate(endTime))) {
//                 endTime.setDate(endTime.getDate() + 1); // Move to the next day
//             }

//             endTime.setHours(...shiftStartTime.split(':'), 0, 0); // Set start time to shift start of the next day
//         }
//         else {
//             endTime = new Date(endTime.getTime() + hoursToAdd * 60 * 60 * 1000);
//             hoursToAdd = 0;
//         }
//     }

//     return endTime;
// }

// // Format date as 'YYYY-MM-DD'
// function formatDate(date) {    
//     return date.toISOString().split('T')[0];
// }






submitFmsQuestionare.post('/submitFmsUserQAcreateTaskStep1', async (req, res) => {
    console.log("inside fms fmsUserQA create task for step 1")
    

    // Initialize variables to hold user details
    let userName = "";
    let userID = "";
    let companyUrl = "";
    let userEmail = "";

    //console.log(req.headers.authorization)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer")) {
        //console.log("error: Authorization header missing or malformed");
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(" ")[1];

    //console.log('token fetched is ', token)

    try {
        // Fetch user details and company details based on the token
        const response = await axios.post(process.env.MAIN_BE_URL, { token: token });
        //console.log('Fetched User Details and Company Details', response.data);
        userName = response.data.emp_name;
        userID = response.data.user_id;
        companyUrl = response.data.verify_company_url;
        userEmail = response.data.email_id;
    } catch (error) {
        console.error('Error posting data:', error);
        res.status(500).send({ message: 'Error fetching user details', status: 500 });
        return;
    }


    ///////////////////////////////////////////try catch block to submit QA
    let fmsQAId;
    try {

        // Connect to MongoDB and perform operations
        const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
        console.log('Connected to database');
        const db = client.db(companyUrl);
        const collection = db.collection('fms');

        // Find the last inserted document and get its incremental value
        const lastDocument = await collection.find().sort({ _id: -1 }).limit(1).toArray();
        fmsQAId = 1;

        if (lastDocument.length > 0) {
            fmsQAId = lastDocument[0].fmsQAId + 1;
        }

        // Inserting data into the collection
        const result = await collection.insertOne({
            fmsQAId,
            fmsQACreatedBy: { userID: userID, userEmail: userEmail, userName: userName },
            fmsMasterId: req.body.fmsMasterID,
            fmsName: req.body.fmsName,
            fmsQA: req.body.fmsQA,
            fmsQAisLive : true

        });
        console.log('Submitted the QA');
        // Close the MongoDB connection
        await client.close();
        //console.log('MongoDB connection closed');

    } catch (error) {
        console.error('Error posting data:', error);
        res.status(500).send({ message: 'Error Submitting QA', status: 500 });
        return;
    }

    //try catch block to increment the live fms no
    try {

        // Connect to MongoDB and perform operations
        const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
        console.log('Connected to database');
        const db = client.db(companyUrl);
        const collection = db.collection('fmsMaster');

        // Find the document and increment the noofFmsLive field
        const result = await collection.findOneAndUpdate(
            { fmsMasterId: req.body.fmsMasterID }, // Filter based on fmsMasterId
            { $inc: { noOfLive: 1 } }, // Update operation
            { returnOriginal: false } // Options (returnOriginal: false means return the modified document)
        );

        console.log(result);

        // Close the MongoDB connection
        await client.close();
        console.log('MongoDB connection closed');

    } catch (error) {
        console.error('Error posting data:', error);
        res.status(500).send({ message: 'Error Submitting QA', status: 500 });
        return;
    }

    console.log('QA is submitted and fmsMaster is also incremented')


    //////////////////////////////////try catch block to find all the detials required for Task Creation 
    let employee;
    let processId;
    let plannedDate;
    let what;
    let how;
    let stepId;
    let stepType;
    let duration;
    let durationType;  //either hrs or days
    let working;        //this is only for hrs --> values can only be "INSIDE" or "OUTSIDE"
    let isWhatsAppEnabled;
    let whatsappData;
    let formStepsAnswers;
    //let fmsTaskQualityDetails;

    //Here these below Four details are not required as we are only creating the first task , but while creating the step its added to their default values
    //let isTransferredFrom;   
    //let isTranferredTo;   
    //let transferredFromTaskId;
    //let transferredToTaskId;
    let fmsSteps;

    try {
        console.log('inside try block for fetching doer for step 1 from fmsMaster')
        // Connect to MongoDB and perform operations
        const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
        console.log('Connected to database');
        const db = client.db(companyUrl);
        const collection = db.collection('fmsMaster');

        // Find documents where fmsMasterId matches the given ID
        //const documents = await collection.find({ fmsMasterId }).toArray();

        const cursor = collection.find({ fmsMasterId: req.body.fmsMasterID });
        const documents = await cursor.toArray();


        // Check if documents were found
        if (!documents.length) {
            console.log('No documents found with the given fmsMasterId.');
            return;
        }

        // Extract the first document
        const document = documents[0];

        // Find the first object in the "who" array where "typeOfShift" is "All"
        const whoObject = document.fmsSteps.find(step => step.who.typeOfShift === 'All');

        // Check if the "who" object was found
        if (!whoObject) {
            console.log('No "who" object found with typeOfShift "All".');
            return;
        }

        // Extract the first employee's information from the "employees" array
        employee = whoObject.who.employees[0];
        processId = document.fmsProcess
        plannedDate = document.fmsSteps[0].plannedDate
        what = document.fmsSteps[0].what
        how = document.fmsSteps[0].how
        stepId = document.fmsSteps[0].id
        stepType = document.fmsSteps[0].stepType   //DOER OR QUALITY
        duration = document.fmsSteps[0].plannedDate.duration
        durationType = document.fmsSteps[0].plannedDate.durationType
        //fetch working only when durationType is hrs else set it to null
        if(durationType == "hrs") {
            working = document.fmsSteps[0].plannedDate.working
        } else {
            working = null
        }
        isWhatsAppEnabled = document.fmsSteps[0].isWhatsAppEnabled
        whatsappData = document.fmsSteps[0].whatsappData
        formStepsAnswers = document.fmsSteps[0].formStepsAnswers
        isTransferredFrom = document.
        fmsSteps = document.fmsSteps[0]


        console.log(`Process ID: ${document.fmsProcess}`);

        // Log the employee information
        console.log(employee);
        // Close the MongoDB connection
        await client.close();
        console.log('MongoDB connection closed');

    } catch (error) {
        console.error('Error posting data:', error);
        res.status(500).send({ message: 'Error Submitting QA', status: 500 });
        return;
    }



    /////////////////////////////////////creating the task for the user in fmsTasks collection
    let plannedCompletionTime;
    let plannedCompletionTimeIST
    try {

        //calculation of fmsTaskPlannedCompletionTime (start time - form submitted time, and tat in hrs or days)

        // Connect to MongoDB and perform operations
        const client = await MongoClient.connect(process.env.MONGO_DB_STRING);
        console.log('Connected to database');
        const db = client.db(companyUrl);
        const collection = db.collection('fmsTasks');

        // Find the last inserted document and get its incremental value
        const lastDocument = await collection.find().sort({ _id: -1 }).limit(1).toArray();
        let fmsTaskId = 1;

        if (lastDocument.length > 0) {
            fmsTaskId = lastDocument[0].fmsTaskId + 1;
        }

       
        //Calculate Fms Planned Completion Time
        if (durationType == "hrs") {
            if (working == "OUTSIDE") {
                plannedCompletionTime = addHrs(CurrentIST(), duration);
                plannedCompletionTimeIST = plannedCompletionTime;
            } else {
                try {
                    const response = await axios.post(process.env.MAIN_BE_WORKING_SHIFT_URL, { verify_company_url: companyUrl });
                    let shiftStartTimeStr = response.data.result[0].shiftStartTime;
                    let shiftEndTimeStr = response.data.result[0].shiftEndTime;

                    let shiftStartTime = new Date(moment.tz(shiftStartTimeStr, 'Asia/Kolkata').format());
                    let shiftEndTime = new Date(moment.tz(shiftEndTimeStr, 'Asia/Kolkata').format());

                    shiftStartTime.setHours(shiftStartTime.getHours() + 5);
                    shiftStartTime.setMinutes(shiftStartTime.getMinutes() + 30);

                    shiftEndTime.setHours(shiftEndTime.getHours() + 5);
                    shiftEndTime.setMinutes(shiftEndTime.getMinutes() + 30);

                    const currentDateTimeFinalString = moment().tz('Asia/Kolkata').format();
                    const currentDateTimeFinal = moment.tz(currentDateTimeFinalString, 'Asia/Kolkata').add(duration, 'hours').toDate();
                    currentDateTimeFinal.setHours(currentDateTimeFinal.getHours() + 5);
                    currentDateTimeFinal.setMinutes(currentDateTimeFinal.getMinutes() + 30);

                    console.log('Initial plannedCompletionTime:', currentDateTimeFinal);

                    const plannedTimeDate = currentDateTimeFinal;
                    const shiftEndTimeDate = new Date(shiftEndTime);

                    function calculateBalanceHours(plannedCompletionTime, shiftEndTime) {
                        if (plannedCompletionTime > shiftEndTime) {
                            let diffMillis = plannedCompletionTime.getTime() - shiftEndTime.getTime();
                            let hours = Math.floor(diffMillis / (1000 * 60 * 60));
                            let minutes = Math.floor((diffMillis % (1000 * 60 * 60)) / (1000 * 60));
                            let seconds = Math.floor(((diffMillis % (1000 * 60 * 60)) % (1000 * 60)) / 1000);

                            let overflowforThatDayIs = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

                            const nextDayStartTime = new Date(shiftStartTime);

                            let nextDayCompletionTime = plannedCompletionTime;

                            nextDayCompletionTime.setHours(nextDayStartTime.getHours());
                            nextDayCompletionTime.setMinutes(nextDayStartTime.getMinutes());
                            nextDayCompletionTime.setSeconds(nextDayStartTime.getSeconds());
                            nextDayCompletionTime.setDate(plannedCompletionTime.getDate() + 1);
                    
                            nextDayCompletionTime.setHours(nextDayCompletionTime.getHours() + hours);
                            nextDayCompletionTime.setMinutes(nextDayCompletionTime.getMinutes() + minutes);
                            nextDayCompletionTime.setSeconds(nextDayCompletionTime.getSeconds() + seconds);

                            ///////////////////////////////////////////////////

                            // plannedCompletionTime.setHours(nextDayStartTime.getHours() + hours);
                            // plannedCompletionTime.setMinutes(nextDayStartTime.getMinutes() + minutes);
                            // plannedCompletionTime.setSeconds(nextDayStartTime.getSeconds() + seconds);

                            console.log('Final planned completion time (before adding offset):', nextDayCompletionTime);

                            // plannedCompletionTime.setDate(plannedCompletionTime.getDate() + 1);

                            plannedCompletionTimeIST = moment(nextDayCompletionTime).tz('Asia/Kolkata');

                            // Subtract 5 hours and 30 minutes from plannedCompletionTimeIST
                            plannedCompletionTimeIST = plannedCompletionTimeIST.subtract(5, 'hours').subtract(30, 'minutes').format();

                            console.log('Final planned completion time (IST - 05:30):', plannedCompletionTimeIST);


                            return plannedCompletionTimeIST;
                        } else if (plannedCompletionTime < shiftEndTime) {
                            console.log("plannedTimeDate check here", plannedCompletionTime);
                            plannedCompletionTimeIST = plannedCompletionTime;
                            plannedCompletionTimeIST = moment(plannedCompletionTimeIST).tz('Asia/Kolkata');
                            plannedCompletionTimeIST = plannedCompletionTimeIST.subtract(5, 'hours').subtract(30, 'minutes').format();
                            console.log("plannedComplotiontimeIST check here", plannedCompletionTimeIST);
                            return plannedCompletionTimeIST;
                        }
                    }

                    let balanceTime = calculateBalanceHours(plannedTimeDate, shiftEndTimeDate);
                    console.log('Balance time:', balanceTime);


                    if (plannedTimeDate > shiftEndTime) {
                        // Perform holiday validation only if planned completion time exceeds shift end time
                        plannedCompletionTimeIST = await validateHolidayforHRS(plannedCompletionTimeIST);
                        console.log('Planned completion time after holiday validation:', plannedCompletionTimeIST);
                    }

                    // plannedCompletionTimeIST = await validateHolidayforHRS(plannedCompletionTimeIST);

                    // Here you can handle the case when balanceTime is not 0, if needed

                    plannedCompletionTime = plannedTimeDate;
                } catch (error) {
                    console.error('Error fetching working shift details:', error);
                    res.status(500).send({ message: 'Error fetching working shift details', status: 500 });
                    return;
                }
            }
        } else {

            const currentDateTimeFinalString = moment().tz('Asia/Kolkata').format();
            console.log("first step", currentDateTimeFinalString);
            const currentDateTimeFinal = moment.tz(currentDateTimeFinalString, 'Asia/Kolkata').toDate();

            console.log("currenDae", currentDateTimeFinal);
            currentDateTimeFinal.setHours(currentDateTimeFinal.getHours() + 5);
            currentDateTimeFinal.setMinutes(currentDateTimeFinal.getMinutes() + 30);

            console.log("date check", currentDateTimeFinal);
            plannedCompletionTime = currentDateTimeFinal;
            console.log("plannedCompletionTiem for days", plannedCompletionTime);
            plannedCompletionTime = await validateHoliday(plannedCompletionTime, duration);
            plannedCompletionTimeIST = plannedCompletionTime;
        }

        console.log("Final Planned Completion Time:", plannedCompletionTimeIST);



        async function validateHolidayforHRS(plannedCompletionTime) {
            try {
                console.log("inside get next working day, holiday validation input is ", plannedCompletionTime)
                console.log("plannedCompletionTime", typeof plannedCompletionTime)

                // Split the string using "T" as the separator
                let parts = plannedCompletionTime.split("T");
                let inputDateString = parts[0].trim();
                let inputTimeString = parts[1].trim();

                console.log("inputDateString", inputDateString)
                console.log("inputTimeString", inputTimeString)


                // Fetching non-working days from the backend
                const responseHoliday = await axios.post(process.env.MAIN_BE_HOLIDAY_NONWORKINGDAY_URL, { verify_company_url: companyUrl });//output like this  -> responseHoliday = ['2024-01-07', '2024-01-14']


                // const datesArrayAsObjects1 = responseHoliday.data.map(dateString => new Date(dateString));

                const datesArrayAsObjects = responseHoliday.data.map(dateString => {
                    let utcDate = new Date(dateString);
                    utcDate.setDate(utcDate.getDate() + 1); // Add one day
                    let istDate = moment(utcDate).tz('Asia/Kolkata').toDate(); // Convert to IST
                    return istDate;
                });

                //console.log('responseHoliday.data', responseHoliday.data)        //output like this  -> responseHoliday.data = [2024-01-07T00:00:00.000Z, 2024-01-14T00:00:00.000Z]

                // Function to group consecutive dates into arrays
                function groupConsecutiveDates(dates) {
                    dates.sort((a, b) => a - b); // Sort the dates in ascending order
                    const result = [];
                    let tempArray = [dates[0]];

                    for (let i = 1; i < dates.length; i++) {
                        const diff = (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
                        if (diff === 1) {
                            tempArray.push(dates[i]);
                        } else {
                            result.push(tempArray);
                            tempArray = [dates[i]];
                        }
                    }
                    result.push(tempArray);
                    return result;
                }

                // console.log("datesArrayAsObjects", datesArrayAsObjects);

                console.log("datesArrayAsObjects1", datesArrayAsObjects);
                const consecutiveArrays = groupConsecutiveDates(datesArrayAsObjects);
                //console.log("consecutiveArrays" , consecutiveArrays)

                console.log("consecutive", consecutiveArrays);

                //const inputDate = new Date("2024-05-18");
                const inputDate = new Date(inputDateString.trim());
                // Function to check if a date falls within a given range of dates
                function isDateInRange(date, startDate, endDate) {
                    //console.log('checking if the inputdate is a holiday')
                    console.log(date >= startDate && date <= endDate)
                    return date >= startDate && date <= endDate;
                }

                let belongsToElement = -1; // Default value if the input date doesn't belong to any array

                for (let i = 0; i < consecutiveArrays.length; i++) {
                    const dateArray = consecutiveArrays[i];
                    const startDate = dateArray[0];
                    const endDate = dateArray[dateArray.length - 1];

                    if (isDateInRange(inputDate, startDate, endDate)) {
                        belongsToElement = i;
                        break;
                    }
                }

                console.log('inputDate', inputDate, belongsToElement, 'element ', 'which is a holiday')

                if (belongsToElement >= 0) {
                    console.log("Input date belongs to element:", belongsToElement);
                    let dateBelongsTo = consecutiveArrays[belongsToElement]


                    console.log(dateBelongsTo)
                    //next working date is 
                    let lastElementinTheArray = dateBelongsTo[dateBelongsTo.length - 1]
                    console.log(lastElementinTheArray)

                    //next working date is 
                    //let nextWorkingDay = new Date(lastElementinTheArray.setDate(lastElementinTheArray.getDate() + 1));
                    let nextWorkingDay = new Date(lastElementinTheArray.getTime());
                    nextWorkingDay.setDate(nextWorkingDay.getDate() + 1);
                    let nextWorkingDayString = formatDateFromDateObjectToString(nextWorkingDay)
                    console.log("nextWorkingDayString", nextWorkingDayString)


                    let finalNextWorkingDay = nextWorkingDayString + "T" + inputTimeString;
                    console.log("finalNextWorkingDay", finalNextWorkingDay)

                    //split to remove timeZone

                    var finalNextWorkingDaydateObject = new Date(finalNextWorkingDay);
                    console.log(finalNextWorkingDaydateObject);


                    // Convert the Date object to IST using Moment Timezone
                    var istfinalNextWorkingDaydateObject = moment.tz(finalNextWorkingDaydateObject, 'Asia/Kolkata');
                    // Format the IST date as needed
                    var formattedIstDate = istfinalNextWorkingDaydateObject.format();
                    console.log("formattedIstDate", formattedIstDate);

                    return formattedIstDate;
                } else {
                    return plannedCompletionTime
                }

            } catch (error) {
                console.error("Failed to fetch holidays:", error);
                return null; // Return null or handle the error appropriately
            }
        }

        async function validateHoliday(plannedCompletionTime, duration) {
            try {
                console.log("inside get next working day, holiday validation input is ", plannedCompletionTime);
                console.log("plannedCompletionTime", typeof plannedCompletionTime);

                let inputDateString, inputTimeString;

                if (typeof plannedCompletionTime === 'string') {
                    // Split the string using "T" as the separator
                    let parts = plannedCompletionTime.split("T");
                    inputDateString = parts[0].trim();
                    inputTimeString = parts[1].trim();
                } else if (plannedCompletionTime instanceof Date) {
                    inputDateString = plannedCompletionTime.toISOString().split("T")[0];
                    inputTimeString = plannedCompletionTime.toISOString().split("T")[1];
                } else {
                    throw new Error("Invalid plannedCompletionTime format");
                }

                console.log("inputDateString", inputDateString);
                console.log("inputTimeString", inputTimeString);

                // Fetching non-working days from the backend
                const responseHoliday = await axios.post(process.env.MAIN_BE_HOLIDAY_NONWORKINGDAY_URL, { verify_company_url: companyUrl });
                // Convert holiday dates to IST
                const holidays = responseHoliday.data.map(dateString => {
                    let utcDate = new Date(dateString);
                    utcDate.setDate(utcDate.getDate() + 1); // Add one day
                    let istDate = moment(utcDate).tz('Asia/Kolkata').startOf('day').toDate(); // Convert to IST and normalize to start of the day
                    return istDate;
                }).map(date => date.toISOString().split('T')[0]); // Keep only the date part

                console.log("holidays in IST", holidays);

                function isHoliday(date) {
                    let dateString = date.toISOString().split('T')[0]; // Keep only the date part
                    return holidays.includes(dateString);
                }

                let currentDate = new Date(inputDateString);

                // Adjust initial planned completion time if it falls on a holiday
                while (isHoliday(currentDate)) {
                    currentDate.setDate(currentDate.getDate() + 1);
                }

                let totalDaysAdded = 0;

                // Adjust planned completion time to account for holidays
                while (totalDaysAdded < duration) {
                    currentDate.setDate(currentDate.getDate() + 1);
                    if (!isHoliday(currentDate)) {
                        totalDaysAdded++;
                    }
                }

                let finalDate = new Date(currentDate.toISOString().split('T')[0] + "T" + inputTimeString);
                let finalMoment = moment.tz(finalDate, 'Asia/Kolkata');
                finalMoment = finalMoment.subtract(5, 'hours').subtract(30, 'minutes'); // Adjust to UTC if needed

                let formattedFinalDate = finalMoment.format();

                console.log("final planned completion date after holiday adjustment", formattedFinalDate);


                console.log("final planned completion date after holiday adjustment", formattedFinalDate);

                return formattedFinalDate;

            } catch (error) {
                console.error("Failed to fetch holidays:", error);
                return null; // Return null or handle the error appropriately
            }
        }

        const currentDate = moment().tz('Asia/Kolkata').format();
        // Inserting data into the collection
        const result = await collection.insertOne({
            fmsTaskId,
            fmsQAId,
            fmsQACreatedBy: { userID: userID, userEmail: userEmail, userName: userName },
            fmsMasterId: req.body.fmsMasterID,
            fmsName: req.body.fmsName,
            fmsQA: req.body.fmsQA,
            fmsTaskDoer: employee,
            fmsTaskStatus: "PENDING",
            fmsTaskCompletedStatus : "null",  //either ONTIME OR DELAYED
            fmsProcessID: processId,
            plannedDate: plannedDate,
            what: what,
            how: how,
            stepId: stepId,
            stepType: stepType,
            fmsTaskCreatedTime: currentDate,
            fmsTaskPlannedCompletionTime: plannedCompletionTimeIST,
            formStepsAnswers: null,
            fmsTaskQualityDetails: null,
            isTransferredFrom: false,    //is this task transferred FROM other Task
            isTranferredTo: false,       //is this task transferred TO other Task
            transferredFromTaskId: null,
            transferredToTaskId: null,
            isWhatsAppEnabled : isWhatsAppEnabled, 
            whatsappData : whatsappData,
            at : null

        });

        console.log(result);
        console.log('Created the Task');
        // res.json({
        //     "message": `${req.body.fmsName} Step 1 is Successfully Created`,
        //     "status": 200
        // });

        //send Whatsapp message to the user
        // const sendWhatsapp = await axios.post(`${process.env.MAIN_BE_WHATSAPP_URL}`, {
        //     verify_company_url: companyUrl,
        //     isWhatsAppEnabled : isWhatsAppEnabled, 
        //     whatsappData : whatsappData
        // })

        // Close the MongoDB connection
        await client.close();
        console.log('MongoDB connection closed');

    } catch (error) {
        console.error('Error posting data:', error);
        res.status(500).send({ message: 'Error Submitting QA', status: 500 });
        return;
    }


    // //-------------------------Triggr Whatsapp Messages---------------------------------------//
    // console.log('trigger Whatsapp messages')
    // console.log(fmsSteps)
    // // const lastFmsStep = fmsSteps[fmsSteps.length - 1];
    // try {
    //     const sendWhatsapp = await axios.post(process.env.MAIN_BE_WHATSAPP_URL, {
    //     verify_company_url: companyUrl,
    //     fmsSteps: fmsSteps
    //     });
    //     console.log('WhatsApp message sent', sendWhatsapp.data);
    // } catch (whatsappError) {
    //     console.error('Error sending WhatsApp message:', whatsappError);
    // }

     //-------------------------Triggr Whatsapp Messages---------------------------------------//
     console.log('trigger Whatsapp messages')
       
    //  if (Array.isArray(fmsSteps) && fmsSteps.length > 0) {
    //      const lastFmsStep = fmsSteps[fmsSteps.length - 1];
    //      const whatsappData = lastFmsStep.whatsappData; 
     
    //      console.log('Last fmsStep:', lastFmsStep);
    //      console.log('WhatsApp data to send:', whatsappData);
     
    //      try {
    //          const sendWhatsapp = await axios.post(process.env.MAIN_BE_WHATSAPP_URL, {
    //              verify_company_url: companyUrl,
    //              fmsSteps: lastFmsStep,
    //              whatsappData: whatsappData // Include whatsappData if needed
    //          });
    //          console.log('WhatsApp message sent', sendWhatsapp.data);
    //      } catch (whatsappError) {
    //          console.error('Error sending WhatsApp message:', whatsappError);
    //      }
    //  } else {
    //      console.error('fmsSteps is not an array or is empty');
    //  }

    

    //-------------------------Triggr Android Notification---------------------------------------//
     ///sending android notification data
     console.log('sending android notification')
     const currentDate = moment().tz('Asia/Kolkata').format();
        // try {
        //     const sendAndroidNotification = await axios.post(process.env.MAIN_ANDROID_NOTIFICATION, {
        //     verify_company_url: companyUrl,
        //     assigned_to: employee.employeeId,
        //     user_id:userID,
        //     fmsName:req.body.fmsName,
        //     what:what,
        //     fmsTaskCreatedTime:currentDate,
        //     fmsTaskPlannedCompletionTime: plannedCompletionTime,
        //     });
        //     console.log('Android Notification sent', sendAndroidNotification.data);
        // } catch (androidError) {
        //     console.error('Error sending WhatsApp message:', androidError);
        // }



    res.json({
        "message": `FMS form is submitted and Step 1 task is Createed`,
        "status": 200
    });

})
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////




module.exports = submitFmsQuestionare;
