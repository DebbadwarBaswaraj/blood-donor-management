const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    const { username, email, password, role, donorDetails } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.execute(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, role]
        );

        const userId = result.insertId;

        if (role === 'Donor' && donorDetails) {
            const {
                full_name = '',
                phone = '',
                blood_group = '',
                age = 0,
                gender = '',
                address = '',
                city = '',
                state = '',
                last_donation_date = null,
                availability = 'Available'
            } = donorDetails;

            await db.execute(
                'INSERT INTO donors (user_id, full_name, phone, blood_group, age, gender, address, city, state, last_donation_date, availability) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [userId, full_name, phone, blood_group, age || 0, gender, address, city, state, last_donation_date || null, availability]
            );
        }

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Email already exists' });
        }
        console.error(err);
        res.status(500).json({ error: 'Registration failed: ' + err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            token,
            user: { id: user.id, username: user.username, email: user.email, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ error: 'Login failed: ' + err.message });
    }
});

module.exports = router;
