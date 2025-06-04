import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import { Container, Box } from '@mui/material';
import { motion } from 'framer-motion';

function App() {
  return (
    <Router>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
          minHeight: '100vh',
          py: 4,
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <Container maxWidth="lg">
            <Routes>
              <Route path="/" element={<Home />} />
            </Routes>
          </Container>
        </motion.div>
      </Box>
    </Router>
  );
}

export default App;