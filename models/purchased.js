var mongoose = require("mongoose");
var Schema = mongoose.Schema;

const AddressSchema = new Schema({
  line1: String,
  postal_code: String,
  city: String,
  state: String,
  country: String
});

const ProductSchema = new Schema({ 
  id: Number,
  title: String,
  price: Number,
  description: String,
  category: String,
  image: String,
  rating: {
    rate: Number,
    count: Number
  }
});

const PurchasedItemsSchema = new Schema({
  name: String,
  email: String,
  phone:String,
  address: AddressSchema,
  product:[ProductSchema]
});



module.exports = mongoose.model("PurchasedItemsSchema", PurchasedItemsSchema);
