var mongoose = require("mongoose");
var Schema = mongoose.Schema;

MvSchema = new Schema({
  userName: String,
  userEmail: String,
  productName: [String],
});
module.exports = mongoose.model("Product", MvSchema);
