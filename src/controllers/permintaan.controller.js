const db = require('../config/db');

const ALLOWED_STATUSES = ['menunggu', 'diverifikasi', 'ditolak'];

async function createForUser(req, res, next) {
  const body = req.body || {};
  const layananId = Number(body.layananId);
  const catatan = String(body.catatan || '').trim();

  if (!Number.isInteger(layananId) || layananId < 1) {
    return res.status(400).json({ message: 'Pilih layanan yang tersedia.' });
  }
  if (catatan.length > 500) {
    return res.status(400).json({ message: 'Catatan maksimal 500 karakter.' });
  }

  try {
    const [users] = await db.query(
      'SELECT id, nama, email FROM pengguna WHERE id = ? LIMIT 1',
      [req.user.id]
    );
    if (!users.length) {
      return res.status(401).json({ message: 'Akun tidak ditemukan. Silakan masuk lagi.' });
    }

    const [services] = await db.query(
      'SELECT id, nama FROM layanan WHERE id = ? LIMIT 1',
      [layananId]
    );
    if (!services.length) {
      return res.status(404).json({ message: 'Layanan yang dipilih sudah tidak tersedia.' });
    }

    const user = users[0];
    const service = services[0];
    const [result] = await db.query(
      `INSERT INTO permintaan_layanan
        (user_id, layanan_id, nama_pengguna, email_pengguna, nama_layanan, catatan)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user.id, service.id, user.nama, user.email, service.nama, catatan || null]
    );

    res.status(201).json({
      message: 'Permintaan layanan terkirim. Admin akan memeriksa dan memverifikasinya.',
      id: result.insertId,
      status: 'menunggu',
    });
  } catch (error) {
    next(error);
  }
}

function listForUser(req, res, next) {
  db.query(
    `SELECT id, nama_layanan, catatan, status, created_at, updated_at
     FROM permintaan_layanan
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [req.user.id]
  ).then(function (result) {
    res.json(result[0]);
  }).catch(next);
}

function listForAdmin(_req, res, next) {
  db.query(
    `SELECT id, user_id, layanan_id, nama_pengguna, email_pengguna,
            nama_layanan, catatan, status, created_at, updated_at
     FROM permintaan_layanan
     ORDER BY (status = 'menunggu') DESC, created_at DESC`
  ).then(function (result) {
    res.json(result[0]);
  }).catch(next);
}

function updateStatus(req, res, next) {
  const id = Number(req.params.id);
  const status = String((req.body || {}).status || '');
  if (!Number.isInteger(id) || id < 1 || !ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Status permintaan layanan tidak valid.' });
  }

  db.query('UPDATE permintaan_layanan SET status = ? WHERE id = ?', [status, id])
    .then(function (result) {
      if (!result[0].affectedRows) {
        return db.query('SELECT id FROM permintaan_layanan WHERE id = ?', [id]).then(function (found) {
          if (!found[0].length) {
            return res.status(404).json({ message: 'Permintaan layanan tidak ditemukan.' });
          }
          res.json({ message: 'Status permintaan berhasil diperbarui.' });
        });
      }
      res.json({ message: 'Status permintaan berhasil diperbarui.' });
    }).catch(next);
}

function remove(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ message: 'ID permintaan tidak valid.' });
  }

  db.query('DELETE FROM permintaan_layanan WHERE id = ?', [id])
    .then(function (result) {
      if (!result[0].affectedRows) {
        return res.status(404).json({ message: 'Permintaan layanan tidak ditemukan.' });
      }
      res.status(204).end();
    }).catch(next);
}

module.exports = {
  createForUser: createForUser,
  listForAdmin: listForAdmin,
  listForUser: listForUser,
  remove: remove,
  updateStatus: updateStatus,
};
