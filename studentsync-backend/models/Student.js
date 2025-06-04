const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  rollNumber: { type: String, required: true, unique: true, trim: true },
  batch: { type: String, required: true, trim: true },
  semester: { type: String, required: true, trim: true },
}, { timestamps: true });

studentSchema.index({ rollNumber: 1 }, { unique: true });

module.exports = mongoose.model('Student', studentSchema);