const express = require('express');
const cors = require('cors');
const companyRoutes = require('./routes/companyRoutes');
const contactRoutes = require('./routes/contactRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const subMasterRoutes = require('./routes/subMasterRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Configure CORS and JSON parsing
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/companies', companyRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/sub-masters', subMasterRoutes);

// Catch-all undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Global Error Middleware
app.use(errorHandler);

module.exports = app;
