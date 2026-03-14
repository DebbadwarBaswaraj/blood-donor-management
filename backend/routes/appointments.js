const express = require('express');
const db = require('../db');
const router = express.Router();

const fs = require('fs');
const path = require('path');
const logFile = path.join(__dirname, '../debug.log');

// Create appointment request
router.post('/', async (req, res) => {
    const logMsg = `[${new Date().toISOString()}] Incoming: ${JSON.stringify(req.body)}\n`;
    fs.appendFileSync(logFile, logMsg);
    
    const { requester_id, donor_id, appointment_date, appointment_time, hospital_name, message } = req.body;
    try {
        await db.execute(
            'INSERT INTO appointments (requester_id, donor_id, appointment_date, appointment_time, hospital_name, message) VALUES (?, ?, ?, ?, ?, ?)',
            [requester_id, donor_id, appointment_date, appointment_time, hospital_name, message]
        );
        res.status(201).json({ message: 'Appointment request sent successfully' });
    } catch (err) {
        const errMsg = `[${new Date().toISOString()}] Error: ${err.message}\n`;
        fs.appendFileSync(logFile, errMsg);
        res.status(500).json({ error: 'Failed to send request: ' + err.message });
    }
});

// Get appointments for a donor (incoming requests)
router.get('/donor/:userId', async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT a.*, u.username as requester_name, u.email as requester_email
            FROM appointments a
            JOIN users u ON a.requester_id = u.id
            JOIN donors d ON a.donor_id = d.donor_id
            WHERE d.user_id = ?
            ORDER BY a.appointment_date ASC
        `, [req.params.userId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch appointments: ' + err.message });
    }
});

// Get appointments for a requester (outgoing requests)
router.get('/requester/:userId', async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT a.*, d.full_name as donor_name, d.blood_group
            FROM appointments a
            JOIN donors d ON a.donor_id = d.donor_id
            WHERE a.requester_id = ?
            ORDER BY a.appointment_date ASC
        `, [req.params.userId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch appointments: ' + err.message });
    }
});

// Update appointment status
router.patch('/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
        await db.execute('UPDATE appointments SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ message: 'Appointment status updated' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update status: ' + err.message });
    }
});

module.exports = router;
