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
  price: {
    type: Number,
    required: true
  },
  pictures: {
    type: [String],
    default: undefined
  }
});

module.exports = mongoose.model('Listing', ListingSchema);