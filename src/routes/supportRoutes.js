const express = require('express');
const router = express.Router();
const { sendEmail } = require('../utils/emailService');

// @desc    Send support/contact message
// @route   POST /api/support/contact
// @access  Public
router.post('/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Validate input
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Check word limit (350 words)
        const wordCount = message.trim().split(/\s+/).filter(word => word.length > 0).length;
        if (wordCount > 350) {
            return res.status(400).json({
                success: false,
                message: 'Message exceeds 350 word limit'
            });
        }

        // Create email HTML
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6;">
    <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <tr>
            <td style="background: linear-gradient(135deg, #2e7d32 0%, #4caf50 100%); padding: 25px; border-radius: 16px 16px 0 0; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 24px;">🌾 AgriNanban Support</h1>
                <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">New Support Inquiry</p>
            </td>
        </tr>
        
        <!-- Content -->
        <tr>
            <td style="padding: 30px;">
                <!-- Subject -->
                <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
                    <strong style="color: #2e7d32;">Subject:</strong>
                    <span style="color: #1b5e20;">${subject}</span>
                </div>

                <!-- User Info -->
                <table style="width: 100%; margin-bottom: 25px;">
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
                            <strong style="color: #333;">From:</strong>
                            <span style="color: #555;">${name}</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
                            <strong style="color: #333;">Email:</strong>
                            <a href="mailto:${email}" style="color: #4caf50; text-decoration: none;">${email}</a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0;">
                            <strong style="color: #333;">Word Count:</strong>
                            <span style="color: #555;">${wordCount} words</span>
                        </td>
                    </tr>
                </table>

                <!-- Message -->
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
                    <h3 style="margin: 0 0 15px; color: #333; font-size: 16px;">Message:</h3>
                    <p style="margin: 0; color: #444; line-height: 1.7; white-space: pre-wrap;">${message}</p>
                </div>
            </td>
        </tr>
        
        <!-- Footer -->
        <tr>
            <td style="background-color: #263238; padding: 20px; border-radius: 0 0 16px 16px; text-align: center;">
                <p style="margin: 0; color: #b0bec5; font-size: 12px;">
                    This message was sent via AgriNanban Support Form<br>
                    Reply directly to this email to respond to the user.
                </p>
            </td>
        </tr>
        
    </table>
</body>
</html>
        `;

        // Send email to support
        await sendEmail(
            'naveenlakshmanan.c@gmail.com',
            `[AgriNanban Support] ${subject} - from ${name}`,
            htmlContent
        );

        res.json({
            success: true,
            message: 'Your message has been sent successfully'
        });

    } catch (error) {
        console.error('Support contact error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message. Please try again later.'
        });
    }
});

module.exports = router;
