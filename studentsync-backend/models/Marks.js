const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  subject: { type: String, required: true, trim: true },
  marks: { type: Number, required: true, min: 0, max: 100 },
  semester: { type: String, required: true, trim: true },
}, { timestamps: true });

marksSchema.index({ studentId: 1, semester: 1 });

module.exports = mongoose.model('Marks', marksSchema);