# Nusa Digital Studio

Website company profile untuk proyek workshop JavaScript, Node.js, Express.js, dan database.
Nama perusahaan, anggota tim, portofolio, testimoni, serta kontak pada website ini adalah
**data simulasi** untuk tugas sekolah.

## Teknologi

- Node.js dan Express.js untuk server, routing, serta REST API.
- MySQL untuk menyimpan layanan dan pesan secara permanen.
- mysql2/promise untuk koneksi database dan query berparameter.
- HTML, CSS, dan JavaScript browser untuk halaman website.
- fetch() untuk menghubungkan browser dengan API.
- Password akun disimpan dalam bentuk hash scrypt; sesi pengguna dan admin memakai cookie
  HttpOnly bertanda tangan HMAC.

## Menjalankan di Windows

1. Pasang Node.js dan MySQL. Jika memakai XAMPP, nyalakan modul MySQL.
2. Buka phpMyAdmin, pilih **Import**, lalu impor file database/database.sql.
   File tersebut membuat database company_profile, tabel layanan, pesan, pengguna, dan
   empat data layanan contoh. Jika database sudah dibuat sebelumnya, impor ulang file ini
   agar tabel pengguna ikut dibuat.
3. Salin .env.example menjadi .env. Di PowerShell:

       Copy-Item .env.example .env

4. Sesuaikan DB_USER dan DB_PASSWORD di .env jika pengaturan MySQL berbeda.
   XAMPP lokal biasanya memakai root dengan password kosong.
5. Di folder proyek, pasang paket dan jalankan server:

       npm install
       npm run dev

6. Buka http://localhost:3000. Pengunjung yang belum login diarahkan ke halaman akun.
   Setelah login atau daftar, website utama terbuka. Area admin ada di http://localhost:3000/admin.html.
   Halaman kesehatan koneksi database: http://localhost:3000/api/health.

Jika memakai nilai awal pada .env.example, kredensial admin demo adalah admin / NusaDemo2026!.
Ganti password dan SESSION_SECRET sebelum mengunggah aplikasi ke internet. Jangan unggah
file .env; file itu sudah masuk .gitignore.

## Fitur sesuai checklist

- Server Express menyajikan website dan endpoint API.
- GET /api/layanan menampilkan layanan yang dibaca dari MySQL.
- POST /api/pesan menyimpan pesan formulir kontak ke MySQL.
- POST, PUT, dan DELETE /api/layanan menambah, mengubah, dan menghapus layanan.
- Halaman admin meminta login sebelum operasi CRUD layanan dan pengelolaan pesan.
- Pengunjung dapat membuat akun dan login lewat halaman Masuk / Daftar.
- Halaman utama meminta login; pengguna tanpa sesi diarahkan ke /akun.html.
- Setelah login atau daftar, pengguna masuk ke website; tombol Keluar mengakhiri sesi.
- Email akun harus unik; password disimpan sebagai hash scrypt di tabel pengguna.
- Pesan dapat dibaca, diberi status, dan dihapus melalui admin.
- Data tersimpan di tabel MySQL, jadi tetap ada setelah server dimulai ulang.
- Input diperiksa di browser dan server; query memakai placeholder tanda tanya.
- Layout dibuat responsif untuk ponsel.
- Kredensial dibaca dari .env, bukan ditulis di kode.

## Endpoint

| Method | Endpoint | Fungsi | Akses |
| --- | --- | --- | --- |
| GET | /api/health | Memeriksa server dan koneksi MySQL | Publik |
| GET | /api/layanan | Membaca semua layanan | Publik |
| GET | /api/layanan/:id | Membaca satu layanan | Publik |
| POST | /api/layanan | Menambahkan layanan | Admin |
| PUT | /api/layanan/:id | Mengubah layanan | Admin |
| DELETE | /api/layanan/:id | Menghapus layanan | Admin |
| POST | /api/pesan | Menyimpan pesan kontak | Publik |
| POST | /api/admin/login | Login admin | Publik |
| POST | /api/admin/logout | Keluar dari sesi admin | Admin |
| GET | /api/admin/pesan | Membaca inbox pesan | Admin |
| PATCH | /api/admin/pesan/:id | Mengubah status pesan | Admin |
| DELETE | /api/admin/pesan/:id | Menghapus pesan | Admin |
| POST | /api/auth/register | Mendaftarkan akun pengguna | Publik |
| POST | /api/auth/login | Login pengguna | Publik |
| GET | /api/auth/me | Membaca akun dari sesi aktif | Login |
| POST | /api/auth/logout | Keluar dari sesi pengguna | Publik |

## Alur data yang bisa dijelaskan saat demo

**Layanan:** browser membuka halaman → app.js menjalankan fetch('/api/layanan') →
Express memilih route GET → controller menjalankan SELECT ke MySQL → server mengirim JSON →
JavaScript membuat kartu layanan di halaman.

**Form kontak:** pengunjung mengisi form → JavaScript mencegah reload halaman dan mengirim
JSON dengan fetch() POST → controller memvalidasi nama, email, dan pesan → query INSERT
menulis pesan ke tabel pesan → server membalas sukses → admin dapat membaca pesan.

**Admin CRUD:** admin login → server memberi cookie sesi HttpOnly yang ditandatangani →
operasi tambah/ubah/hapus mengirim POST/PUT/DELETE → middleware memeriksa cookie →
controller menjalankan INSERT/UPDATE/DELETE dengan placeholder SQL.

**Akun pengguna:** formulir pada akun.html mengirim POST register atau login ke API auth.
Controller menyimpan email dan hash password di tabel pengguna. Setelah berhasil, server
mengirim cookie sesi HttpOnly yang ditandatangani. Halaman meminta GET /api/auth/me untuk
memeriksa sesi. Jika belum login, server mengarahkan pengunjung ke akun.html; jika login,
pengunjung masuk ke halaman utama. Tombol Keluar memanggil endpoint logout dan menghapus cookie.

## Saran demo 10 menit

1. **2 menit:** kenalkan perusahaan dan bagian-bagian profilnya.
2. **5 menit:** daftar akun pengguna lalu login kembali, tampilkan layanan dari database,
   kirim pesan kontak, login admin, lalu tambah, ubah, dan hapus layanan. Buka inbox agar pesan terlihat.
3. **Saat demo:** mulai ulang server dan tunjukkan bahwa layanan masih tersimpan di MySQL.
4. **3 menit:** jawab pertanyaan tentang alur browser → Express → database.

## Struktur kode

    src/
      app.js                    Merangkai middleware, route, dan file statis
      server.js                 Memeriksa database dan menjalankan Express
      config/db.js              Membuat connection pool MySQL
      controllers/              Validasi dan logika database
        auth.controller.js      Daftar, login, dan profil akun pengguna
      middleware/               Login admin, sesi pengguna, dan penanganan error
        userAuth.js             Memeriksa cookie sesi pengguna
      routes/                   Pemetaan URL dan method HTTP
        auth.routes.js          Endpoint daftar, login, profil, dan logout
    public/
      index.html                Company profile
      app.js                    fetch layanan dan submit kontak
      style.css                 Tampilan utama dan versi responsif
      admin.html                Login admin, CRUD layanan, dan inbox
      admin.js                  Interaksi panel admin
      akun.html                 Form login dan pendaftaran pengguna
      akun.js                   Interaksi login dan pendaftaran
      akun.css                  Tampilan halaman akun
    database/database.sql       Database, tabel, dan data awal
    Dockerfile                  Build aplikasi untuk host berbasis container

## Catatan presentasi

Jelaskan dengan kata-katamu sendiri, lalu tunjukkan potongan kode yang berkaitan:

- **Route** menentukan alamat dan method HTTP yang diterima.
- **Controller** memvalidasi input dan mengatur query database.
- **Middleware login** berjalan sebelum operasi admin dan menolak request tanpa cookie sah.
- **Hash scrypt** menyimpan bukti password tanpa menyimpan password aslinya.
- **Connection pool** memakai ulang koneksi MySQL agar server dapat melayani request dengan rapi.
- **CRUD** berarti Create, Read, Update, Delete; di sini dipetakan ke POST, GET, PUT, DELETE.
- **async/await** menunggu operasi database tanpa membekukan server.
- **Placeholder tanda tanya** memisahkan nilai input dari teks SQL dan membantu mencegah SQL injection.
- **.env** menyimpan konfigurasi lokal dan tidak masuk ke Git.

Website ini adalah prototipe pembelajaran. Ganti konten simulasi sebelum dipakai untuk perusahaan
nyata. Untuk publikasi online, gunakan HTTPS, password kuat, dan konfigurasi produksi.

## Troubleshooting daftar atau login

Jika muncul pesan server, pastikan MySQL aktif. Setelah fitur akun ditambahkan, database juga
perlu tabel pengguna. Pilih database company_profile di phpMyAdmin lalu impor ulang
database/database.sql. Perintahnya memakai CREATE TABLE IF NOT EXISTS, jadi tabel dan data lama
tidak dihapus. Setelah itu mulai ulang server dengan npm run dev.

## Siap untuk deploy

Dockerfile disediakan agar host yang mendukung Docker dapat membangun aplikasi ini. Untuk
menjalankan image di komputer lokal:

    docker build -t nusa-digital-studio .
    docker run --env-file .env -p 3000:3000 nusa-digital-studio

Untuk membuat website online, siapkan repository GitHub dan layanan MySQL yang dapat diakses
oleh web host. Impor database/database.sql ke MySQL tersebut. Di dashboard hosting, atur
PORT yang disediakan host serta variabel NODE_ENV, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD,
DB_NAME, SESSION_SECRET, ADMIN_USERNAME, dan ADMIN_PASSWORD. Isi rahasia langsung di dashboard
hosting; jangan masukkan .env ke repository. Setelah host selesai build dan deploy, buka alamat
HTTPS yang diberikan lalu daftar/login untuk masuk ke website.
