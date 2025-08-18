   import nodemailer from 'nodemailer';

// Email interface for better type safety
interface EmailOptions {
  email: string;
  subject: string;
  message: string;
  html?: string;
}

// Create transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: parseInt(process.env.SMTP_PORT || '587') === 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false // For development
    }
  });
};

export const sendEmail = async (options: EmailOptions) => {
  try {
    // Validate required environment variables
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS in your environment variables.');
    }

    const transporter = createTransporter();

    // Convert plain text message to HTML if no HTML provided
    const htmlContent = options.html || `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Defence Cart</h2>
          <div style="background-color: white; padding: 30px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            ${options.message.replace(/\n/g, '<br>')}
          </div>
          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">
            <p>This is an automated message from Defence Cart. Please do not reply to this email.</p>
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"Defence Cart" <${process.env.SMTP_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: htmlContent
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    console.error("Email sending failed:", error);
    
    if (error instanceof Error) {
      // Provide more specific error messages
      if (error.message.includes('EAUTH')) {
        throw new Error('Email authentication failed. Please check your SMTP credentials.');
      } else if (error.message.includes('ECONNECTION')) {
        throw new Error('Could not connect to email server. Please check your SMTP settings.');
      } else if (error.message.includes('ESOCKET')) {
        throw new Error('Network error while sending email. Please try again.');
      } else {
        throw new Error(`Email sending failed: ${error.message}`);
      }
    } else {
      throw new Error('An unknown error occurred while sending email.');
    }
  }
};