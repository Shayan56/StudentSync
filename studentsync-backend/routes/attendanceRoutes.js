const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const winston = require('winston');

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

// Get attendance (filtered by studentId and semester)
router.get('/', async (req, res) => {
  try {
    const { studentId, semester } = req.query;
    let query = {};
    if (studentId) query.studentId = studentId;
    if (semester) query.semester = semester;
    const attendance = await Attendance.find(query).populate('studentId', 'name rollNumber');
    logger.info('Fetched attendance');
    res.json(attendance);
  } catch (error) {
    logger.error('Error fetching attendance:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create an attendance record
router.post('/', async (req, res) => {
  try {
    const { studentId, date, status, semester } = req.body;
    if (!studentId || !date || !status || !semester) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (!['Present', 'Absent'].includes(status)) {
      return res.status(400).json({ message: 'Status must be Present or Absent' });
    }
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    const attendance = new Attendance({ studentId, date, status, semester });
    const newAttendance = await attendance.save();
    logger.info(`Created attendance for student: ${student.rollNumber}`);
    res.status(201).json(newAttendance);
  } catch (error) {
    logger.error('Error creating attendance:', error);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;