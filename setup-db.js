const mysql = require('mysql2/promise');
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
setupDatabase();