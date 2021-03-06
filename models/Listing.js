const mongoose = require('mongoose');

const ListingSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description:{
    type: String,
    required: true
  },
  streetAddress: {
    type: String,
    required: true
  },
  city: {
      type: String,
      required: true
  },
  state: {
      type: String,
      required: true
  },
  zip: {
    type: String,
    required: true
  },
  // price: {
  //   type: Number,
  //   required: true
  // },
  image: {
    type: String,
    require: true
  },

  amenities: {
    type: [String],
    required: true
  },

  id: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Listing', ListingSchema);