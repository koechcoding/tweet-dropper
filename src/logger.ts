import * as winston from "winston"; // Logging

// Setup winston logger
export const logger = winston.createLogger({
  level: "info",
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "tweetdrop.log" })
  ]
});
