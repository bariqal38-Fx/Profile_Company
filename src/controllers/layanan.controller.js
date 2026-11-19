const db = require('../config/db');

function cleanService(body) {
  return {
    nama: String(body.nama || '').trim(),
    kategori: String(body.kategori || '').trim(),
    deskripsi: String(body.deskripsi || '').trim(),
  };
}

function validService(item) {
  return item.nama.length >= 3 && item.nama.length <= 100 &&
    item.kategori.length >= 2 && item.kategori.length <= 60 &&
    item.deskripsi.length >= 20 && item.deskripsi.length <= 500;
}

function list(_req, res, next) {
  db.query(
    'SELECT id, nama, kategori, deskripsi, created_at FROM layanan ORDER BY id ASC'
  ).then(function (result) {
    res.json(result[0]);
  }).catch(next);
}

function getOne(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ message: 'ID layanan tidak valid.' });
  }

  db.query(
    'SELECT id, nama, kategori, deskripsi, created_at FROM layanan WHERE id = ?',
    [id]
  ).then(function (result) {
    if (!result[0].length) {
      return res.status(404).json({ message: 'Layanan tidak ditemukan.' });
    }
    res.json(result[0][0]);
  }).catch(next);
}

function create(req, res, next) {
  const item = cleanService(req.body);
  if (!validService(item)) {
    return res.status(400).json({
      message: 'Isi nama, kategori, dan deskripsi layanan dengan benar.',
      hint: 'Nama minimal 3 karakter, kategori minimal 2 karakter, deskripsi 20–500 karakter.',
    });
  }

  db.query(
    'INSERT INTO layanan (nama, kategori, deskripsi) VALUES (?, ?, ?)',
    [item.nama, item.kategori, item.deskripsi]
  ).then(function (result) {
    res.status(201).json({
      id: result[0].insertId,
      nama: item.nama,
      kategori: item.kategori,
      deskripsi: item.deskripsi,
    });
  }).catch(next);
}

function update(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ message: 'ID layanan tidak valid.' });
  }

  const item = cleanService(req.body);
  if (!validService(item)) {
    return res.status(400).json({
      message: 'Isi nama, kategori, dan deskripsi layanan dengan benar.',
      hint: 'Nama minimal 3 karakter, kategori minimal 2 karakter, deskripsi 20–500 karakter.',
    });
  }

  db.query(
    'UPDATE layanan SET nama = ?, kategori = ?, deskripsi = ? WHERE id = ?',
    [item.nama, item.kategori, item.deskripsi, id]
  ).then(function (result) {
    if (!result[0].affectedRows) {
      return db.query('SELECT id FROM layanan WHERE id = ?', [id]).then(function (found) {
        if (!found[0].length) {
          return res.status(404).json({ message: 'Layanan tidak ditemukan.' });
        }
        res.json({ id: id, ...item });
      });
    }
    res.json({ id: id, ...item });
  }).catch(next);
}

function remove(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ message: 'ID layanan tidak valid.' });
  }

  db.query('DELETE FROM layanan WHERE id = ?', [id])
    .then(function (result) {
      if (!result[0].affectedRows) {
        return res.status(404).json({ message: 'Layanan tidak ditemukan.' });
      }
      res.status(204).end();
    }).catch(next);
}

module.exports = {
  create: create,
  getOne: getOne,
  list: list,
  remove: remove,
  update: update,
};
