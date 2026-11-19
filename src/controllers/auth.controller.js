const crypto = require('node:crypto');
const { promisify } = require('node:util');
const db = require('../config/db');
const userAuth = require('../middleware/userAuth');

const scrypt = promisify(crypto.scrypt);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const HASH_BYTES = 64;

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, HASH_BYTES);
  return 'scrypt$' + salt + '$' + Buffer.from(key).toString('hex');
}

async function verifyPassword(password, storedHash) {
  const pieces = String(storedHash || '').split('$');
  if (pieces.length !== 3 || pieces[0] !== 'scrypt' ||
      !/^[a-f0-9]{32}$/.test(pieces[1]) ||
      !/^[a-f0-9]{128}$/.test(pieces[2])) {
    return false;
  }

  const actual = Buffer.from(await scrypt(password, pieces[1], HASH_BYTES));
  const expected = Buffer.from(pieces[2], 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function setLoginCookie(res, userId) {
  res.setHeader('Set-Cookie', userAuth.cookieHeader(
    userAuth.issueToken(userId),
    userAuth.SESSION_SECONDS
  ));
}

async function register(req, res, next) {
  const body = req.body || {};
  const nama = String(body.nama || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const validEmail = EMAIL_PATTERN.test(email);

  if (nama.length < 2 || nama.length > 100) {
    return res.status(400).json({ message: 'Nama harus berisi 2–100 karakter.' });
  }
  if (!validEmail || email.length > 150) {
    return res.status(400).json({ message: 'Masukkan alamat email yang valid.' });
  }
  if (password.length < 8 || password.length > 100) {
    return res.status(400).json({ message: 'Password harus berisi 8–100 karakter.' });
  }

  try {
    const passwordHash = await hashPassword(password);
    const [result] = await db.query(
      'INSERT INTO pengguna (nama, email, password_hash) VALUES (?, ?, ?)',
      [nama, email, passwordHash]
    );
    setLoginCookie(res, result.insertId);
    res.status(201).json({
      message: 'Akun berhasil dibuat. Kamu sudah masuk.',
      user: { id: result.insertId, nama: nama, email: email },
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email ini sudah terdaftar. Silakan login.' });
    }
    next(error);
  }
}

async function login(req, res, next) {
  const body = req.body || {};
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!EMAIL_PATTERN.test(email) || !password) {
    return res.status(400).json({ message: 'Isi email dan password dengan benar.' });
  }

  try {
    const [rows] = await db.query(
      'SELECT id, nama, email, password_hash FROM pengguna WHERE email = ? LIMIT 1',
      [email]
    );
    const user = rows[0];
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return res.status(401).json({ message: 'Email atau password belum sesuai.' });
    }

    setLoginCookie(res, user.id);
    res.json({
      message: 'Login berhasil. Selamat datang kembali, ' + user.nama + '.',
      user: { id: user.id, nama: user.nama, email: user.email },
    });
  } catch (error) {
    next(error);
  }
}

async function me(req, res, next) {
  try {
    const [rows] = await db.query(
      'SELECT id, nama, email, created_at FROM pengguna WHERE id = ? LIMIT 1',
      [req.user.id]
    );
    if (!rows.length) {
      res.setHeader('Set-Cookie', userAuth.cookieHeader('', 0));
      return res.status(401).json({ message: 'Akun tidak ditemukan. Silakan daftar lagi.' });
    }
    res.json({ user: rows[0] });
  } catch (error) {
    next(error);
  }
}

function logout(_req, res) {
  res.setHeader('Set-Cookie', userAuth.cookieHeader('', 0));
  res.json({ message: 'Kamu sudah keluar.' });
}

module.exports = {
  login: login,
  logout: logout,
  me: me,
  register: register,
};
