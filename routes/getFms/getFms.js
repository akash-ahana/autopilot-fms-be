const express = require("express");
const getFms = express.Router();
var MongoClient = require('mongodb').MongoClient;

//find  Single FMS using FMS Name
getFms.post('/findSingleFms' , (req, res) => {
    //request the name of the FMS
    let fmsName = req.body.fmsName;

    MongoClient.connect(process.env.MONGO_DB_STRING)
    .then(async client => {
        console.log('Connected to database')
        const db = client.db('fmsDb')
        const collection = db.collection('fmsCollection') 

        // Fething data into from the  collection
        const query = { fmsName: req.body.fmsName };
        const document = await collection.findOne(query);

        console.log(document)
        res.json({
            "message" : document,
            "status" : 200
        })
    })
    .catch(error => {
        console.error('Error Connecting to MongoDB' , error)
        res.json({
            "message" : `${req.body.fmsName} Coul Not Find FMS`,
            "status" : 500
        })
    })

})

//find ALL FMS 
getFms.get('/findAllFms' , (req, res) => {
    //request the name of the FMS
    let fmsName = req.body.fmsName;

    MongoClient.connect(process.env.MONGO_DB_STRING)
    .then(async client => {
        console.log('Connected to database')
        const db = client.db('fmsDb')
        const collection = db.collection('fmsCollection') 

        const cursor = collection.find();
        const documents = await cursor.toArray();

        console.log(documents)
        res.json({
            "message" : [documents],
            "status" : 200
        })
    })
    .catch(error => {
        console.error('Error Connecting to MongoDB' , error)
        res.json({
            "message" : `${req.body.fmsName} Coul Not Find FMS`,
            "status" : 500
        })
    })

})

module.exports = getFms;