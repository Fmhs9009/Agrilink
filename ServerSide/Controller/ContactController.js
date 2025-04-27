const mailSender = require('../utils/mailSender');
const contactEmailTemplate = require('../utils/contactEmailTemplate');

/**
 * Handle contact form submissions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.submitContactForm = async (req, res) => {
  try {
    // Extract form data from request
    const { name, email, phone, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required fields'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Get admin email from environment variables
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.error('ADMIN_EMAIL is not defined in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    // Generate email content using the template
    const emailContent = contactEmailTemplate({
      name,
      email,
      phone,
      subject,
      message
    });

    // Send email to admin
    await mailSender(
      adminEmail,
      `New Contact Form Submission: ${subject || 'No Subject'}`,
      emailContent
    );

    // Send confirmation email to user
    await mailSender(
      email,
      'Thank you for contacting AgriLink',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #10B981; text-align: center;">Thank You for Contacting AgriLink</h2>
          <p>Dear ${name},</p>
          <p>We have received your message and will get back to you as soon as possible.</p>
          <p>For your records, here's a copy of your message:</p>
          <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-left: 4px solid #10B981;">
            <p style="white-space: pre-line;">${message}</p>
          </div>
          <p>If you have any urgent inquiries, please call us directly.</p>
          <p>Best regards,<br>The AgriLink Team</p>
        </div>
      `
    );

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully!'
    });
  } catch (error) {
    console.error('Error in submitContactForm:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send your message. Please try again later.',
      error: error.message
    });
  }
}; 