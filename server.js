const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

const app = express();

const JWT_SECRET = process.env.JWT_SECRET || 'dragon_jwt_secret_key';

// Middleware agar server bisa membaca data dari form & JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());

// Hubungkan file HTML statis agar bisa diakses langsung
app.use(express.static(__dirname));

// Rute utama (root) mengarah ke websitegame.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'websitegame.html'));
});

// 1. KONEKSI DATABASE (Menggunakan TiDB / Lingkungan Online)
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 4000,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'dragon_game_zone',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: true // Diwajibkan oleh TiDB Serverless
    }
});

console.log('Terhubung ke database MySQL XAMPP! (Connection Pool aktif)');

// 2. PROSES REGISTER
app.post('/api/register', async (req, res) => {
    const { nama, email, password, confirm_password } = req.body;

    if (password !== confirm_password) {
        return res.status(400).json({ status: 'error', message: 'Password tidak cocok!' });
    }

    // Cek apakah email sudah terdaftar
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json({ status: 'error', message: err.message || err.code || String(err) });
        if (results.length > 0) {
            return res.status(400).json({ status: 'error', message: 'Email sudah terdaftar!' });
        }

        // Enkripsi password menggunakan bcryptjs
        const hashedPassword = await bcrypt.hash(password, 10);

        // Simpan ke database
        db.query('INSERT INTO users (nama, email, password) VALUES (?, ?, ?)', [nama, email, hashedPassword], (err, result) => {
            if (err) return res.status(500).json({ status: 'error', message: err.message || err.code || String(err) });
            
            // Otomatis login menggunakan JWT
            const token = jwt.sign({ id_user: result.insertId, nama_user: nama }, JWT_SECRET, { expiresIn: '7d' });
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 hari
            });

            res.json({ status: 'success', message: 'Registrasi berhasil! Mengalihkan ke halaman utama...' });
        });
    });
});

// 3. PROSES LOGIN
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json({ status: 'error', message: err.message || err.code || String(err) });
        if (results.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Email tidak ditemukan!' });
        }

        const user = results[0];
        // Cek password hash
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).json({ status: 'error', message: 'Password salah!' });
        }

        // Buat JWT Token
        const token = jwt.sign({ id_user: user.id, nama_user: user.nama }, JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 hari
        });

        res.json({ status: 'success', message: `Selamat datang, ${user.nama}!` });
    });
});

// 4. CEK STATUS LOGIN USER (Menggunakan JWT Cookie)
app.get('/api/check-session', (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.json({ loggedIn: false });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.json({ loggedIn: false });
        res.json({ loggedIn: true, nama: decoded.nama_user, id_user: decoded.id_user });
    });
});

// 5. PROSES LOGOUT
app.get('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ status: 'success' });
});

// 6. PROSES TRANSAKSI
app.post('/api/transaksi', (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ status: 'error', message: 'Unauthorized. Harap login terlebih dahulu.' });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ status: 'error', message: 'Token tidak valid. Harap login ulang.' });

        const { total_amount, metode_pembayaran, input_user1, input_user2, id_produk } = req.body;
        const id_user = decoded.id_user;
        
        // Bersihkan string 'Rp ' dan titik (misal 'Rp 79.000' -> 79000) agar sesuai dengan tipe INT di database
        const parsedAmount = parseInt(String(total_amount).replace(/[^0-9]/g, ''), 10) || 0;
        
        const query = 'INSERT INTO transaksi (id_user, id_produk, input_user1, input_user2, total_amount, metode_pembayaran, status) VALUES (?, ?, ?, ?, ?, ?, ?)';
        db.query(query, [id_user, id_produk || null, input_user1, input_user2, parsedAmount, metode_pembayaran, 'Berhasil'], (err, result) => {
            if (err) return res.status(500).json({ status: 'error', message: err.message || err.code || String(err) });
            
            res.json({ status: 'success', message: 'Transaksi berhasil disimpan!' });
        });
    });
});

// 7. AMBIL STATUS GAME
app.get('/api/game-status/:id', (req, res) => {
    const id_game = req.params.id;
    db.query('SELECT status_aktif FROM game WHERE id_game = ?', [id_game], (err, results) => {
        if (err) return res.status(500).json({ status: 'error', message: err.message || err.code || String(err) });
        if (results.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Game tidak ditemukan!' });
        }
        res.json({ status: 'success', status_aktif: results[0].status_aktif });
    });
});

// 8. TEST KONEKSI DATABASE (Untuk Debugging)
app.get('/api/test-db', (req, res) => {
    db.query('SELECT 1 + 1 AS solution', (err, results) => {
        if (err) {
            return res.json({ 
                status: 'error', 
                message: 'Koneksi gagal!', 
                detail_error: err.message || err.code || String(err) 
            });
        }
        res.json({ 
            status: 'success', 
            message: 'Database berhasil terhubung dengan Vercel!',
            data: results
        });
    });
});

// Server berjalan di port 3000 jika dijalankan langsung
if (require.main === module) {
    app.listen(3000, () => {
        console.log('Server DragonGameZone berjalan di http://localhost:3000');
    });
}

// Ekspor untuk testing & Vercel
module.exports = app;