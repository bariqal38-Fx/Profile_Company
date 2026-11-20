const db = require('../config/db');
const auth = require('../middleware/adminAuth');
const passwords = require('../utils/password');
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function cleanUser(body) {
  return {
    nama: String(body.nama || '').trim(),
    email: String(body.email || '').trim().toLowerCase(),
    password: String(body.password || ''),
  };
}

function validUser(user) {
  return user.nama.length >= 2 && user.nama.length <= 100 &&
    EMAIL_PATTERN.test(user.email) && user.email.length <= 150;
}

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

function listUsers(_req, res, next) {
  db.query(
    'SELECT id, nama, email, created_at FROM pengguna ORDER BY created_at DESC'
  ).then(function (result) {
    res.json(result[0]);
  }).catch(next);
}

async function createUser(req, res, next) {
  const user = cleanUser(req.body || {});
  if (!validUser(user) || user.password.length < 8 || user.password.length > 100) {
    return res.status(400).json({
      message: 'Isi nama, email, dan password dengan benar. Password minimal 8 karakter.',
    });
  }

  try {
    const passwordHash = await passwords.hashPassword(user.password);
    const [result] = await db.query(
      'INSERT INTO pengguna (nama, email, password_hash) VALUES (?, ?, ?)',
      [user.nama, user.email, passwordHash]
    );
    res.status(201).json({
      id: result.insertId,
      nama: user.nama,
      email: user.email,
      message: 'Akun pengguna berhasil ditambahkan.',
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email tersebut sudah digunakan akun lain.' });
    }
    next(error);
  }
}

async function updateUser(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ message: 'ID pengguna tidak valid.' });
  }

  const user = cleanUser(req.body || {});
  if (!validUser(user) || (user.password && (user.password.length < 8 || user.password.length > 100))) {
    return res.status(400).json({
      message: 'Periksa kembali nama dan email. Password baru harus berisi 8–100 karakter.',
    });
  }

  try {
    let result;
    if (user.password) {
      const passwordHash = await passwords.hashPassword(user.password);
      [result] = await db.query(
        'UPDATE pengguna SET nama = ?, email = ?, password_hash = ? WHERE id = ?',
        [user.nama, user.email, passwordHash, id]
      );
    } else {
      [result] = await db.query(
        'UPDATE pengguna SET nama = ?, email = ? WHERE id = ?',
        [user.nama, user.email, id]
      );
    }

    if (!result.affectedRows) {
      const [rows] = await db.query('SELECT id FROM pengguna WHERE id = ?', [id]);
      if (!rows.length) return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
    }
    res.json({ id: id, nama: user.nama, email: user.email, message: 'Data pengguna berhasil diperbarui.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email tersebut sudah digunakan akun lain.' });
    }
    next(error);
  }
}

function deleteUser(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ message: 'ID pengguna tidak valid.' });
  }

  db.query('DELETE FROM pengguna WHERE id = ?', [id])
    .then(function (result) {
      if (!result[0].affectedRows) {
        return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
      }
      res.status(204).end();
    }).catch(next);
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
  createUser: createUser,
  deleteMessage: deleteMessage,
  deleteUser: deleteUser,
  listUsers: listUsers,
  listMessages: listMessages,
  login: login,
  logout: logout,
  updateUser: updateUser,
  updateMessageStatus: updateMessageStatus,
  whoAmI: whoAmI,
};
