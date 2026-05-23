require('dotenv').config();

const cors = require('cors');
const express = require('express');
const fs = require('fs');
const path = require('path');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const teachersRoutes = require('./routes/teachers');
const studentsRoutes = require('./routes/students');
const sessionsRoutes = require('./routes/sessions');
const analyticsRoutes = require('./routes/analytics');
const webhookRoutes = require('./routes/webhook');
const systemRoutes = require('./routes/system');
const { receiveWhatsappResponse } = require('./controllers/whatsappController');

const app = express();
const port = process.env.API_PORT || 3000;
const distPath = path.join(__dirname, '..', 'dist');

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', async (req, res) => {
  try {
    return res.json({ success: true, service: 'ClassPulse API', timestamp: new Date().toISOString() });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/teachers', teachersRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/system', systemRoutes);

// Green API accepts a single webhook URL. Accept common root-level URLs too
// so replies still arrive if the dashboard is pointed at the ngrok base URL.
app.post(['/', '/webhook', '/webhook/whatsapp', '/greenapi'], receiveWhatsappResponse);

if (fs.existsSync(path.join(distPath, 'index.html'))) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }

    return res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use((req, res) => res.status(404).json({ success: false, error: 'Route not found.' }));

const start = async () => {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log(`[server] ClassPulse API listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('[server] Startup failed:', error.message);
    process.exit(1);
  }
};

start();
