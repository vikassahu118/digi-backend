// src/utils/mailer.js

const nodemailer = require('nodemailer');

// Configure the email transporter using your Hostinger credentials
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true, // Set to true for port 465 (SSL)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends a password reset email to a user.
 * @param {string} toEmail - The recipient's email address.
 * @param {string} token - The password reset token.
 */
const sendPasswordResetEmail = async (toEmail, token) => {
  // Replace with your frontend's actual URL
const resetUrl = `http://localhost:5173/reset-password?token=${token}`;



  const mailOptions = {
    from: `"ERP Office" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Your Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Password Reset Request</h2>
        <p>You requested a password reset for your ERP Office account.</p>
        <p>Please click the link below to set a new password. This link is valid for one hour.</p>
        <p style="text-align: center;">
          <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        </p>
        <p>If you did not request a password reset, please ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully to:', toEmail);
  } catch (error) {
    console.error('Error sending password reset email:', error);
  }
};

module.exports = { sendPasswordResetEmail };
