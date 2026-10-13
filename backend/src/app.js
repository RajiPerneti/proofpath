const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const authRoutes = require('./routes/authRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const codeRoutes = require('./routes/codeRoutes');
const competencyRoutes = require('./routes/competencyRoutes');
const { isGeminiConfigured } = require('./ai/geminiService');

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Health and AI / DB status check
app.get('/api/health', (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.json({
    status: 'healthy',
    service: 'ProofPath Evidence-Driven Assessment Platform',
    timestamp: new Date().toISOString(),
    database: {
      type: 'MongoDB',
      status: dbConnected ? 'connected' : 'disconnected',
      name: mongoose.connection.name || 'proofpath'
    },
    aiEngine: isGeminiConfigured() ? 'gemini_live' : 'deterministic_explainable_demo'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api', assessmentRoutes);
app.use('/api', interviewRoutes);
app.use('/api', codeRoutes);
app.use('/api', competencyRoutes);

// Static frontend serving if built
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    }
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

module.exports = app;
