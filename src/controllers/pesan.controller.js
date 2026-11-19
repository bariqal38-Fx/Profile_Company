const db = require('../config/db');

function create(req, res, next) {
  const nama = String(req.body.nama || '').trim();
  const email = String(req.body.email || '').trim();
  const perusahaan = String(req.body.perusahaan || '').trim();
  const pesan = String(req.body.pesan || '').trim();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

  if (nama.length < 2 || nama.length > 100) {
    return res.status(400).json({ message: 'Nama perlu diisi (2–100 karakter).' });
  }
  if (!validEmail || email.length > 150) {
    return res.status(400).json({ message: 'Periksa kembali format alamat email.' });
  }
  if (perusahaan.length > 120) {
    return res.status(400).json({ message: 'Nama perusahaan terlalu panjang.' });
  }
  if (pesan.length < 10 || pesan.length > 2000) {
    return res.status(400).json({ message: 'Pesan harus berisi 10–2.000 karakter.' });
  }

  db.query(
    'INSERT INTO pesan (nama, email, perusahaan, pesan) VALUES (?, ?, ?, ?)',
    [nama, email, perusahaan || null, pesan]
  ).then(function (result) {
    res.status(201).json({
      message: 'Terima kasih, pesanmu sudah tersimpan. Tim kami akan menghubungimu.',
      id: result[0].insertId,
    });
  }).catch(next);
}

module.exports = { create: create };
