const express = require('express');
const db = require('../db');
const router = express.Router();

const { sendEmergencyEmail } = require('../utils/mailer');

// Create emergency request
router.post('/', async (req, res) => {
    const { patient_name, blood_group_needed, hospital_name, city, contact_number, required_date, message } = req.body;
    try {
        await db.execute(
            'INSERT INTO emergency_requests (patient_name, blood_group_needed, hospital_name, city, contact_number, required_date, message) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [patient_name, blood_group_needed, hospital_name, city, contact_number, required_date, message]
        );

        // --- Start Email Notification Flow ---
        // 1. Find all donors with matching blood group
        const [matchingDonors] = await db.execute(`
            SELECT d.full_name, u.email 
            FROM donors d 
            JOIN users u ON d.user_id = u.id 
            WHERE d.blood_group = ? AND d.availability = 'Available'
        `, [blood_group_needed]);

        // 2. Trigger emails (async, don't block response)
        if (matchingDonors.length > 0) {
            console.log(`Found ${matchingDonors.length} matching donors for ${blood_group_needed}. Sending alerts...`);
            
            matchingDonors.forEach(donor => {
                sendEmergencyEmail(
                    donor.email,
                    donor.full_name,
                    patient_name,
                    blood_group_needed,
                    hospital_name,
                    city,
                    contact_number
                );
            });
        }
        // --- End Email Notification Flow ---

        res.status(201).json({ message: 'Request created successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create request: ' + err.message });
    }
});

// Get all requests
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM emergency_requests ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch requests: ' + err.message });
    }
});

module.exports = router;
