require('dotenv').config();

const express = require('express');
const path = require('node:path');
const layananRoutes = require('./routes/layanan.routes');
const pesanRoutes = require('./routes/pesan.routes');
const adminRoutes = require('./routes/admin.routes');
const authRoutes = require('./routes/auth.routes');
const permintaanRoutes = require('./routes/permintaan.routes');
const userAuth = require('./middleware/userAuth');
const errors = require('./middleware/errorHandler');

const app = express();
const publicDirectory = path.join(__dirname, '..', 'public');

app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));

app.get('/', userAuth.requireUserPage, function (_req, res) {
  res.sendFile(path.join(publicDirectory, 'index.html'));
});
app.get('/index.html', userAuth.requireUserPage, function (_req, res) {
  res.sendFile(path.join(publicDirectory, 'index.html'));
});

app.get('/api/health', async function (_req, res, next) {
  try {
    const db = require('./config/db');
    await db.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    next(error);
  }
});

app.use('/api/layanan', layananRoutes);
app.use('/api/pesan', pesanRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/permintaan-layanan', permintaanRoutes);

app.use(express.static(publicDirectory));
app.use(errors.notFound);
app.use(errors.handleError);

module.exports = app;
