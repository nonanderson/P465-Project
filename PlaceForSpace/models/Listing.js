const mongoose = require('mongoose');

const ListingSchema = new mongoose.Schema({
  userEmail: {
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
  pictures: {
    type: [String],
    default: undefined
  }
});

module.exports = mongoose.model('Listing', ListingSchema);