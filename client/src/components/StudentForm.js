import React, { useState } from 'react';
import { TextField, Button, Paper, Typography, Box } from '@mui/material';
import axios from 'axios';

function StudentForm({ fetchStudents }) {
  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    batch: '',
    semester: '',
  });
  const [editId, setEditId] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await axios.put(`http://localhost:5000/api/students/${editId}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/students', formData);
      }
      fetchStudents();
      setFormData({ name: '', rollNumber: '', batch: '', semester: '' });
      setEditId(null);
    } catch (error) {
      console.error('Error saving student:', error);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {editId ? 'Edit Student' : 'Add Student'}
      </Typography>
      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          margin="normal"
        />
        <TextField
          fullWidth
          label="Roll Number"
          name="rollNumber"
          value={formData.rollNumber}
          onChange={handleChange}
          margin="normal"
        />
        <TextField
          fullWidth
          label="Batch"
          name="batch"
          value={formData.batch}
          onChange={handleChange}
          margin="normal"
        />
        <TextField
          fullWidth
          label="Semester"
          name="semester"
          value={formData.semester}
          onChange={handleChange}
          margin="normal"
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
        >
          {editId ? 'Update' : 'Add'}
        </Button>
      </Box>
    </Paper>
  );
}

export default StudentForm;