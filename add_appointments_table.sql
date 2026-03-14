CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requester_id INT NOT NULL, -- user_id of the person requesting
    donor_id INT NOT NULL,     -- donor_id of the target donor
    appointment_date DATE NOT NULL,
    appointment_time TIME,
    hospital_name VARCHAR(255) NOT NULL,
    message TEXT,
    status ENUM('Pending', 'Accepted', 'Declined', 'Completed', 'Cancelled') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (donor_id) REFERENCES donors(donor_id) ON DELETE CASCADE
);
