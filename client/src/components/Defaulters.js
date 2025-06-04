import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, CircularProgress, Box } from '@mui/material';

function Defaulters() {
  const [defaulters, setDefaulters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDefaulters = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get('http://localhost:5000/api/students/defaulters');
        setDefaulters(response.data || []);
      } catch (error) {
        console.error('Error fetching defaulters:', error);
        setError('Error fetching defaulters: ' + (error.response?.data?.message || error.message));
      } finally {
        setLoading(false);
      }
    };
    fetchDefaulters();
  }, []);

  return (
    <div>
      <Typography variant="h6" gutterBottom>
        Attendance Defaulters
      </Typography>
      {loading ? (
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Roll Number</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Low Attendance Semesters</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {defaulters.length > 0 ? (
                defaulters.map(d => (
                  <TableRow key={d.rollNumber}>
                    <TableCell>{d.rollNumber}</TableCell>
                    <TableCell>{d.name}</TableCell>
                    <TableCell>
                      {d.lowAttendance
                        ? d.lowAttendance.map(a => `Semester ${a.semester}: ${a.percentage.toFixed(2)}%`).join(', ')
                        : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    No defaulters found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}

export default Defaulters;