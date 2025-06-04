const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const XLSX = require('xlsx');
const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Allow only your frontend origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/studentsync', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Student Schema
const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollNumber: { type: String, required: true, unique: true },
  batch: { type: String, required: true },
  semester: { type: String, required: true },
});

const Student = mongoose.model('Student', studentSchema);

// Marks Schema
const marksSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  subject: { type: String, required: true },
  marks: { type: Number, required: true },
  semester: { type: String, required: true },
});

const Marks = mongoose.model('Marks', marksSchema);

// Attendance Schema
const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['Present', 'Absent'], required: true },
  semester: { type: String, required: true },
});

const Attendance = mongoose.model('Attendance', attendanceSchema);

// Student Routes
// Create or Update Student
app.post('/api/students', async (req, res) => {
  try {
    const { name, rollNumber, batch, semester } = req.body;
    let student = await Student.findOne({ rollNumber });
    if (student) {
      // Update existing student
      student = await Student.findOneAndUpdate(
        { rollNumber },
        { name, batch, semester },
        { new: true }
      );
      return res.status(200).json(student);
    }
    student = new Student({ name, rollNumber, batch, semester });
    await student.save();
    res.status(201).json(student);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get All Students
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Student
app.put('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.status(200).json(student);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete Student
app.delete('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.status(200).json({ message: 'Student deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Bulk Upload Students
app.post('/api/students/bulk', async (req, res) => {
  try {
    const { data, filename } = req.body;
    const buffer = Buffer.from(data, 'base64');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const students = XLSX.utils.sheet_to_json(sheet);

    for (const student of students) {
      const { name, rollNumber, batch, semester } = student;
      await Student.findOneAndUpdate(
        { rollNumber },
        { name, batch, semester },
        { upsert: true, new: true }
      );
    }
    res.status(200).json({ message: 'Bulk upload successful' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Marks Routes
// Create Marks
app.post('/api/marks', async (req, res) => {
  try {
    const marks = new Marks(req.body);
    await marks.save();
    res.status(201).json(marks);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get Marks
app.get('/api/marks', async (req, res) => {
  try {
    const { studentId, semester } = req.query;
    const query = {};
    if (studentId) query.studentId = studentId;
    if (semester) query.semester = semester;
    const marks = await Marks.find(query);
    res.status(200).json(marks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Bulk Upload Marks
app.post('/api/marks/bulk', async (req, res) => {
  try {
    const marksData = req.body;
    for (const mark of marksData) {
      const { studentId, subject, marks, semester } = mark;
      await Marks.findOneAndUpdate(
        { studentId, subject, semester },
        { marks },
        { upsert: true, new: true }
      );
    }
    res.status(200).json({ message: 'Bulk upload successful' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Attendance Routes
// Create Attendance
app.post('/api/attendance', async (req, res) => {
  try {
    const attendance = new Attendance(req.body);
    await attendance.save();
    res.status(201).json(attendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get Attendance
app.get('/api/attendance', async (req, res) => {
  try {
    const { studentId, semester } = req.query;
    const query = {};
    if (studentId) query.studentId = studentId;
    if (semester) query.semester = semester;
    const attendance = await Attendance.find(query);
    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Defaulters
app.get('/api/students/defaulters', async (req, res) => {
  try {
    const students = await Student.find();
    const defaulters = [];
    for (const student of students) {
      const attendance = await Attendance.find({ studentId: student._id });
      const semesters = [...new Set(attendance.map(a => a.semester))];
      const lowAttendance = [];
      for (const semester of semesters) {
        const semesterAttendance = attendance.filter(a => a.semester === semester);
        const total = semesterAttendance.length;
        const present = semesterAttendance.filter(a => a.status === 'Present').length;
        const percentage = total ? (present / total) * 100 : 0;
        if (percentage < 75) {
          lowAttendance.push({ semester, percentage });
        }
      }
      if (lowAttendance.length > 0) {
        defaulters.push({ ...student._doc, lowAttendance });
      }
    }
    res.status(200).json(defaulters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));