const mongoose = require('mongoose');

const transcriptSegmentSchema = new mongoose.Schema({
  speakerId: { type: String },
  speakerName: { type: String },
  transcriptText: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const transcriptSchema = new mongoose.Schema({
  meetingId: { type: String, required: true, unique: true },
  transcript: { type: String, default: "" },
  segments: [transcriptSegmentSchema],
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transcript', transcriptSchema);
