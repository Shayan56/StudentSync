const express = require('express');
const router = express.Router();
const Marks = require('../models/Marks');
const Student = require('../models/Student');
const multer = require('multer');
const XLSX = require('xlsx');
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

// Multer setup
const upload = multer({ storage: multer.memoryStorage() });

// Get marks (filtered by studentId and semester)
router.get('/', async (req, res) => {
  try {
    const { studentId, semester } = req.query;
    let query = {};
    if (studentId) query.studentId = studentId;
    if (semester) query.semester = semester;
    const marks = await Marks.find(query).populate('studentId', 'name rollNumber');
    logger.info('Fetched marks');
    res.json(marks);
  } catch (error) {
    logger.error('Error fetching marks:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create a mark
router.post('/', async (req, res) => {
  try {
    const { studentId, subject, marks, semester } = req.body;
    if (!studentId || !subject || marks == null || !semester) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (marks < 0 || marks > 100) {
      return res.status(400).json({ message: 'Marks must be between 0 and 100' });
    }
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    const mark = new Marks({ studentId, subject, marks, semester });
    const newMark = await mark.save();
    logger.info(`Created mark for student: ${student.rollNumber}`);
    res.status(201).json(newMark);
  } catch (error) {
    logger.error('Error creating mark:', error);
    res.status(400).json({ message: error.message });
  }
});

// Bulk upload marks
router.post('/bulk', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const buffer = req.file.buffer;
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const marksData = XLSX.utils.sheet_to_json(sheet);

    const marks = await Promise.all(
      marksData.map(async (data) => {
        if (!data.rollNumber || !data.subject || data.marks == null || !data.semester) {
          throw new Error('Invalid data: All fields are required');
        }
        if (data.marks < 0 || data.marks > 100) {
          throw new Error(`Invalid marks for ${data.rollNumber}: Must be between 0 and 100`);
        }
        const student = await Student.findOne({ rollNumber: data.rollNumber });
        if (!student) {
          throw new Error(`Student with rollNumber ${data.rollNumber} not found`);
        }
        return {
          studentId: student._id,
          subject: data.subject,
          marks: data.marks,
          semester: data.semester,
        };
      })
    );

    await Marks.insertMany(marks);
    logger.info(`Bulk uploaded ${marks.length} marks`);
    res.status(201).json({ message: 'Bulk upload successful' });
  } catch (error) {
    logger.error('Error in bulk marks upload:', error);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;