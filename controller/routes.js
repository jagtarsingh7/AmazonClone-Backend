const express = require("express");
const { body, check, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();



// Export router
module.exports = router;
