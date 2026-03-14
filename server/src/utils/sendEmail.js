const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Send an email using Gmail SMTP.
 * @param {string} to - recipient email
 * @param {string} subject
 * @param {string} html - email body (HTML)
 */
async function sendEmail(to, subject, html) {
    await transporter.sendMail({
        from: `"Campus Link" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
    });
}

module.exports = sendEmail;
