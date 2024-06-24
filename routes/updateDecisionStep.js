const express = require("express");
const updateDecisionTask = express.Router();
//var MongoClient = require('mongodb').MongoClient;
const { MongoClient, ObjectId } = require('mongodb');
const axios = require('axios');
const { CurrentIST } = require('../helpers/convertGMTtoIST');
const { Console } = require("winston/lib/winston/transports");
const moment = require('moment-timezone');

updateDecisionTask.post('/updateDecisionTask' , async (req, res) => {
    console.log("inside UPDATE DECISION TASK -----------------------------------------------------------")
    console.log("inside UPDATE DECISION TASK -----------------------------------------------------------")
    console.log("inside UPDATE DECISION TASK -----------------------------------------------------------")
    console.log('REQUEST BODY' , req.body)


    res.json({
        "message": `Decision Task Updated`,
        "status": 200
    });

})

    module.exports = updateFmsTask;