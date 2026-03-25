const mysql = require('mysql2/promise');

async function fixSchema() {
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
        console.log('--- Fixing Database Schema ---');
        
        // 1. Add created_at to users
        try {
            await connection.execute('ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
            console.log('SUCCESS: users.created_at added.');
        } catch (e) {
            console.log('NOTICE: users.created_at already exists or error:', e.message);
        }

        // 2. Check if users has phone (it shouldn't) - and remove it if it does
        const [usersCols] = await connection.query('DESCRIBE users');
        const hasPhoneInUsers = usersCols.some(c => c.Field === 'phone');
        if (hasPhoneInUsers) {
             await connection.execute('ALTER TABLE users DROP COLUMN phone');
             console.log('SUCCESS: users.phone dropped (it should be in donors).');
        }

        // 3. Ensure donors has phone
        const [donorsCols] = await connection.query('DESCRIBE donors');
        const hasPhoneInDonors = donorsCols.some(c => c.Field === 'phone');
        if (!hasPhoneInDonors) {
             await connection.execute('ALTER TABLE donors ADD COLUMN phone VARCHAR(20)');
             console.log('SUCCESS: donors.phone added.');
        }
        
        await connection.end();
        console.log('Schema fixed!');
    } catch (err) {
        console.error('Error during schema fix:', err.message);
    }
}

fixSchema();
