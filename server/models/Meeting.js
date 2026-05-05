const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  meetingId: { type: String, required: true, unique: true },
  description: { type: String },
  dateTime: { type: Date },
  createdBy: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Meeting', meetingSchema);
