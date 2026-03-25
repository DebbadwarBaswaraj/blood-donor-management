const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
    const config = {
        host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
        user: '4Wjck5EzKvQMVJh.root',
        password: 'rhgEqQTdbN73wMqw',
        database: 'test',
        port: 4000,
        ssl: { rejectUnauthorized: false },
        multipleStatements: true
    };

    try {
        const connection = await mysql.createConnection(config);
        console.log('--- Setting up tables on TiDB Cloud ---');
        
        // Read database.sql
        let sql = fs.readFileSync(path.join(__dirname, '../database.sql'), 'utf8');
        
        // Remove CREATE DATABASE and USE commands to avoid confusion, 
        // as we are already connected to 'test' and multi-DB can be tricky on some Cloud tiers
        sql = sql.replace(/CREATE DATABASE IF NOT EXISTS blood_donor_db;/gi, '');
        sql = sql.replace(/USE blood_donor_db;/gi, '');

        await connection.query(sql);
        console.log('SUCCESS: All tables created in "test" database.');
        
        const [tables] = await connection.query('SHOW TABLES');
        console.log('Final tables list:', tables.map(t => Object.values(t)[0]).join(', '));
        
        await connection.end();
    } catch (err) {
        console.error('ERROR during setup:', err.message);
    }
}

setupDatabase();
