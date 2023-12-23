const express = require("express");
const bodyParser = require("body-parser");
require('dotenv').config()

const routes = require("./controller/routes");
const baseMiddlewares = require("./middlewares/baseMiddlewares");
const database = require("./database_config/database_config");
var mongoose = require("mongoose");

const app = express();
const { body, check, validationResult } = require("express-validator");

function validateEmailAndPasswordFIelds () {
    check('email').isEmail()
    check('password').isLength({ min: 6 }),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      next();
    }
};
  
// module.exports = { validateEmailAndPasswordFIelds };