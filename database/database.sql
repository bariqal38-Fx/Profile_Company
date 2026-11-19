CREATE DATABASE IF NOT EXISTS company_profile
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE company_profile;

CREATE TABLE IF NOT EXISTS layanan (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nama VARCHAR(100) NOT NULL,
  kategori VARCHAR(60) NOT NULL,
  deskripsi VARCHAR(500) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS pesan (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nama VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  perusahaan VARCHAR(120) NULL,
  pesan TEXT NOT NULL,
  status ENUM('baru', 'dibaca', 'ditangani') NOT NULL DEFAULT 'baru',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS pengguna (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nama VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pengguna_email (email)
);

INSERT INTO layanan (nama, kategori, deskripsi)
SELECT 'Website untuk Bisnis', 'Digital', 'Website profil bisnis yang cepat, mudah digunakan, dan nyaman dibuka lewat ponsel maupun laptop.'
WHERE NOT EXISTS (SELECT 1 FROM layanan WHERE nama = 'Website untuk Bisnis');

INSERT INTO layanan (nama, kategori, deskripsi)
SELECT 'Identitas Visual', 'Branding', 'Rancangan logo dan panduan visual agar usaha tampil konsisten di berbagai media.'
WHERE NOT EXISTS (SELECT 1 FROM layanan WHERE nama = 'Identitas Visual');

INSERT INTO layanan (nama, kategori, deskripsi)
SELECT 'Toko Online', 'E-commerce', 'Katalog produk dan pengalaman belanja digital yang membantu pelanggan menemukan produk dengan mudah.'
WHERE NOT EXISTS (SELECT 1 FROM layanan WHERE nama = 'Toko Online');

INSERT INTO layanan (nama, kategori, deskripsi)
SELECT 'Perawatan Website', 'Dukungan', 'Pembaruan konten, pemeriksaan rutin, dan bantuan teknis untuk menjaga website tetap siap digunakan.'
WHERE NOT EXISTS (SELECT 1 FROM layanan WHERE nama = 'Perawatan Website');
