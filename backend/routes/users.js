const express = require('express');
const db = require('../db');
const router = express.Router();

// Get all users with optional search
router.get('/', async (req, res) => {
    try {
        const { query } = req.query;
        // Use a JOIN to get phone and city from the donors table if available
        let sql = `
            SELECT u.id, u.username, u.email, u.role, d.phone, d.city, u.created_at 
            FROM users u 
            LEFT JOIN donors d ON u.id = d.user_id 
            WHERE u.role = 'User'
        `;
        let params = [];

        if (query) {
            sql += ' AND (u.username LIKE ? OR d.city LIKE ?)';
            params.push(`%${query}%`, `%${query}%`);
        }
        
        sql += ' ORDER BY u.created_at DESC';

        const [rows] = await db.execute(sql, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users: ' + err.message });
    }
});

// Delete user account
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Unlink all dependencies first
            // If they are a donor, they'll have donor records and appointments
            const [donorRows] = await connection.execute('SELECT donor_id FROM donors WHERE user_id = ?', [id]);
            if (donorRows.length > 0) {
                const donorId = donorRows[0].donor_id;
                await connection.execute('DELETE FROM appointments WHERE donor_id = ?', [donorId]);
                await connection.execute('DELETE FROM donations WHERE donor_id = ?', [donorId]);
                await connection.execute('DELETE FROM donors WHERE donor_id = ?', [donorId]);
            }
            // And any appointments they requested
            await connection.execute('DELETE FROM appointments WHERE requester_id = ?', [id]);
            // And emergency requests they posted
            await connection.execute('DELETE FROM emergency_requests WHERE user_id = ?', [id]);
            
            // Delete user
            await connection.execute('DELETE FROM users WHERE id = ?', [id]);

            await connection.commit();
            res.json({ message: 'User deleted successfully' });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete user: ' + err.message });
    }
});

module.exports = router;
