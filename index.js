const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
require('dotenv').config()

const routes = require("./controller/routes");
const middlewares = require("./middlewares/middleware");
const database = require("./database_config/");
var mongoose = require("mongoose");

const app = express();
const port = process.env.PORT;

// Initialize handlebars, mongoose, express app
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(database.url);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

// Attach routes to app
app.use("/",middlewares)
app.use("/", routes);

//Connect to the database before listening
connectDB().then(() => {
  app.listen(port, () => {
      console.log("listening for requests");
  })
})
