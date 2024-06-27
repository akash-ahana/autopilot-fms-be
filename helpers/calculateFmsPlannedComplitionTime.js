const express = require("express");
var MongoClient = require('mongodb').MongoClient;
const axios = require('axios');
//const moment = require('moment-timezone');
const { CurrentIST, addHrs, addDays, addDaysToADate, formatDateFromDateObjectToString, getCurrentDateInIST } = require('./convertGMTtoIST');
const moment = require('moment');



const calculateFmsPlannedComplitionTime = async (companyUrl, duration, durationType, working, plannedCompletionTime, plannedCompletionTimeIST, decisionforPlannedComplitionTime) => {
    try {
        console.log("inside calculate planned complitiaon time", decisionforPlannedComplitionTime);
        // Calculate Fms Planned Completion Time
        if (durationType === "hrs") {
            if (working === "OUTSIDE") {
                const fetchDate = decisionforPlannedComplitionTime.answer;
                
                if (decisionforPlannedComplitionTime.answerType === 'DATE' && decisionforPlannedComplitionTime.isStartDate === true) {
                    console.log("inside DATE function");
                    const currentDateISTAnswer = moment(fetchDate).tz('Asia/Kolkata');
                    console.log("currentDate:", currentDateISTAnswer.format());
                    plannedCompletionTime = currentDateISTAnswer.add(duration, 'hours').format();
                    plannedCompletionTime = await validateHolidayforHRS(plannedCompletionTime, companyUrl);
                    plannedCompletionTimeIST = plannedCompletionTime;
                } else {
                    console.log("inside other than all the fucntions");
                    plannedCompletionTime = addHrs(CurrentIST(), duration);
                    plannedCompletionTimeIST = plannedCompletionTime;
                }
            } else {
                try {
                    const fetchDate = decisionforPlannedComplitionTime.answer;
                    const response = await axios.post(process.env.MAIN_BE_WORKING_SHIFT_URL, { verify_company_url: companyUrl });
                    let shiftStartTimeStr = response.data.result[0].shiftStartTime;
                    let shiftEndTimeStr = response.data.result[0].shiftEndTime;

                    let shiftStartTime = moment.tz(shiftStartTimeStr, 'Asia/Kolkata').add(5, 'hours').add(30, 'minutes').toDate();
                    let shiftEndTime = moment.tz(shiftEndTimeStr, 'Asia/Kolkata').add(5, 'hours').add(30, 'minutes').toDate();

                    console.log("shitStartTime", shiftStartTime);
                    console.log("shiftEndTime", shiftEndTime);

                    let currentDateTimeFinal;
                    if (decisionforPlannedComplitionTime.answerType === 'DATE' && decisionforPlannedComplitionTime.isStartDate === true ) {
                        console.log("fetchDate", fetchDate);
                        const currentDateISTAnswer = moment(fetchDate).tz('Asia/Kolkata');
                        console.log("currentDate:", currentDateISTAnswer.format());
                        currentDateTimeFinal = currentDateISTAnswer.add(duration, 'hours').format();

                    } else {
                        currentDateTimeFinal = moment().tz('Asia/Kolkata').add(duration, 'hours').toDate();
                        currentDateTimeFinal.setHours(currentDateTimeFinal.getHours() + 5);
                        currentDateTimeFinal.setMinutes(currentDateTimeFinal.getMinutes() + 30);
                    }

                    console.log('Initial plannedCompletionTime:', currentDateTimeFinal);

                    let plannedTimeDate;
                    if (decisionforPlannedComplitionTime.answerType === 'DATE' && decisionforPlannedComplitionTime.isStartDate === true) {
                        plannedTimeDate = moment.tz(currentDateTimeFinal, 'Asia/Kolkata').add(5, 'hours').add(30, 'minutes').toDate();
                    } else {
                        plannedTimeDate = currentDateTimeFinal;
                        console.log("plannedTimeDate after additoon", plannedTimeDate);
                    }


                    const shiftEndTimeDate = new Date(shiftEndTime);

                    function calculateBalanceHours(plannedCompletionTime, shiftEndTime) {
                        if (plannedCompletionTime > shiftEndTime) {

                            console.log("plannedCompletionTime inside the funtion", plannedCompletionTime);
                            let diffMillis = plannedCompletionTime.getTime() - shiftEndTime.getTime();
                            let hours = Math.floor(diffMillis / (1000 * 60 * 60));
                            let minutes = Math.floor((diffMillis % (1000 * 60 * 60)) / (1000 * 60));
                            let seconds = Math.floor(((diffMillis % (1000 * 60 * 60)) % (1000 * 60)) / 1000);

                            let overflowforThatDayIs = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

                            let nextDayCompletionTime = new Date(shiftStartTime);

                            // Check if the planned completion time exceeds the shift end time
                            if (plannedCompletionTime.getDate() !== shiftEndTime.getDate() || plannedCompletionTime > shiftEndTime) {
                                // Add only if the planned completion time exceeds the shift end time
                                console.log("entering into loop");
                                nextDayCompletionTime.setDate(nextDayCompletionTime.getDate() + 1);
                            }

                            console.log("nextDayCompletionTime after checking date:", nextDayCompletionTime);

                            nextDayCompletionTime.setHours(nextDayCompletionTime.getHours() + hours);
                            nextDayCompletionTime.setMinutes(nextDayCompletionTime.getMinutes() + minutes);
                            nextDayCompletionTime.setSeconds(nextDayCompletionTime.getSeconds() + seconds);

                            console.log('Final planned completion time (before adding offset):', nextDayCompletionTime);

                            let plannedCompletionTimeIST = moment(nextDayCompletionTime).tz('Asia/Kolkata').subtract(5, 'hours').subtract(30, 'minutes').format();

                            console.log('Final planned completion time (IST - 05:30):', plannedCompletionTimeIST);

                            return plannedCompletionTimeIST;
                        } else {
                            console.log("plannedTimeDate check here", plannedCompletionTime);
                            let plannedCompletionTimeIST
                            if (decisionforPlannedComplitionTime.answerType === 'DATE' && decisionforPlannedComplitionTime.isStartDate === true) {
                                plannedCompletionTimeIST = moment(plannedCompletionTime).tz('Asia/Kolkata').format();
                            } else {
                                plannedCompletionTimeIST = moment(plannedCompletionTime).tz('Asia/Kolkata').subtract(5, 'hours').subtract(30, 'minutes').format();
                            }
                            console.log("plannedCompletionTimeIST check here", plannedCompletionTimeIST);
                            return plannedCompletionTimeIST;
                        }
                    }

                    let balanceTime = calculateBalanceHours(plannedTimeDate, shiftEndTimeDate);
                    console.log('Balance time:', balanceTime);

                    if (plannedTimeDate > shiftEndTime && plannedTimeDate.getDate() !== shiftEndTimeDate.getDate() || plannedTimeDate.getTime() > shiftEndTimeDate.getTime() ) {
                        // Perform holiday validation only if planned completion time exceeds shift end time
                        plannedCompletionTimeIST = await validateHolidayforHRS(balanceTime, companyUrl);
                        console.log('Planned completion time after holiday validation:', plannedCompletionTimeIST);
                    } else {
                        console.log("unless the date is more it was not verifying the date", balanceTime);
                        plannedCompletionTimeIST = balanceTime;
                    }

                    console.log("plannedTimeDate", plannedCompletionTime);
                    plannedCompletionTime = plannedTimeDate;
                } catch (error) {
                    console.error('Error fetching working shift details:', error);
                    return { error: error.message, status: 500 };
                }
            }
        } else {
            const fetchDate = decisionforPlannedComplitionTime.answer;
            if (decisionforPlannedComplitionTime.answerType === 'DATE' && decisionforPlannedComplitionTime.isStartDate === true) {
                console.log("inside DATE function");

                console.log("fetchDate", fetchDate);
                const currentDateISTAnswer = moment(fetchDate).tz('Asia/Kolkata');
                // console.log("currentDate:", currentDateISTAnswer.format());
                plannedCompletionTime = currentDateISTAnswer.format();
                console.log("planned time for datwe", plannedCompletionTime);
                plannedCompletionTime = await validateHoliday(plannedCompletionTime, duration, companyUrl, decisionforPlannedComplitionTime);
                plannedCompletionTimeIST = plannedCompletionTime;
            } else {
                const currentDateTimeFinal = moment().tz('Asia/Kolkata').toDate();
                currentDateTimeFinal.setHours(currentDateTimeFinal.getHours() + 5);
                currentDateTimeFinal.setMinutes(currentDateTimeFinal.getMinutes() + 30);
                console.log("date check", currentDateTimeFinal);
                plannedCompletionTime = currentDateTimeFinal;
                console.log("plannedCompletionTime for days", plannedCompletionTime);
                plannedCompletionTime = await validateHoliday(plannedCompletionTime, duration, companyUrl, decisionforPlannedComplitionTime);
                plannedCompletionTimeIST = plannedCompletionTime;
            }
        }

        console.log("Final Planned Completion Time:", plannedCompletionTimeIST);

        return plannedCompletionTimeIST;
    } catch (error) {
        console.log(error.message);
        return null;
    }
};



async function validateHolidayforHRS(plannedCompletionTimeIST, companyUrl) {
    try {
        console.log("inside get next working day, holiday validation input is ", plannedCompletionTimeIST);

        // Split the string using "T" as the separator
        let parts = plannedCompletionTimeIST.split("T");
        let inputDateString = parts[0].trim();
        let inputTimeString = parts[1].trim();

        console.log("inputDateString", inputDateString);
        console.log("inputTimeString", inputTimeString);

        console.log("companyUrl", companyUrl);

        // Fetching non-working days from the backend
        const responseHoliday = await axios.post(process.env.MAIN_BE_HOLIDAY_NONWORKINGDAY_URL, { verify_company_url: companyUrl });

        const datesArrayAsObjects = responseHoliday.data.map(dateString => {
            let utcDate = new Date(dateString);
            utcDate.setDate(utcDate.getDate() + 1); // Add one day
            let istDate = moment(utcDate).tz('Asia/Kolkata').toDate(); // Convert to IST
            return istDate;
        });

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

        console.log("datesArrayAsObjects1", datesArrayAsObjects);
        const consecutiveArrays = groupConsecutiveDates(datesArrayAsObjects);
        console.log("consecutive", consecutiveArrays);

        const inputDate = new Date(inputDateString.trim());

        function isDateInRange(date, startDate, endDate) {
            return date >= startDate && date <= endDate;
        }

        let belongsToElement = -1;

        for (let i = 0; i < consecutiveArrays.length; i++) {
            const dateArray = consecutiveArrays[i];
            const startDate = dateArray[0];
            const endDate = dateArray[dateArray.length - 1];

            if (isDateInRange(inputDate, startDate, endDate)) {
                belongsToElement = i;
                break;
            }
        }

        console.log('inputDate', inputDate, belongsToElement, 'element ', 'which is a holiday');

        if (belongsToElement >= 0) {
            console.log("Input date belongs to element:", belongsToElement);
            let dateBelongsTo = consecutiveArrays[belongsToElement];

            console.log(dateBelongsTo);
            let lastElementinTheArray = dateBelongsTo[dateBelongsTo.length - 1];
            console.log(lastElementinTheArray);

            let nextWorkingDay = new Date(lastElementinTheArray.getTime());
            nextWorkingDay.setDate(nextWorkingDay.getDate() + 1);
            let nextWorkingDayString = formatDateFromDateObjectToString(nextWorkingDay);
            console.log("nextWorkingDayString", nextWorkingDayString);

            let finalNextWorkingDay = nextWorkingDayString + "T" + inputTimeString;
            console.log("finalNextWorkingDay", finalNextWorkingDay);

            var finalNextWorkingDaydateObject = new Date(finalNextWorkingDay);
            console.log(finalNextWorkingDaydateObject);

            var istfinalNextWorkingDaydateObject = moment.tz(finalNextWorkingDaydateObject, 'Asia/Kolkata');
            var formattedIstDate = istfinalNextWorkingDaydateObject.format();
            console.log("formattedIstDate", formattedIstDate);

            return formattedIstDate;
        } else {
            return plannedCompletionTimeIST;
        }

    } catch (error) {
        console.error("Failed to fetch holidays:", error);
        return { error: error.message, status: 500 };
    }
}

async function validateHoliday(plannedCompletionTime, duration, companyUrl, decisionforPlannedComplitionTime) {
    try {
        console.log("inside get next working day, holiday validation input is ", plannedCompletionTime);
        console.log("company url", companyUrl);

        let inputDateString, inputTimeString;

        if (typeof plannedCompletionTime === 'string') {
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

        const responseHoliday = await axios.post(process.env.MAIN_BE_HOLIDAY_NONWORKINGDAY_URL, { verify_company_url: companyUrl });

        const holidays = responseHoliday.data.map(dateString => {
            let utcDate = new Date(dateString);
            utcDate.setDate(utcDate.getDate() + 1); // Add one day
            let istDate = moment(utcDate).tz('Asia/Kolkata').startOf('day').toDate(); // Convert to IST and normalize to start of the day
            return istDate;
        }).map(date => date.toISOString().split('T')[0]);

        console.log("holidays in IST", holidays);

        function isHoliday(date) {
            let dateString = date.toISOString().split('T')[0];
            console.log("dateString", dateString);
            return holidays.includes(dateString);
        }

        let currentDate = new Date(inputDateString);

        // Adjust current date if it is a holiday
        while (isHoliday(currentDate)) {
            console.log(`Current date ${currentDate.toISOString().split('T')[0]} is a holiday, moving to next day.`);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        let totalDaysAdded = 0;

        // Add the duration in days, skipping holidays
        while (totalDaysAdded < duration) {
            currentDate.setDate(currentDate.getDate() + 1);
            console.log(`Checking date: ${currentDate.toISOString().split('T')[0]}`);
            if (!isHoliday(currentDate)) {
                totalDaysAdded++;
                console.log(`Adding day: ${currentDate.toISOString().split('T')[0]}. Total days added: ${totalDaysAdded}`);
            } else {
                console.log(`Date ${currentDate.toISOString().split('T')[0]} is a holiday, not adding.`);
            }
        }

        // Combine the final working date with the input time
        let finalDate = new Date(`${currentDate.toISOString().split('T')[0]}T${inputTimeString}`);
        let finalMoment = moment.tz(finalDate, 'Asia/Kolkata');

        let formattedFinalDate;
        if (decisionforPlannedComplitionTime.answerType === 'DATE' && decisionforPlannedComplitionTime.isStartDate === true) {
            formattedFinalDate = moment(finalMoment).tz('Asia/Kolkata').format();
        } else {
            formattedFinalDate = moment(finalMoment).tz('Asia/Kolkata').subtract(5, 'hours').subtract(30, 'minutes').format();
        }

        console.log("final planned completion date after holiday adjustment", formattedFinalDate);

        return formattedFinalDate;

    } catch (error) {
        console.error("Failed to fetch holidays:", error);
        return { error: error.message, status: 500 };
    }
}


module.exports = { calculateFmsPlannedComplitionTime };