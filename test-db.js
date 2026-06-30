const mysql = require('mysql2');

const db = mysql.createPool({
    host: 'gateway01.ap-southeast-1.prod.alicloud.tidbcloud.com',
    port: 4000,
    user: '2YSAfyVwjBUMovh.root',
    password: 'CCvHi5nfuPYMdfSt',
    database: 'test',
    ssl: {
        rejectUnauthorized: true
    }
});

db.query('SELECT 1', (err, results) => {
    if (err) {
        console.error('Connection failed:', err.message);
    } else {
        console.log('Connection successful!', results);
    }
    process.exit();
});
