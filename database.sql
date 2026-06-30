-- Hapus tabel jika sudah ada (sesuaikan urutan agar tidak kena constraint)
DROP TABLE IF EXISTS transaksi;
DROP TABLE IF EXISTS produk;
DROP TABLE IF EXISTS game;

-- 1. Entitas Game
CREATE TABLE game (
    id_game INT PRIMARY KEY,
    nama_game VARCHAR(100) NOT NULL,
    status_aktif TINYINT(1) DEFAULT 1
);

-- 2. Entitas Produk
CREATE TABLE produk (
    id_produk INT PRIMARY KEY,
    id_game INT NOT NULL,
    nama_produk VARCHAR(100) NOT NULL,
    harga INT NOT NULL,
    FOREIGN KEY (id_game) REFERENCES game(id_game) ON DELETE CASCADE
);

-- 3. Entitas Transaksi (Remake)
CREATE TABLE transaksi (
    id_transaksi INT AUTO_INCREMENT PRIMARY KEY,
    id_user INT NOT NULL,
    id_produk INT,
    input_user1 VARCHAR(255) NOT NULL,
    input_user2 VARCHAR(255),
    total_amount INT NOT NULL,
    metode_pembayaran VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'Berhasil',
    tanggal_transaksi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_user) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (id_produk) REFERENCES produk(id_produk) ON DELETE CASCADE
);

-- Seed Data Awal untuk Game
INSERT INTO game (id_game, nama_game, status_aktif) VALUES 
(1, 'Mobile Legends', 1),
(2, 'Genshin Impact', 1),
(3, 'Valorant', 1),
(4, 'Free Fire', 1),
(5, 'PUBG Mobile', 1),
(6, 'League of Legends', 1),
(7, 'Call of Duty Mobile', 1),
(8, 'Apex Legends', 1),
(9, 'Steam Wallet', 1);

-- Seed Data Awal untuk Produk
INSERT INTO produk (id_produk, id_game, nama_produk, harga) VALUES 
(1, 1, '5 Diamonds', 1500),
(2, 1, '11 Diamonds', 3000),
(3, 1, '50 Diamonds', 14000),
(4, 1, '250 Diamonds', 70000),
(5, 1, '500 Diamonds', 140000),
(6, 1, '1000 Diamonds', 280000),
(7, 1, '5000 Diamonds', 1400000),
(8, 2, 'Blessing of the Welkin Moon', 79000),
(9, 2, '60 Genesis Crystals', 16500),
(10, 2, '300 Genesis Crystals', 79000),
(11, 2, '980 Genesis Crystals', 249000),
(12, 2, '1980 Genesis Crystals', 510000),
(13, 2, '3280 Genesis Crystals', 790000),
(14, 2, '6480 Genesis Crystals', 1700000),
(15, 3, '475 Points', 48000),
(16, 3, '1000 Points', 96000),
(17, 3, '1475 Points', 145000),
(18, 3, '2050 Points', 193000),
(19, 3, '2525 Points', 242000),
(20, 3, '3050 Points', 290000),
(21, 3, '3650 Points', 336000),
(22, 3, '4125 Points', 384000),
(23, 3, '4650 Points', 433000),
(24, 3, '5350 Points', 483000),
(25, 3, '5700 Points', 530000),
(26, 3, '5825 Points', 531000),
(27, 3, '6350 Points', 580000),
(28, 3, '7400 Points', 677000),
(29, 3, '9000 Points', 820000),
(30, 3, '11000 Points', 949000),
(31, 3, '11475 Points', 999000),
(32, 3, '12000 Points', 1047000),
(33, 3, '13050 Points', 1144000),
(34, 3, '14650 Points', 1287000),
(35, 3, '16350 Points', 1434000),
(36, 3, '22000 Points', 1901000),
(37, 4, '50 Diamonds', 8000),
(38, 4, '100 Diamonds', 15000),
(39, 4, '355 Diamonds', 50000),
(40, 4, '720 Diamonds', 100000),
(41, 5, '60 UC', 15000),
(42, 5, '325 UC', 75000),
(43, 5, '660 UC', 150000),
(44, 5, '1800 UC', 400000),
(45, 6, '575 RP', 50000),
(46, 6, '1380 RP', 120000),
(47, 6, '2800 RP', 240000),
(48, 6, '5000 RP', 400000),
(49, 6, '7200 RP', 560000),
(50, 6, '13500 RP', 1000000),
(51, 7, '80 CP', 15000),
(52, 7, '420 CP', 70000),
(53, 7, '880 CP', 140000),
(54, 7, '2400 CP', 350000),
(55, 7, '5000 CP', 700000),
(56, 7, '10800 CP', 1400000),
(57, 8, '1000 Apex Coins', 150000),
(58, 8, '2150 Apex Coins', 300000),
(59, 8, '4350 Apex Coins', 600000),
(60, 8, '6700 Apex Coins', 900000),
(61, 8, '11500 Apex Coins', 1500000),
(62, 9, 'IDR 12,000 Wallet', 15000),
(63, 9, 'IDR 45,000 Wallet', 58000),
(64, 9, 'IDR 90,000 Wallet', 115000),
(65, 9, 'IDR 250,000 Wallet', 310000),
(66, 9, 'IDR 400,000 Wallet', 490000),
(67, 9, 'IDR 600,000 Wallet', 735000);
