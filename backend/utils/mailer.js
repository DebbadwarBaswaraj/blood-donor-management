const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendEmergencyEmail(to, donorName, patientName, bloodGroup, hospitalName, city, contact) {
    const mailOptions = {
        from: `"Blood Donor Management" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: `🚨 EMERGENCY: ${bloodGroup} Blood Needed in ${city}!`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e1e1e1; border-radius: 10px; overflow: hidden;">
                <div style="background-color: #d32f2f; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0;">Emergency Alert!</h1>
                </div>
                <div style="padding: 30px; color: #333;">
                    <p>Dear <strong>${donorName}</strong>,</p>
                    <p>A new emergency blood request has been posted that matches your blood group (<strong>${bloodGroup}</strong>).</p>
                    
                    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0 0 10px 0;"><strong>Patient:</strong> ${patientName}</p>
                        <p style="margin: 0 0 10px 0;"><strong>Hospital:</strong> ${hospitalName}</p>
                        <p style="margin: 0 0 10px 0;"><strong>City:</strong> ${city}</p>
                        <p style="margin: 0;"><strong>Contact:</strong> <span style="color: #d32f2f; font-weight: bold;">${contact}</span></p>
                    </div>

                    <p>If you are available to help, please contact the person above or log in to your dashboard to view more details.</p>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="http://localhost:3001/dashboard.html" style="background-color: #d32f2f; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
                    </div>
                </div>
                <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 0.8rem; color: #777;">
                    <p>Thank you for being a life-saver!</p>
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${to}: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`Failed to send email to ${to}:`, error.message);
        return false;
    }
}

module.exports = { sendEmergencyEmail };
