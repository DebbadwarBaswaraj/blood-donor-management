const mysql = require('mysql2/promise');

async function checkSchema() {
    const config = {
        host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
        user: '4Wjck5EzKvQMVJh.root',
        password: 'rhgEqQTdbN73wMqw',
        database: 'test',
        port: 4000,
        ssl: { rejectUnauthorized: false }
    };

    try {
        const connection = await mysql.createConnection(config);
        console.log('--- Checking users table schema ---');
        const [rows] = await connection.query('DESCRIBE users');
        console.log(JSON.stringify(rows, null, 2));
        await connection.end();
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkSchema();
