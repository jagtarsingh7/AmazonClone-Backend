const express = require("express");
const baseMiddlewares = express.Router();
const bodyParser = require("body-parser");
const path = require("path");

baseMiddlewares.use(express.static(path.join(__dirname, "public")));
baseMiddlewares.use(bodyParser.urlencoded({ extended: "true" })); 
baseMiddlewares.use(bodyParser.json()); 
baseMiddlewares.use(bodyParser.json({ type: "application/vnd.api+json" })); 

// Export router
module.exports = baseMiddlewares;
