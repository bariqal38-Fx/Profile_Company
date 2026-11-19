require('dotenv').config();

const app = require('./app');
const db = require('./config/db');
const port = Number(process.env.PORT || 3000);
let server;

async function start() {
  try {
    await db.query('SELECT 1');
    server = app.listen(port, function () {
      console.log('Nusa Digital Studio berjalan di http://localhost:' + port);
      console.log('Halaman admin tersedia di http://localhost:' + port + '/admin.html');
    });
  } catch (error) {
    console.error('MySQL belum terhubung. Nyalakan MySQL, impor database/database.sql, lalu cek .env.');
    console.error('Detail:', error.message);
    process.exitCode = 1;
  }
}

async function stop() {
  if (server) {
    await new Promise(function (resolve) {
      server.close(resolve);
    });
  }
  await db.end();
}

process.on('SIGINT', function () {
  stop().finally(function () {
    process.exit(0);
  });
});

process.on('SIGTERM', function () {
  stop().finally(function () {
    process.exit(0);
  });
});

start();
