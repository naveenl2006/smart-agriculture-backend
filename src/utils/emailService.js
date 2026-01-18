const nodemailer = require('nodemailer');

// Email transporter configuration
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// OTP Email Template Generator
const generateOTPEmailTemplate = (userName, otp, action, expiryMinutes = 10) => {
    const actionMessages = {
        'password_change': {
            title: 'Password Change Request',
            description: 'You have requested to change your password.',
            icon: '🔐'
        },
        'account_deletion': {
            title: 'Account Deletion Request',
            description: 'You have requested to permanently delete your account.',
            icon: '🗑️'
        },
        'account_deactivation': {
            title: 'Account Deactivation Request',
            description: 'You have requested to deactivate your account.',
            icon: '⏸️'
        },
        'email_verification': {
            title: 'Email Verification',
            description: 'Please verify your email address to complete your registration.',
            icon: '✉️'
        },
        'login_verification': {
            title: 'Login Verification',
            description: 'A login attempt was made to your account.',
            icon: '🔑'
        }
    };

    const { title, description, icon } = actionMessages[action] || {
        title: 'Verification Request',
        description: 'A verification request was initiated for your account.',
        icon: '🔒'
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - AgriNanban</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #2e7d32 0%, #4caf50 100%); padding: 30px 40px; border-radius: 16px 16px 0 0; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                                🌾 AgriNanban
                            </h1>
                            <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                                Smart Agriculture Platform
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <!-- Action Icon & Title -->
                            <div style="text-align: center; margin-bottom: 30px;">
                                <span style="font-size: 48px;">${icon}</span>
                                <h2 style="margin: 16px 0 8px; color: #1a1a1a; font-size: 24px; font-weight: 600;">
                                    ${title}
                                </h2>
                                <p style="margin: 0; color: #666666; font-size: 15px;">
                                    ${description}
                                </p>
                            </div>
                            
                            <!-- Greeting -->
                            <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                                Hello <strong>${userName}</strong>,
                            </p>
                            
                            <p style="margin: 0 0 25px; color: #555555; font-size: 15px; line-height: 1.6;">
                                To proceed with your request, please use the following One-Time Password (OTP):
                            </p>
                            
                            <!-- OTP Box -->
                            <div style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border: 2px solid #4caf50; border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 25px;">
                                <p style="margin: 0 0 10px; color: #2e7d32; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">
                                    Your Verification Code
                                </p>
                                <p style="margin: 0; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1b5e20; font-family: 'Courier New', monospace;">
                                    ${otp}
                                </p>
                            </div>
                            
                            <!-- Expiry Notice -->
                            <div style="background-color: #fff3e0; border-left: 4px solid #ff9800; padding: 15px 20px; border-radius: 0 8px 8px 0; margin-bottom: 25px;">
                                <p style="margin: 0; color: #e65100; font-size: 14px; font-weight: 500;">
                                    ⏱️ This OTP will expire in <strong>${expiryMinutes} minutes</strong>
                                </p>
                                <p style="margin: 8px 0 0; color: #795548; font-size: 13px;">
                                    Please enter this code promptly to complete your request.
                                </p>
                            </div>
                            
                            <!-- Instructions -->
                            <div style="margin-bottom: 25px;">
                                <h3 style="margin: 0 0 12px; color: #333333; font-size: 16px; font-weight: 600;">
                                    📋 How to use this OTP:
                                </h3>
                                <ol style="margin: 0; padding-left: 20px; color: #555555; font-size: 14px; line-height: 1.8;">
                                    <li>Return to the AgriNanban application</li>
                                    <li>Enter the 6-digit OTP code shown above</li>
                                    <li>Complete your verification to proceed</li>
                                </ol>
                            </div>
                            
                            <!-- Security Warning -->
                            <div style="background-color: #ffebee; border: 1px solid #ef9a9a; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                                <h4 style="margin: 0 0 10px; color: #c62828; font-size: 15px; font-weight: 600;">
                                    🚨 Security Alert
                                </h4>
                                <p style="margin: 0; color: #b71c1c; font-size: 14px; line-height: 1.6;">
                                    If you did <strong>NOT</strong> initiate this request, please ignore this email and consider changing your password immediately. Your account may be at risk.
                                </p>
                                <p style="margin: 12px 0 0; color: #c62828; font-size: 13px;">
                                    <strong>Never share this OTP with anyone.</strong> AgriNanban staff will never ask for your OTP.
                                </p>
                            </div>
                            
                            <!-- Divider -->
                            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                            
                            <!-- Help Section -->
                            <p style="margin: 0; color: #777777; font-size: 14px; line-height: 1.6;">
                                Need help? Contact our support team at 
                                <a href="mailto:support@agrinanban.com" style="color: #4caf50; text-decoration: none; font-weight: 500;">
                                    support@agrinanban.com
                                </a>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #263238; padding: 30px 40px; border-radius: 0 0 16px 16px; text-align: center;">
                            <p style="margin: 0 0 10px; color: #ffffff; font-size: 16px; font-weight: 600;">
                                🌾 AgriNanban - உழவனுக்கு ஒரு நண்பன்
                            </p>
                            <p style="margin: 0 0 15px; color: #b0bec5; font-size: 13px;">
                                Your trusted companion in smart farming
                            </p>
                            <div style="margin-bottom: 15px;">
                                <a href="#" style="color: #81c784; text-decoration: none; font-size: 13px; margin: 0 10px;">Website</a>
                                <span style="color: #546e7a;">|</span>
                                <a href="#" style="color: #81c784; text-decoration: none; font-size: 13px; margin: 0 10px;">Privacy Policy</a>
                                <span style="color: #546e7a;">|</span>
                                <a href="#" style="color: #81c784; text-decoration: none; font-size: 13px; margin: 0 10px;">Terms of Service</a>
                            </div>
                            <p style="margin: 0; color: #78909c; font-size: 12px;">
                                © 2026 AgriNanban. All rights reserved.
                            </p>
                            <p style="margin: 10px 0 0; color: #546e7a; font-size: 11px;">
                                This is an automated message. Please do not reply directly to this email.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
};

// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP Email
const sendOTPEmail = async (userEmail, userName, otp, action, expiryMinutes = 10) => {
    const actionSubjects = {
        'password_change': 'Password Change Verification',
        'account_deletion': 'Account Deletion Verification',
        'account_deactivation': 'Account Deactivation Verification',
        'email_verification': 'Verify Your Email Address',
        'login_verification': 'Login Verification Code'
    };

    const subject = actionSubjects[action] || 'Verification Code';
    const htmlContent = generateOTPEmailTemplate(userName, otp, action, expiryMinutes);

    const mailOptions = {
        from: `"AgriNanban" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: `🔐 ${subject} - AgriNanban`,
        html: htmlContent,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('OTP Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending OTP email:', error);
        throw new Error('Failed to send OTP email');
    }
};

// Send generic email
const sendEmail = async (to, subject, htmlContent) => {
    const mailOptions = {
        from: `"AgriNanban" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html: htmlContent,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email');
    }
};

module.exports = {
    transporter,
    generateOTP,
    generateOTPEmailTemplate,
    sendOTPEmail,
    sendEmail,
};
