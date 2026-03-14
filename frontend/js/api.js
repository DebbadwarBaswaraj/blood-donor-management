const API_BASE_URL = "https://blood-donor-management.onrender.com";
const API_URL = `${API_BASE_URL}/api`;

const api = {
    async register(userData) {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        return response.json();
    },

    async login(credentials) {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        return response.json();
    },

    async getDonors() {
        const response = await fetch(`${API_URL}/donors`);
        return response.json();
    },

    async searchDonors(filters) {
        const query = new URLSearchParams(filters).toString();
        const response = await fetch(`${API_URL}/donors/search?${query}`);
        return response.json();
    },

    async createRequest(requestData) {
        const response = await fetch(`${API_URL}/requests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });
        return response.json();
    },

    async getRequests() {
        const response = await fetch(`${API_URL}/requests`);
        return response.json();
    },

    async getStats() {
        const response = await fetch(`${API_URL}/stats`);
        return response.json();
    },

    async recordDonation(userId, donationDate, extra = {}) {
        const response = await fetch(`${API_URL}/donors/${userId}/donate`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ donationDate, ...extra })
        });
        return response.json();
    },

    async getHistory(userId) {
        const res = await fetch(`${API_URL}/history/${userId}`);
        return await res.json();
    },

    // Appointments
    async createAppointment(appointmentData) {
        const res = await fetch(`${API_URL}/appointments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appointmentData)
        });
        return await res.json();
    },

    async getDonorAppointments(userId) {
        const res = await fetch(`${API_URL}/appointments/donor/${userId}`);
        return await res.json();
    },

    async getRequesterAppointments(userId) {
        const res = await fetch(`${API_URL}/appointments/requester/${userId}`);
        return await res.json();
    },

    async updateAppointmentStatus(id, status) {
        const res = await fetch(`${API_URL}/appointments/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        return await res.json();
    },

    // Hospitals
    async getHospitals(filters = {}) {
        const query = new URLSearchParams(filters).toString();
        const response = await fetch(`${API_URL}/hospitals?${query}`);
        return response.json();
    },

    async updateHospital(id, data) {
        const response = await fetch(`${API_URL}/hospitals/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    // Admin Tools 
    async updateDonorStatus(id, status) {
        const res = await fetch(`${API_URL}/donors/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ availability: status })
        });
        return await res.json();
    },
    
    async deleteDonor(id) {
        const res = await fetch(`${API_URL}/donors/${id}`, {
            method: 'DELETE'
        });
        return await res.json();
    },

    async getUsers(filters = {}) {
        const query = new URLSearchParams(filters).toString();
        const res = await fetch(`${API_URL}/users?${query}`);
        return await res.json();
    },

    async deleteUser(id) {
        const res = await fetch(`${API_URL}/users/${id}`, {
            method: 'DELETE'
        });
        return await res.json();
    },

    // Certificate
    async checkCertificateEligibility(userId) {
        const res = await fetch(`${API_URL}/certificate/${userId}/eligible`);
        return await res.json();
    },

    downloadCertificate(userId) {
        // Opens the PDF download directly in a new tab / triggers browser download
        window.open(`${API_URL}/certificate/${userId}`, '_blank');
    },

    // Gender-aware donor dashboard data
    async getDonorDashboard(userId) {
        const res = await fetch(`${API_URL}/donors/dashboard/${userId}`);
        return await res.json();
    }
};

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return null;
    }
    return JSON.parse(localStorage.getItem('user'));
}
