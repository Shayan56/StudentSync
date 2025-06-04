import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  TextField,
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from 'axios';

function AnalyticsDashboard({ students }) {
  const [marksData, setMarksData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, [selectedStudent, selectedSemester]);

  const fetchAnalytics = async () => {
    try {
      const marksResponse = await axios.get('http://localhost:5000/api/marks', {
        params: { studentId: selectedStudent, semester: selectedSemester },
      });
      const attendanceResponse = await axios.get(
        'http://localhost:5000/api/attendance',
        {
          params: { studentId: selectedStudent, semester: selectedSemester },
        }
      );
      setMarksData(marksResponse.data);
      setAttendanceData(attendanceResponse.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const calculateAttendancePercentage = () => {
    const total = attendanceData.length;
    const present = attendanceData.filter(
      (record) => record.status === 'Present'
    ).length;
    return total ? ((present / total) * 100).toFixed(2) : 0;
  };

  const calculateGPA = () => {
    const totalMarks = marksData.reduce((sum, mark) => sum + mark.marks, 0);
    const count = marksData.length;
    const percentage = count ? (totalMarks / count).toFixed(2) : 0;
    if (percentage >= 90) return 4.0;
    if (percentage >= 80) return 3.5;
    if (percentage >= 70) return 3.0;
    if (percentage >= 60) return 2.5;
    return 2.0;
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Student Report', 14, 20);
    doc.setFontSize(12);
    doc.text(
      `Student: ${
        students.find((s) => s._id === selectedStudent)?.name || 'All'
      }`,
      14,
      30
    );
    doc.text(`Semester: ${selectedSemester || 'All'}`, 14, 40);

    autoTable(doc, {
      startY: 50,
      head: [['Subject', 'Marks', 'Grade']],
      body: marksData.map((mark) => [
        mark.subject,
        mark.marks,
        mark.marks >= 90
          ? 'A+'
          : mark.marks >= 80
          ? 'A'
          : mark.marks >= 70
          ? 'B'
          : 'C',
      ]),
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Attendance: ${calculateAttendancePercentage()}%`, 14, finalY);
    doc.text(`GPA: ${calculateGPA()}`, 14, finalY + 10);

    doc.save('student_report.pdf');
  };

  const generateDefaulterList = () => {
    const defaulters = students.filter((student) => {
      const studentAttendance = attendanceData.filter(
        (record) => record.studentId === student._id
      );
      const total = studentAttendance.length;
      const present = studentAttendance.filter(
        (record) => record.status === 'Present'
      ).length;
      return total ? (present / total) * 100 < 75 : false;
    });
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Attendance Defaulter List', 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [['Name', 'Roll Number', 'Attendance %']],
      body: defaulters.map((student) => {
        const studentAttendance = attendanceData.filter(
          (record) => record.studentId === student._id
        );
        const total = studentAttendance.length;
        const present = studentAttendance.filter(
          (record) => record.status === 'Present'
        ).length;
        return [
          student.name,
          student.rollNumber,
          total ? ((present / total) * 100).toFixed(2) : 0,
        ];
      }),
    });
    doc.save('defaulter_list.pdf');
  };

  const pieData = [
    { name: 'Present', value: parseFloat(calculateAttendancePercentage()) },
    {
      name: 'Absent',
      value: 100 - parseFloat(calculateAttendancePercentage()),
    },
  ];

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Filters
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Student</InputLabel>
              <Select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {students.map((student) => (
                  <MenuItem key={student._id} value={student._id}>
                    {student.name} ({student.rollNumber})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Semester"
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={generatePDF}
              sx={{ mt: 2, mr: 1 }}
            >
              Download Report
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={generateDefaulterList}
              sx={{ mt: 2 }}
            >
              Defaulter List
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Marks Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={marksData}>
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="marks" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Attendance Trend
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={attendanceData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey={(record) => (record.status === 'Present' ? 1 : 0)}
                  stroke="#dc004e"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Attendance Breakdown
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  label
                >
                  <Cell fill="#1976d2" />
                  <Cell fill="#dc004e" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Summary
            </Typography>
            <Typography>Attendance: {calculateAttendancePercentage()}%</Typography>
            <Typography>GPA: {calculateGPA()}</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default AnalyticsDashboard;