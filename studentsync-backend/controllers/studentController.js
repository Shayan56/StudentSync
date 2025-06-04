const Student = require('../models/Student');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const moment = require('moment');

// CRUD for Students
exports.createStudent = async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.status(201).json(student);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getStudents = async (req, res) => {
  try {
    const { rollNumber, name, batch, semester } = req.query;
    const query = {};
    if (rollNumber) query.rollNumber = rollNumber;
    if (name) query.name = { $regex: name, $options: 'i' };
    if (batch) query.batch = batch;
    if (semester) query.semester = semester;

    const students = await Student.find(query);
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(student);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: 'Student deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Marks CRUD
exports.addMarks = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    student.marks.push(req.body);
    await student.save();
    res.json(student);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateMarks = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    const mark = student.marks.id(req.body.markId);
    mark.internal = req.body.internal;
    await student.save();
    res.json(student);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteMarks = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    student.marks.id(req.body.markId).remove();
    await student.save();
    res.json(student);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Attendance CRUD
exports.addAttendance = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    student.attendance.push(req.body);
    await student.save();
    res.json(student);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateAttendance = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    const attendance = student.attendance.id(req.body.attendanceId);
    attendance.status = req.body.status;
    await student.save();
    res.json(student);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteAttendance = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    student.attendance.id(req.body.attendanceId).remove();
    await student.save();
    res.json(student);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Bulk Upload
exports.bulkUpload = async (req, res) => {
  try {
    const file = XLSX.read(req.body.buffer, { type: 'buffer' });
    const data = XLSX.utils.sheet_to_json(file.Sheets[file.SheetNames[0]]);

    for (let item of data) {
      const student = await Student.findOne({ rollNumber: item.rollNumber });
      if (student) {
        if (item.marks) student.marks.push(item.marks);
        if (item.attendance) student.attendance.push(item.attendance);
        await student.save();
      } else {
        await Student.create(item);
      }
    }
    res.json({ message: 'Bulk upload successful' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Analytics
exports.getAnalytics = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    const subjects = [...new Set(student.marks.map(m => m.subject))];

    // Attendance Percentage
    const attendanceBySubject = subjects.map(subject => {
      const subjectAttendance = student.attendance.filter(a => a.subject === subject);
      const total = subjectAttendance.length;
      const present = subjectAttendance.filter(a => a.status === 'Present').length;
      return { subject, percentage: total ? (present / total) * 100 : 0 };
    });

    // Grade Conversion
    const grades = student.marks.map(m => {
      let grade;
      if (m.internal >= 90) grade = 'A+';
      else if (m.internal >= 80) grade = 'A';
      else if (m.internal >= 70) grade = 'B';
      else if (m.internal >= 60) grade = 'C';
      else grade = 'F';
      return { subject: m.subject, internal: m.internal, grade };
    });

    // GPA Calculator
    const gradePoints = { 'A+': 10, 'A': 9, 'B': 8, 'C': 7, 'F': 0 };
    const gpa = grades.reduce((sum, g) => sum + gradePoints[g.grade], 0) / grades.length;

    res.json({ attendanceBySubject, grades, gpa });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Generate PDF
exports.generatePDF = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${student.rollNumber}_report.pdf`);
    
    doc.pipe(res);
    doc.fontSize(20).text('Student Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Name: ${student.name}`);
    doc.text(`Roll Number: ${student.rollNumber}`);
    doc.text(`Batch: ${student.batch}`);
    doc.text(`Semester: ${student.semester}`);
    doc.moveDown();

    doc.text('Marks:', { underline: true });
    student.marks.forEach(m => {
      doc.text(`${m.subject}: ${m.internal}`);
    });

    doc.moveDown();
    doc.text('Attendance:', { underline: true });
    const attendanceAnalytics = await exports.getAnalytics({ params: { id: req.params.id } }, { json: () => {} });
    attendanceAnalytics.attendanceBySubject.forEach(a => {
      doc.text(`${a.subject}: ${a.percentage.toFixed(2)}%`);
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Defaulter List
exports.getDefaulters = async (req, res) => {
  try {
    const students = await Student.find();
    const defaulters = [];

    for (let student of students) {
      const subjects = [...new Set(student.attendance.map(a => a.subject))];
      const attendanceBySubject = subjects.map(subject => {
        const subjectAttendance = student.attendance.filter(a => a.subject === subject);
        const total = subjectAttendance.length;
        const present = subjectAttendance.filter(a => a.status === 'Present').length;
        return { subject, percentage: total ? (present / total) * 100 : 0 };
      });

      const lowAttendance = attendanceBySubject.filter(a => a.percentage < 75);
      if (lowAttendance.length > 0) {
        defaulters.push({ name: student.name, rollNumber: student.rollNumber, lowAttendance });
      }
    }

    res.json(defaulters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};