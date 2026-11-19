const db = require('../config/db');
const auth = require('../middleware/adminAuth');

function login(req, res) {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  const expectedUser = process.env.ADMIN_USERNAME || 'admin';
  const expectedPassword = process.env.ADMIN_PASSWORD || '';

  if (!username || !password) {
    return res.status(400).json({ message: 'Username dan password wajib diisi.' });
  }

  if (!expectedPassword ||
      !auth.safeEqual(username, expectedUser) ||
      !auth.safeEqual(password, expectedPassword)) {
    return res.status(401).json({ message: 'Username atau password belum sesuai.' });
  }

  res.setHeader('Set-Cookie', auth.cookieHeader(
    auth.issueToken(username),
    auth.SESSION_SECONDS
  ));
  res.json({ message: 'Login berhasil.', username: username });
}

function logout(_req, res) {
  res.setHeader('Set-Cookie', auth.cookieHeader('', 0));
  res.json({ message: 'Anda sudah keluar.' });
}

function whoAmI(req, res) {
  res.json({ username: req.admin.username });
}

function listMessages(_req, res, next) {
  db.query(
    'SELECT id, nama, email, perusahaan, pesan, status, created_at FROM pesan ORDER BY created_at DESC'
  ).then(function (result) {
    res.json(result[0]);
  }).catch(next);
}

function updateMessageStatus(req, res, next) {
  const id = Number(req.params.id);
  const status = String(req.body.status || '');

  if (!Number.isInteger(id) || id < 1 || !['baru', 'dibaca', 'ditangani'].includes(status)) {
    return res.status(400).json({ message: 'Data status pesan tidak valid.' });
  }

  db.query('UPDATE pesan SET status = ? WHERE id = ?', [status, id])
    .then(function (result) {
      if (!result[0].affectedRows) {
        return res.status(404).json({ message: 'Pesan tidak ditemukan.' });
      }
      res.json({ message: 'Status pesan berhasil diperbarui.' });
    }).catch(next);
}

function deleteMessage(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ message: 'ID pesan tidak valid.' });
  }

  db.query('DELETE FROM pesan WHERE id = ?', [id])
    .then(function (result) {
      if (!result[0].affectedRows) {
        return res.status(404).json({ message: 'Pesan tidak ditemukan.' });
      }
      res.status(204).end();
    }).catch(next);
}

module.exports = {
  deleteMessage: deleteMessage,
  listMessages: listMessages,
  login: login,
  logout: logout,
  updateMessageStatus: updateMessageStatus,
  whoAmI: whoAmI,
};
