const express = require("express");
const bodyParser = require("body-parser");
require('dotenv').config()
const cors = require('cors');
const routes = require("./controller/routes");
const baseMiddlewares = require("./middlewares/baseMiddlewares");
const database = require("./database_config/database_config");
var mongoose = require("mongoose");
const app = express();
const port = process.env.PORT;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(database.url);
    console.log("connected");
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}
app.use(cors())
app.use("/",baseMiddlewares)
app.use("/", routes);

connectDB().then(() => {
  app.listen(port, () => {
      console.log("listening...");
  })
})