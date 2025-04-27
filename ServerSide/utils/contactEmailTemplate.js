/**
 * Generate HTML email template for contact form submissions
 * @param {Object} data - Contact form data
 * @returns {string} - HTML email template
 */
const contactEmailTemplate = (data) => {
  const { name, email, phone, subject, message } = data;
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #10B981; text-align: center;">AgriLink Contact Form Submission</h2>
      
      <div style="background-color: #f5f5f5; padding: 15px; margin-bottom: 20px;">
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Subject:</strong> ${subject || 'No subject'}</p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #4B5563;">Message:</h3>
        <p style="white-space: pre-line;">${message}</p>
      </div>
      
      <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
        This message was sent from the AgriLink contact form at ${new Date().toLocaleString()}.
      </p>
    </div>
  `;
};

module.exports = contactEmailTemplate; 