const express = require('express');
const db = require('../db');
const router = express.Router();

// Get all hospitals or search by blood group and hospital name
router.get('/', async (req, res) => {
    const { blood_group, hospital_name } = req.query;
    
    // Requirement: Link hospitals with donor donation records
    // Requirement: Fetch real hospital data where donors donated blood
    let query = `
        SELECT DISTINCT h.id, h.name, h.address, h.city, h.contact_number, 
               h.available_blood_groups, h.required_blood_groups
        FROM hospitals h
        INNER JOIN donations d ON h.name = d.hospital_name
        WHERE 1=1
    `;
    const params = [];

    if (blood_group) {
        query += ' AND (h.available_blood_groups LIKE ? OR h.required_blood_groups LIKE ?)';
        params.push(`%${blood_group}%`, `%${blood_group}%`);
    }

    if (hospital_name) {
        query += ' AND h.name LIKE ?';
        params.push(`%${hospital_name}%`);
    }

    try {
        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch hospitals: ' + err.message });
    }
});

// Add a new hospital (Admin)
router.post('/', async (req, res) => {
    const { name, address, city, contact_number, available_blood_groups, required_blood_groups } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO hospitals (name, address, city, contact_number, available_blood_groups, required_blood_groups) VALUES (?, ?, ?, ?, ?, ?)',
            [name, address, city, contact_number, available_blood_groups, required_blood_groups]
        );
        res.status(201).json({ message: 'Hospital added successfully', id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add hospital: ' + err.message });
    }
});

// Update hospital blood requirements (Admin/Hospital)
router.put('/:id', async (req, res) => {
    const { available_blood_groups, required_blood_groups } = req.body;
    try {
        await db.execute(
            'UPDATE hospitals SET available_blood_groups = ?, required_blood_groups = ? WHERE id = ?',
            [available_blood_groups, required_blood_groups, req.params.id]
        );
        res.json({ message: 'Hospital updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update hospital: ' + err.message });
    }
});

module.exports = router;
