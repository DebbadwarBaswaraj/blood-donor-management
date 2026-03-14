const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const donorRoutes = require('./routes/donors');
const requestRoutes = require('./routes/requests');
const statsRoutes = require('./routes/stats');
const notificationRoutes = require('./routes/notifications');
const historyRoutes = require('./routes/history');
const appointmentRoutes = require('./routes/appointments');
const hospitalRoutes = require('./routes/hospitals');
const certificateRoutes = require('./routes/certificate');

const app = express();

app.use(cors({
  origin: [
    "https://blood-donor-management.vercel.app",
    "https://blood-donor-management-6ngq.onrender.com",
    "http://localhost:5001",
    "http://127.0.0.1:5001"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/api', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/donor', donorRoutes); // Alias for singular as requested
app.use('/api/requests', requestRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/certificate', certificateRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
