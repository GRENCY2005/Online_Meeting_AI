const mongoose = require('mongoose');

const googleTokenSchema = new mongoose.Schema({
  userId:       { type: String, required: true, unique: true },
  accessToken:  { type: String, required: true },
  refreshToken: { type: String },
  tokenExpiry:  { type: Date },
  email:        { type: String },
  createdAt:    { type: Date, default: Date.now }
});

module.exports = mongoose.model('GoogleToken', googleTokenSchema);
