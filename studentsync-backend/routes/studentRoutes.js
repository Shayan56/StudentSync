const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Marks = require('../models/Marks');
const Attendance = require('../models/Attendance');
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

// Multer setup for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Get all students
router.get('/', async (req, res) => {
  try {
    const students = await Student.find();
    logger.info('Fetched all students');
    res.json(students);
  } catch (error) {
    logger.error('Error fetching students:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create a student
router.post('/', async (req, res) => {
  try {
    const { name, rollNumber, batch, semester } = req.body;
    if (!name || !rollNumber || !batch || !semester) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const existingStudent = await Student.findOne({ rollNumber });
    if (existingStudent) {
      return res.status(400).json({ message: 'Roll number already exists' });
    }
    const student = new Student({ name, rollNumber, batch, semester });
    const newStudent = await student.save();
    logger.info(`Created student: ${rollNumber}`);
    res.status(201).json(newStudent);
  } catch (error) {
    logger.error('Error creating student:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update a student
router.put('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    const { name, rollNumber, batch, semester } = req.body;
    if (rollNumber && rollNumber !== student.rollNumber) {
      const existingStudent = await Student.findOne({ rollNumber });
      if (existingStudent) {
        return res.status(400).json({ message: 'Roll number already exists' });
      }
    }
    student.name = name || student.name;
    student.rollNumber = rollNumber || student.rollNumber;
    student.batch = batch || student.batch;
    student.semester = semester || student.semester;
    const updatedStudent = await student.save();
    logger.info(`Updated student: ${student.rollNumber}`);
    res.json(updatedStudent);
  } catch (error) {
    logger.error('Error updating student:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete a student
router.delete('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    await Marks.deleteMany({ studentId: req.params.id });
    await Attendance.deleteMany({ studentId: req.params.id });
    await student.deleteOne();
    logger.info(`Deleted student: ${student.rollNumber}`);
    res.json({ message: 'Student and related data deleted' });
  } catch (error) {
    logger.error('Error deleting student:', error);
    res.status(500).json({ message: error.message });
  }
});

// Bulk upload students
router.post('/bulk', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const buffer = req.file.buffer;
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const studentsData = XLSX.utils.sheet_to_json(sheet);

    const students = studentsData.map((data) => {
      if (!data.name || !data.rollNumber || !data.batch || !data.semester) {
        throw new Error('Invalid data: All fields are required');
      }
      return {
        name: data.name,
        rollNumber: data.rollNumber,
        batch: data.batch,
        semester: data.semester,
      };
    });

    // Check for duplicate roll numbers
    const rollNumbers = students.map((s) => s.rollNumber);
    const existingStudents = await Student.find({ rollNumber: { $in: rollNumbers } });
    if (existingStudents.length > 0) {
      return res.status(400).json({
        message: 'Duplicate roll numbers found: ' +
          existingStudents.map((s) => s.rollNumber).join(', '),
      });
    }

    await Student.insertMany(students);
    logger.info(`Bulk uploaded ${students.length} students`);
    res.status(201).json({ message: 'Bulk upload successful' });
  } catch (error) {
    logger.error('Error in bulk upload:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get defaulters (attendance < 75%)
router.get('/defaulters', async (req, res) => {
  try {
    const students = await Student.find();
    const attendanceRecords = await Attendance.find();
    const defaulters = students
      .map((student) => {
        const studentAttendance = attendanceRecords.filter(
          (record) => record.studentId.toString() === student._id.toString()
        );
        const total = studentAttendance.length;
        const present = studentAttendance.filter(
          (record) => record.status === 'Present'
        ).length;
        const percentage = total ? (present / total) * 100 : 0;
        if (percentage < 75) {
          return {
            _id: student._id,
            name: student.name,
            rollNumber: student.rollNumber,
            percentage,
          };
        }
        return null;
      })
      .filter((d) => d !== null);
    logger.info('Fetched defaulters');
    res.json(defaulters);
  } catch (error) {
    logger.error('Error fetching defaulters:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;