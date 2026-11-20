# Panduan Alur Kode Nusa Digital Studio

Panduan ini menjelaskan arah request dari browser, masuk ke Express, lalu membaca atau
mengubah data di MySQL. Nama dan isi perusahaan adalah simulasi untuk tugas workshop.

## Gambaran paling gampang

Anggap website seperti restoran:

- **Browser** adalah pelanggan yang mengisi form atau menekan tombol.
- **Route** adalah petugas penerima pesanan: memeriksa alamat URL dan jenis request.
- **Middleware** adalah penjaga pintu: memeriksa apakah orang itu sudah login sebagai user/admin.
- **Controller** adalah koki: memeriksa input dan menentukan query database.
- **MySQL** adalah buku catatan permanen tempat layanan, akun, pesan, dan permintaan disimpan.
- **JSON** adalah format jawaban server yang dibaca kembali oleh JavaScript di browser.

> Arah umumnya: **Browser → Express (`src/app.js`) → Route → Middleware bila perlu →
> Controller → MySQL (`src/config/db.js`) → Controller → JSON → Browser**.

## Peta folder

```text
company-profile/
├── database/
│   └── database.sql              Membuat database, tabel, dan layanan contoh
├── scripts/
│   └── init-db.js                Menyiapkan struktur SQL saat Docker container mulai
├── public/                       File yang dilihat browser
│   ├── index.html                Isi halaman profil perusahaan
│   ├── app.js                    Memuat layanan, mengajukan layanan, mengirim pesan
│   ├── style.css                 Tampilan website utama dan versi layar HP
│   ├── akun.html                 Form daftar dan login pengguna
│   ├── akun.js                   Mengirim form akun ke API
│   ├── akun.css                  Tampilan halaman akun
│   ├── admin.html                Login admin dan panel pengelolaan
│   ├── admin.js                  Memanggil API untuk mengelola data admin
│   └── admin.css                 Tampilan dashboard admin
└── src/                           Server Node.js dan Express
    ├── server.js                 Cek MySQL lalu menyalakan server
    ├── app.js                    Menyambungkan middleware, route, dan file public
    ├── config/db.js              Koneksi/pool ke MySQL
    ├── routes/
    │   ├── auth.routes.js        URL daftar/login user
    │   ├── layanan.routes.js     URL baca dan CRUD layanan
    │   ├── permintaan.routes.js  URL pengajuan dan verifikasi layanan
    │   ├── admin.routes.js       URL login admin, CRUD user, dan inbox
    │   └── pesan.routes.js       URL kirim pesan kontak
    ├── controllers/
    │   ├── auth.controller.js   Logika daftar/login user
    │   ├── layanan.controller.js CRUD data layanan
    │   ├── permintaan.controller.js Simpan permintaan dan ubah status verifikasi
    │   ├── admin.controller.js  CRUD user dan pengelolaan pesan
    │   └── pesan.controller.js  Validasi dan simpan pesan kontak
    ├── middleware/
    │   ├── userAuth.js          Pemeriksaan sesi pengguna
    │   ├── adminAuth.js         Pemeriksaan sesi admin
    │   └── errorHandler.js      Jawaban untuk request/error yang gagal
    └── utils/password.js         Membuat dan memeriksa hash password
```

## Saat website dinyalakan

1. `Dockerfile` menyiapkan Node.js, menginstal paket dari `package.json`, lalu menyalin
   folder `src`, `public`, `database`, dan `scripts` ke container.
2. `scripts/init-db.js` membaca `database/database.sql`. Pada hosting, script membuang
   perintah `CREATE DATABASE` dan `USE company_profile`, lalu menjalankan pembuatan tabel
   pada database yang dipilih oleh variabel `DB_NAME`.
3. `npm start` menjalankan `src/server.js`.
4. `server.js` mencoba `SELECT 1` melalui `src/config/db.js`. Kalau database bisa dijangkau,
   server Express mulai menerima request di port dari variabel `PORT`.
5. `src/app.js` memasang pembaca JSON, route API, file statis, dan penanganan error.

`async`/`await` dipakai karena komunikasi dengan MySQL perlu waktu. `await` berarti
“tunggu jawaban operasi ini, lalu lanjutkan”; Node.js tetap bisa melayani pekerjaan lain.

## Alur daftar dan login pengguna

```text
akun.html + akun.js
       │ POST /api/auth/register atau /login
       ▼
src/app.js → src/routes/auth.routes.js
       ▼
src/controllers/auth.controller.js
       ├── utils/password.js membuat / memeriksa hash scrypt
       ├── config/db.js mengirim INSERT atau SELECT
       ▼
MySQL: tabel pengguna
       │ jawaban berhasil + cookie sesi HttpOnly
       ▼
Browser berpindah ke halaman utama (/)
```

Password asli tidak disimpan. Server menyimpan hasil hash di kolom `password_hash`.
Cookie sesi berisi bukti login yang ditandatangani server; kalau nilainya diubah, tanda
tangannya tidak cocok lagi.

Saat halaman utama diminta, `userAuth.requireUserPage` memeriksa cookie dan memastikan ID akun
masih ada di tabel `pengguna`. Jika tidak login, server mengarahkan browser ke `/akun.html`.

## Alur melihat dan mengajukan layanan

```text
public/app.js menjalankan loadServices()
       │ GET /api/layanan
       ▼
src/routes/layanan.routes.js → layanan.controller.js
       │ SELECT ... FROM layanan
       ▼
MySQL mengirim daftar layanan sebagai JSON
       ▼
app.js browser membuat kartu layanan dan tombol “Ajukan layanan”
```

Ketika user menekan tombol **Ajukan layanan**:

1. `public/app.js` mengirim POST `/api/permintaan-layanan` dengan ID layanan.
2. `src/routes/permintaan.routes.js` meneruskan request ke `userAuth.requireUser`.
3. Middleware memeriksa cookie login dan memastikan akun itu masih ada.
4. `permintaan.controller.js` mengambil identitas akun dan nama layanan dari MySQL.
5. Controller menyimpan satu baris ke tabel `permintaan_layanan` dengan status awal
   **menunggu**. Nama layanan, nama pengguna, dan email juga disimpan sebagai salinan agar
   riwayat tetap bisa dibaca jika layanan atau akun nanti dihapus.
6. Server mengirim pesan konfirmasi ke browser. Bagian **Permintaanku** menampilkan status.

Browser memeriksa status kembali setiap 30 detik dan tombol **Perbarui status** juga bisa
digunakan kapan saja. Kalau admin mengubah status, badge berubah menjadi **Terverifikasi**
atau **Belum dapat diproses**, lalu muncul pesan pembaruan di halaman user.

## Alur admin memverifikasi permintaan

```text
admin.html + admin.js
       │ GET /api/permintaan-layanan/admin
       ▼
src/routes/permintaan.routes.js
       │ adminAuth.requireAdmin memeriksa cookie admin
       ▼
permintaan.controller.js → SELECT tabel permintaan_layanan
       ▼
Dashboard menampilkan user, email, layanan, catatan, dan status
```

Saat admin memilih **Verifikasi** atau **Tolak**, `admin.js` mengirim PATCH ke
`/api/permintaan-layanan/admin/:id`. Middleware admin memeriksa sesi lagi, kemudian controller
menjalankan `UPDATE permintaan_layanan SET status = ...`. Saat halaman user membaca data lagi,
perubahan tersebut terlihat di bagian Permintaanku.

## Alur admin mengelola akun user (CRUD)

Semua alamat di bawah dimulai dari `/api/admin/pengguna`. Semuanya wajib melewati
`adminAuth.requireAdmin`.

- **Create / tambah:** admin mengisi nama, email, dan password sementara → POST
  `/api/admin/pengguna` → controller memvalidasi data, membuat hash password, lalu INSERT ke
  `pengguna`.
- **Read / lihat:** dashboard meminta GET `/api/admin/pengguna` → controller mengirim ID,
  nama, email, dan waktu daftar. Kolom hash password sengaja tidak dikirim ke browser.
- **Update / ubah:** tombol Ubah memindahkan data ke form → PUT
  `/api/admin/pengguna/:id` → nama/email diperbarui. Password boleh dikosongkan; jika diisi,
  server membuat hash baru dan mereset password akun tersebut.
- **Delete / hapus:** tombol Hapus meminta konfirmasi → DELETE
  `/api/admin/pengguna/:id` → akun dihapus. Permintaan layanan sebelumnya tetap tersimpan
  sebagai riwayat, tetapi kaitannya dengan akun menjadi kosong.

## Alur pesan kontak

`index.html` memiliki form kontak. `public/app.js` mencegah halaman reload, lalu mengirim
POST `/api/pesan`. `pesan.routes.js` memilih `pesan.controller.js`; controller memvalidasi
input dan menjalankan INSERT ke tabel `pesan`. Admin membaca inbox lewat
GET `/api/admin/pesan`, memperbarui status, atau menghapus pesan.

## File server penting

- `src/app.js`: pusat penyambungan. Di sinilah Express memasang route akun, layanan, pesan,
  admin, dan permintaan layanan.
- `src/routes/*.routes.js`: memetakan method dan URL, misalnya POST `/api/layanan` menuju
  fungsi tambah layanan.
- `src/routes/permintaan.routes.js`: mengirim request layanan ke pemeriksaan login user atau
  pemeriksaan login admin sebelum controller dijalankan.
- `src/routes/admin.routes.js`: memasang endpoint daftar, ubah, hapus pengguna dan inbox admin.
- `src/controllers/*.controller.js`: mengerjakan validasi dan query SQL. HTML tidak langsung
  berbicara ke MySQL.
- `src/controllers/permintaan.controller.js`: membuat permintaan untuk user, menampilkan
  permintaan ke admin, dan menyimpan perubahan status.
- `src/controllers/admin.controller.js`: login admin, CRUD akun pengguna, dan operasi pesan.
- `src/utils/password.js`: satu tempat untuk membuat dan membandingkan hash password; dipakai
  oleh daftar/login user serta form CRUD pengguna admin.
- `src/middleware/adminAuth.js`: menolak endpoint admin jika cookie admin tidak sah.
- `src/middleware/userAuth.js`: memeriksa cookie user dan keberadaan akun di database.
- `src/config/db.js`: membuat connection pool `mysql2`, yaitu kumpulan koneksi yang dipakai
  ulang server.
- `src/middleware/errorHandler.js`: mengubah error server/database menjadi jawaban yang
  lebih ramah bagi browser.
- `database/database.sql`: struktur tabel `layanan`, `pesan`, `pengguna`, dan
  `permintaan_layanan` beserta contoh layanan.
- `public/`: HTML membuat kerangka, CSS mengatur penampilan, dan browser JavaScript
  mengirim/menampilkan data API.
- `.env`: nilai konfigurasi lokal seperti host MySQL dan secret sesi. Jangan unggah isinya
  ke GitHub.

## Cara menjelaskan saat presentasi

> “Website ini memakai HTML, CSS, dan JavaScript di bagian browser. JavaScript mengirim
> request ke Express API menggunakan `fetch`. Route memilih controller, middleware memastikan
> user atau admin punya hak akses, lalu controller membaca atau mengubah MySQL. Hasilnya
> dikirim kembali sebagai JSON dan ditampilkan di halaman. User bisa mengajukan layanan dan
> melihat status verifikasinya. Admin bisa mengelola layanan, permintaan, akun pengguna, dan
> pesan. Password disimpan sebagai hash, bukan teks asli.”

