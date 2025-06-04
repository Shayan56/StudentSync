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
import { motion } from 'framer-motion';

function AttendanceForm({ students }) {
  const [formData, setFormData] = useState({
    studentId: '',
    date: '',
    status: '',
    semester: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/attendance', formData);
      setFormData({ studentId: '', date: '', status: '', semester: '' });
    } catch (error) {
      console.error('Error saving attendance:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Paper sx={{ p: 4 }}>
        <Typography variant="h6" gutterBottom>
          Add Attendance
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          {[
            { type: 'select', name: 'studentId', label: 'Student', options: students.map(s => ({ value: s._id, label: `${s.name} (${s.rollNumber})` })) },
            { type: 'text', name: 'date', label: 'Date', inputType: 'date' },
            { type: 'select', name: 'status', label: 'Status', options: [
              { value: 'Present', label: 'Present' },
              { value: 'Absent', label: 'Absent' },
            ]},
            { type: 'text', name: 'semester', label: 'Semester' },
          ].map((field, index) => (
            <motion.div
              key={field.name}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              {field.type === 'select' ? (
                <FormControl fullWidth margin="normal">
                  <InputLabel>{field.label}</InputLabel>
                  <Select
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                  >
                    {field.options.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <TextField
                  fullWidth
                  label={field.label}
                  name={field.name}
                  type={field.inputType || 'text'}
                  value={formData[field.name]}
                  onChange={handleChange}
                  margin="normal"
                  InputLabelProps={field.inputType === 'date' ? { shrink: true } : {}}
                  InputProps={{
                    sx: {
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)',
                      },
                    },
                  }}
                />
              )}
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
              Add Attendance
            </Button>
          </motion.div>
        </Box>
      </Paper>
    </motion.div>
  );
}

export default AttendanceForm;