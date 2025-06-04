const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  date: { type: Date, required: true },
  status: {
    type: String,
    enum: ['Present', 'Absent'],
    required: true,
  },
  semester: { type: String, required: true, trim: true },
}, { timestamps: true });

attendanceSchema.index({ studentId: 1, semester: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);