const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware agar server bisa membaca data dari form & JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Konfigurasi Session (Pengganti session_start di PHP)
app.use(session({
    secret: 'dragon_secret_key',
    resave: false,
    saveUninitialized: true
}));

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
        if (err) return res.status(500).json({ status: 'error', message: err.message });
        if (results.length > 0) {
            return res.status(400).json({ status: 'error', message: 'Email sudah terdaftar!' });
        }

        // Enkripsi password menggunakan bcryptjs
        const hashedPassword = await bcrypt.hash(password, 10);

        // Simpan ke database
        db.query('INSERT INTO users (nama, email, password) VALUES (?, ?, ?)', [nama, email, hashedPassword], (err, result) => {
            if (err) return res.status(500).json({ status: 'error', message: err.message });
            
            // Otomatis login setelah berhasil daftar
            req.session.login = true;
            req.session.nama_user = nama;

            res.json({ status: 'success', message: 'Registrasi berhasil! Mengalihkan ke halaman utama...' });
        });
    });
});

// 3. PROSES LOGIN
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json({ status: 'error', message: err.message });
        if (results.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Email tidak ditemukan!' });
        }

        const user = results[0];
        // Cek password hash
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).json({ status: 'error', message: 'Password salah!' });
        }

        // Set data session jika berhasil login
        req.session.login = true;
        req.session.nama_user = user.nama;

        res.json({ status: 'success', message: `Selamat datang, ${user.nama}!` });
    });
});

// 4. CEK STATUS LOGIN USER (Dipakai di halaman utama)
app.get('/api/check-session', (req, res) => {
    if (req.session.login) {
        res.json({ loggedIn: true, nama: req.session.nama_user });
    } else {
        res.json({ loggedIn: false });
    }
});

// 5. PROSES LOGOUT
app.get('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ message: 'Gagal logout' });
        res.json({ status: 'success' });
    });
});

// 6. TEST KONEKSI DATABASE (Untuk Debugging)
app.get('/api/test-db', (req, res) => {
    db.query('SELECT 1 + 1 AS solution', (err, results) => {
        if (err) {
            return res.json({ 
                status: 'error', 
                message: 'Koneksi gagal!', 
                detail_error: err.message 
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