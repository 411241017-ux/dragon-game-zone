const fs = require('fs');

const gameMap = {
    'mobilelegend.html': 1,
    'genshin.html': 2,
    'valorant.html': 3,
    'freefire.html': 4,
    'pubgmobile.html': 5,
    'lol.html': 6,
    'codm.html': 7,
    'apexlegend.html': 8,
    'steam.html': 9
};

const games = [
    { id: 1, name: 'Mobile Legends' },
    { id: 2, name: 'Genshin Impact' },
    { id: 3, name: 'Valorant' },
    { id: 4, name: 'Free Fire' },
    { id: 5, name: 'PUBG Mobile' },
    { id: 6, name: 'League of Legends' },
    { id: 7, name: 'Call of Duty Mobile' },
    { id: 8, name: 'Apex Legends' },
    { id: 9, name: 'Steam Wallet' }
];

let products = [];
let productId = 1;

for (const [file, id] of Object.entries(gameMap)) {
    if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf-8');
        const matches = content.match(/<div class="item-option">[\s\S]*?<\/div>/g);
        if (matches) {
            matches.forEach(m => {
                const nameMatch = m.match(/<span>(.*?)<\/span>/);
                const priceMatch = m.match(/<small>(.*?)<\/small>/);
                if (nameMatch && priceMatch) {
                    let name = nameMatch[1].trim();
                    let priceStr = priceMatch[1].trim();
                    // parse Rp 1.500 -> 1500
                    let price = priceStr.replace(/Rp\s*/, '').replace(/\./g, '');
                    if (price.endsWith('K')) {
                        price = parseFloat(price.replace('K', '').replace(',', '.')) * 1000;
                    }
                    price = parseInt(price);
                    products.push({ id_produk: productId++, id_game: id, nama_produk: name, harga: price });
                }
            });
        }
    }
}

// Generate database.sql content
const sqlContent = `-- Hapus tabel jika sudah ada (sesuaikan urutan agar tidak kena constraint)
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
${games.map(g => `(${g.id}, '${g.name}', 1)`).join(',\n')};

-- Seed Data Awal untuk Produk
INSERT INTO produk (id_produk, id_game, nama_produk, harga) VALUES 
${products.map(p => `(${p.id_produk}, ${p.id_game}, '${p.nama_produk}', ${p.harga})`).join(',\n')};
`;

fs.writeFileSync('database.sql', sqlContent);
console.log('database.sql updated');

// Generate setup-db.js content
const jsContent = `const mysql = require('mysql2/promise');
const fs = require('fs');

async function setupDatabase() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dragon_game_zone'
    });
    console.log('Connected to database.');

    try {
        const script = fs.readFileSync('database.sql', 'utf8');
        const statements = script.split(';').filter(stmt => stmt.trim() !== '');
        for (const stmt of statements) {
            await connection.query(stmt);
        }
        console.log('Database schema and data loaded successfully from database.sql.');
    } catch (err) {
        console.error('Error setting up database:', err);
    } finally {
        await connection.end();
        console.log('Connection closed.');
    }
}
setupDatabase();`;

fs.writeFileSync('setup-db.js', jsContent);
console.log('setup-db.js updated');
