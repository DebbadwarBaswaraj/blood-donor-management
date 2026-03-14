# Blood Donor Management System

A full-stack application for managing blood donations, appointments, and donor eligibility.

## Features
- **User Roles**: Admin, Donor, and User.
- **Gender-Based Eligibility**: Automatic calculation of next available donation date (60 days for Males, 90 days for Females).
- **AI Smart Donor Recommendation**: Ranked donor search based on wait-time, location, and availability.
- **Multi-Tier Certificates**: Earn Normal, Elite, Gold, and Hero certificates based on donation count.
- **Appointment System**: Book and manage blood donation appointments.
- **Hospitals & Emergency Requests**: View nearby hospitals and post urgent blood needs.

## Tech Stack
- **Frontend**: HTML5, Vanilla CSS, JavaScript (ES6+).
- **Backend**: Node.js, Express.
- **Database**: MySQL.

## Setup
1. Clone the repository.
2. Install dependencies: `cd backend && npm install`.
3. Configure your MySQL database using `database.sql`.
4. Create a `.env` file in the `backend` directory with your database credentials.
5. Start the server: `npm start`.

## License
MIT
