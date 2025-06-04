import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  MenuItem,
  InputLabel,
  Select,
  FormControl,
} from '@mui/material';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { motion } from 'framer-motion';

function MarksForm({ students }) {
  const [formData, setFormData] = useState({
    studentId: '',
    subject: '',
    marks: '',
    semester: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/marks', formData);
      setFormData({ studentId: '', subject: '', marks: '', semester: '' });
    } catch (error) {
      console.error('Error saving marks:', error);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = evt.target.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const marksData = XLSX.utils.sheet_to_json(sheet);
      try {
        await axios.post('http://localhost:5000/api/marks/bulk', marksData);
      } catch (error) {
        console.error('Error uploading marks:', error);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Paper sx={{ p: 4 }}>
        <Typography variant="h6" gutterBottom>
          Add Marks
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <FormControl fullWidth margin="normal">
              <InputLabel>Student</InputLabel>
              <Select
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
              >
                {students.map((student) => (
                  <MenuItem key={student._id} value={student._id}>
                    {student.name} ({student.rollNumber})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </motion.div>
          {['subject', 'marks', 'semester'].map((field, index) => (
            <motion.div
              key={field}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: (index + 1) * 0.1 }}
            >
              <TextField
                fullWidth
                label={field.charAt(0).toUpperCase() + field.slice(1)}
                name={field}
                type={field === 'marks' ? 'number' : 'text'}
                value={formData[field]}
                onChange={handleChange}
                margin="normal"
                InputProps={{
                  sx: {
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)',
                    },
                  },
                }}
              />
            </motion.div>
          ))}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{ mt: 3 }}
            >
              Add Marks
            </Button>
          </motion.div>
        </Box>
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Bulk Upload Marks
          </Typography>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="contained"
              component="label"
              sx={{ background: 'linear-gradient(45deg, #EC4899, #F43F5E)' }}
            >
              Choose File
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                hidden
              />
            </Button>
          </motion.div>
        </Box>
      </Paper>
    </motion.div>
  );
}

export default MarksForm;