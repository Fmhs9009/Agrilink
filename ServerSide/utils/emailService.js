const mailSender = require('./mailSender');

/**
 * Send an email using the mailSender utility
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email (or options.to)
 * @param {string} options.subject - Email subject (or options.title)
 * @param {string} options.message - Email body/content (or options.text or options.html)
 * @returns {Promise} - Result of the email sending operation
 */
const sendEmail = async (options) => {
  try {
    // Handle different property naming conventions
    const email = options.email || options.to;
    const subject = options.subject || options.title;
    const message = options.message || options.text || options.html;
    
    if (!email || !subject || !message) {
      throw new Error('Email, subject, and message are required');
    }
    
    // mailSender expects email, title, body - not an options object
    const result = await mailSender(email, subject, message);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send an OTP verification email
 * @param {string} email - Recipient email
 * @param {string} otp - One-time password
 * @returns {Promise} - Result of the email sending operation
 */
const sendOTPEmail = async (email, otp) => {
  const subject = 'AgroLink - Email Verification OTP';
  const message = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #10B981; text-align: center;">AgroLink Email Verification</h2>
      <p>Thank you for registering with AgroLink. Please use the following OTP to verify your email address:</p>
      <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
        ${otp}
      </div>
      <p>This OTP is valid for 10 minutes only.</p>
      <p>If you did not request this verification, please ignore this email.</p>
      <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
        &copy; ${new Date().getFullYear()} AgroLink. All rights reserved.
      </p>
    </div>
  `;
  
  return sendEmail({ email, subject, message });
};

module.exports = {
  sendEmail,
  sendOTPEmail
}; 