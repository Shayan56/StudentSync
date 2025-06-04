/**
 * Modified By: [Your Name]
 */

import React, { useState, useEffect } from 'react';
import {
  Grid,
  Typography,
  Tabs,
  Tab,
  Box,
  TextField,
  Paper,
} from '@mui/material';
import StudentForm from '../components/StudentForm';
import StudentList from '../components/StudentList';
import MarksForm from '../components/MarksForm';
import AttendanceForm from '../components/AttendanceForm';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import BulkUpload from '../components/BulkUpload';
import Defaulters from '../components/Defaulters';
import axios from 'axios';
import { motion } from 'framer-motion';
import styled from 'styled-components';

const StyledTabs = styled(Tabs)`
  .MuiTab-root {
    color: #D1D5DB;
    font-weight: 600;
    transition: all 0.3s ease;
    &:hover {
      color: #FFFFFF;
      transform: scale(1.1);
    }
  }
  .Mui-selected {
    color: #A855F7 !important;
    text-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
  }
  .MuiTabs-indicator {
    background: linear-gradient(45deg, #3B82F6, #A855F7);
    height: 4px;
    border-radius: 2px;
  }
`;

const DashboardContainer = styled(Paper)`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  margin: 16px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const TitleBox = styled(Box)`
  background: linear-gradient(45deg, #3B82F6, #A855F7);
  border-radius: 8px;
  padding: 8px 16px;
  display: inline-block;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  margin: 16px auto;
  text-align: center;
`;

function Home() {
  const [tabValue, setTabValue] = useState(0);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [editStudent, setEditStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/students');
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleEdit = (student) => {
    setEditStudent(student);
    setTabValue(0); // Switch to Students tab
  };

  const clearEdit = () => {
    setEditStudent(null);
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.rollNumber.includes(search)
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <TitleBox>
          <Typography
            variant="h5"
            align="center"
            sx={{
              color: '#FFFFFF',
              fontWeight: 600,
            }}
          >
            StudentSync Dashboard
          </Typography>
        </TitleBox>
      </motion.div>
      <DashboardContainer elevation={3}>
        <Box sx={{ p: 3 }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <StyledTabs
              value={tabValue}
              onChange={(e, newValue) => setTabValue(newValue)}
              centered
              sx={{ mb: 2 }}
            >
              <Tab label="Students" />
              <Tab label="Marks" />
              <Tab label="Attendance" />
              <Tab label="Analytics" />
              <Tab label="Bulk Upload" />
              <Tab label="Defaulters" />
            </StyledTabs>
          </motion.div>

          <Box sx={{ mt: 3 }}>
            {tabValue === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <motion.div
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <StudentForm
                      fetchStudents={fetchStudents}
                      editStudent={editStudent}
                      clearEdit={clearEdit}
                    />
                  </motion.div>
                </Grid>
                <Grid item xs={12} md={8}>
                  <motion.div
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <TextField
                      fullWidth
                      label="Search by Name or Roll Number"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      sx={{
                        mb: 2,
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: 2,
                        input: { color: '#FFFFFF' },
                        label: { color: '#D1D5DB' },
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                          '&:hover fieldset': { borderColor: '#A855F7' },
                          '&.Mui-focused fieldset': { borderColor: '#3B82F6' },
                        },
                      }}
                    />
                    <StudentList
                      students={filteredStudents}
                      fetchStudents={fetchStudents}
                      onEdit={handleEdit}
                    />
                  </motion.div>
                </Grid>
              </Grid>
            )}
            {tabValue === 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <MarksForm students={students} />
              </motion.div>
            )}
            {tabValue === 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <AttendanceForm students={students} />
              </motion.div>
            )}
            {tabValue === 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <AnalyticsDashboard students={students} />
              </motion.div>
            )}
            {tabValue === 4 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <BulkUpload />
              </motion.div>
            )}
            {tabValue === 5 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Defaulters />
              </motion.div>
            )}
          </Box>
        </Box>
      </DashboardContainer>
    </Box>
  );
}

export default Home;