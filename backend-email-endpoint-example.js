// backend-email-endpoint-example.js
// This is an example Express.js endpoint for sending QR code emails via SMTP2GO
// Place this in your backend server (e.g., Node.js/Express, Python/Flask, etc.)

const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

// SMTP2GO Configuration
const SMTP2GO_CONFIG = {
  host: 'mail.smtp2go.com',
  port: 2525, // or 587, 25, 465
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP2GO_USERNAME, // Your SMTP2GO username
    pass: process.env.SMTP2GO_PASSWORD, // Your SMTP2GO password
  },
};

// Alternative: Using SMTP2GO API directly
const SMTP2GO_API_KEY = process.env.SMTP2GO_API_KEY;
const SMTP2GO_API_URL = 'https://api.smtp2go.com/v3/email/send';

/**
 * POST /api/send-email
 * Sends QR code email to a camper
 * 
 * Body:
 * {
 *   "to": "camper@example.com",
 *   "subject": "Your Camper QR Code", 
 *   "name": "John Doe",
 *   "camperCode": "CAMP2024001",
 *   "qrBase64": "base64_string_without_data_prefix"
 * }
 */

// Method 1: Using Nodemailer with SMTP2GO SMTP
router.post('/send-email', async (req, res) => {
  try {
    const { to, subject, name, camperCode, qrBase64 } = req.body;

    // Validate required fields
    if (!to || !subject || !name || !camperCode || !qrBase64) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: to, subject, name, camperCode, qrBase64'
      });
    }

    // Create transporter
    const transporter = nodemailer.createTransporter(SMTP2GO_CONFIG);

    // Email template
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Your Camper QR Code Card</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c5aa0;">Your Camper QR Code Card</h2>
            
            <p>Hi <strong>${name}</strong>,</p>
            
            <p>Attached is your official NBC 2025 camper identification card containing your QR code.</p>
            <p>Please save this card and bring it with you to the camp for identification purposes.</p>
            
            <div style="text-align: center; margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
              <p><strong>Camper Code: ${camperCode}</strong></p>
              <p style="margin: 0; color: #666; font-size: 14px;">Your identification card is attached to this email</p>
            </div>
            
            <p><strong>Important:</strong></p>
            <ul>
              <li>Save the attached card image to your phone or print it out</li>
              <li>Bring your card to all camp activities for identification</li>
              <li>Keep your camper code handy for quick reference</li>
            </ul>
            
            <p>If you have any questions, please don't hesitate to contact us.</p>
            
            <p>Regards,<br>
            <strong>NBC 2025 Camp Management Team</strong></p>
          </div>
        </body>
      </html>
    `;

    const textTemplate = `
Hi ${name},

Attached is your official NBC 2025 camper identification card containing your QR code.
Please save this card and bring it with you to the camp for identification purposes.

Camper Code: ${camperCode}

IMPORTANT:
- Save the attached card image to your phone or print it out
- Bring your card to all camp activities for identification  
- Keep your camper code handy for quick reference

If you have any questions, please don't hesitate to contact us.

Regards,
NBC 2025 Camp Management Team
    `;

    // Mail options
    const mailOptions = {
      from: {
        name: 'Camp Management',
        address: process.env.FROM_EMAIL || 'noreply@yourcamp.com'
      },
      to: to,
      subject: subject,
      text: textTemplate,
      html: htmlTemplate,
      attachments: [
        {
          filename: `NBC2025_ID_Card_${camperCode}.png`,
          content: qrBase64,
          encoding: 'base64',
          contentType: 'image/png'
        }
      ]
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', info.messageId);
    
    res.json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
});

// Method 2: Using SMTP2GO API directly (alternative approach)
router.post('/send-email-api', async (req, res) => {
  try {
    const { to, subject, name, camperCode, qrBase64 } = req.body;

    if (!to || !subject || !name || !camperCode || !qrBase64) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const htmlContent = `
      <h2>Your Camper QR Code Card</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Attached is your official NBC 2025 camper identification card containing your QR code.</p>
      <p>Please save this card and bring it with you to the camp for identification purposes.</p>
      <p><strong>Camper Code: ${camperCode}</strong></p>
      <p>Regards,<br><strong>NBC 2025 Camp Management Team</strong></p>
    `;

    const apiPayload = {
      api_key: SMTP2GO_API_KEY,
      to: [to],
      sender: process.env.FROM_EMAIL || 'noreply@yourcamp.com',
      subject: subject,
      html_body: htmlContent,
      text_body: `Hi ${name}, Attached is your official NBC 2025 camper identification card. Camper Code: ${camperCode}. Please save this card and bring it to camp. Regards, NBC 2025 Camp Management Team`,
      attachments: [
        {
          filename: `NBC2025_ID_Card_${camperCode}.png`,
          fileblob: qrBase64,
          mimetype: 'image/png'
        }
      ]
    };

    const response = await fetch(SMTP2GO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiPayload)
    });

    const result = await response.json();

    if (result.data && result.data.succeeded > 0) {
      res.json({
        success: true,
        message: 'Email sent successfully',
        result: result
      });
    } else {
      throw new Error(result.data?.error || 'Failed to send email');
    }

  } catch (error) {
    console.error('Error sending email via API:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
});

module.exports = router;

/* 
Environment Variables needed (.env file):

SMTP2GO_USERNAME=your_smtp2go_username
SMTP2GO_PASSWORD=your_smtp2go_password
SMTP2GO_API_KEY=your_smtp2go_api_key
FROM_EMAIL=noreply@yourcamp.com

Installation (if using nodemailer):
npm install express nodemailer

Usage in your main Express app:
const emailRoutes = require('./backend-email-endpoint-example');
app.use('/api', emailRoutes);
*/
