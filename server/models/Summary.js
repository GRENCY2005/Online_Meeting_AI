const mongoose = require('mongoose');

const scheduledEventSchema = new mongoose.Schema({
  actionItem: { type: String },
  eventId:    { type: String },
  eventLink:  { type: String },
  title:      { type: String },
  scheduledDate: { type: Date },
  priority:   { type: String, enum: ['high', 'medium', 'low'], default: 'medium' }
}, { _id: false });

const summarySchema = new mongoose.Schema({
  meetingId:       { type: String, required: true, unique: true },
  fullTranscript:  { type: String },
  summary:         { type: String },
  keyPoints:       { type: [String], default: [] },
  actionItems:     { type: [String], default: [] },
  decisions:       { type: [String], default: [] },
  scheduledEvents: { type: [scheduledEventSchema], default: [] },
  createdAt:       { type: Date, default: Date.now },
  updatedAt:       { type: Date, default: Date.now }
});

module.exports = mongoose.model('Summary', summarySchema);
