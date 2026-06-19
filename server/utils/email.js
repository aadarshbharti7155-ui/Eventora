const nodeMailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587, // Render allows this port!
    secure: false, // Must be false for port 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false // This stops strict SSL blocks
    }
});

const sendBookingEmail = async (userEmail, userName, eventTitle) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: 'Your Booking Confirmation',
            html: `<h2>Booking Confirmed</h2>
            <p>Your booking for the event <strong>${eventTitle}</strong> has been confirmed.</p>
            <p>Thank you for choosing our service!</p>`
        };
        await transporter.sendMail(mailOptions);
        console.log(`Booking email sent to ${userEmail}`);
    } catch (error) {
        console.error(`Error sending booking email:`, error);
    }
};

const sendOtpEmail = async (userEmail, otp, type) => {
    try {
        const title = type === 'account_verification' ? 'Verify your Eventora Account' : 'Eventora booking verification';
        const msg = type === 'account_verification' ? `
        Please use the following OTP to verify your new Eventora account:
        ` : `Please use the following OTP to verify and confirm your booking:`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject:  'Your OTP for Account Verification',
            html: `
            <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
                <h2 style="color: #111;">${title}</h2>
                <p style="color: #555; font-size: 16px;">${msg}</p>
                <div style="margin: 20px auto; padding: 15px;  font-size: 24px; font-weight: bold;">${otp}</div>
                <p style="color: #999; font-size: 14px;">This code expires in 5 minutes.</p>
            </div>`
        };
        await transporter.sendMail(mailOptions);
        console.log(`OTP email sent to ${userEmail}`);
    } catch (error) {
        console.error(`Error sending OTP email `, error);
    }
};

module.exports = {sendBookingEmail, sendOtpEmail};