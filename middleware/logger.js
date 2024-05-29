const winston = require('winston');
const { format } = require('winston');
const moment = require('moment-timezone');

// Define a custom timestamp format function
const customTimestamp = format((info, opts) => {
    // Convert the timestamp to IST timezone
    info.timestamp = moment().tz('Asia/Kolkata').format();
    return info;
});

const infoLogger = winston.createLogger({
    transports: [
        new winston.transports.File({
            filename: 'info.log',
            level: 'info',
            format: format.combine(
                format.timestamp(), // This will add the default timestamp
                customTimestamp(), // This will overwrite the default timestamp with IST format
                format.json(),
                format.prettyPrint()
            )
        }),
    ]
});

 
const errorLogger = winston.createLogger({
    transports: [
        new winston.transports.File({
            filename: 'error.log',
            level:'error',
            format:format.combine(format.timestamp(),format.json(),format.prettyPrint())
           })
    ]
  });
 
 
 
  module.exports = {infoLogger,errorLogger}