var mongoose = require("mongoose");
var Schema = mongoose.Schema;

MvSchema = new Schema({
  name: String,
  email: String,
  password: String,
});
module.exports = mongoose.model("User", MvSchema);
