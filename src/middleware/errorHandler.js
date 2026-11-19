function notFound(_req, res) {
  res.status(404).json({ message: 'Halaman atau endpoint tidak ditemukan.' });
}

function handleError(error, _req, res, _next) {
  console.error('[server error]', error.message);

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Format data yang dikirim belum benar.' });
  }

  if (error.code === 'ECONNREFUSED' || error.code === 'ER_ACCESS_DENIED_ERROR' ||
      error.code === 'ER_BAD_DB_ERROR') {
    return res.status(503).json({
      message: 'Database belum bisa dihubungi. Periksa MySQL dan pengaturan .env.',
    });
  }

  if (error.code === 'ER_NO_SUCH_TABLE') {
    return res.status(503).json({
      message: 'Tabel database belum lengkap. Impor ulang database/database.sql melalui phpMyAdmin.',
    });
  }

  res.status(500).json({
    message: 'Terjadi kendala di server. Coba lagi sebentar.',
  });
}

module.exports = {
  handleError: handleError,
  notFound: notFound,
};
