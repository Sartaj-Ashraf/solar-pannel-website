// utils/sendPasswordResetEmail.js
import SendEmail from "./SendEmail.js";

const sendPasswordResetEmail = async ({
    name,
    email,
    passwordResetToken,
    origin,
}) => {
    const resetURL = `${origin}/auth/reset-password?token=${passwordResetToken}&email=${email}`;

    const emailTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - Ajaz Furnishers</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f9f9f9;
            }
            
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            
            .header {
                background: linear-gradient(135deg, #8B4513 0%, #5C3317 100%);
                padding: 40px 30px;
                text-align: center;
            }
            
            .header h1 {
                color: #ffffff;
                font-size: 28px;
                font-weight: 600;
                margin-bottom: 10px;
            }
            
            .header p {
                color: #fbe9d0;
                font-size: 16px;
                opacity: 0.9;
            }
            
            .content {
                padding: 40px 30px;
            }
            
            .greeting {
                font-size: 24px;
                color: #2c3e50;
                margin-bottom: 20px;
                font-weight: 500;
            }
            
            .message {
                font-size: 16px;
                color: #555;
                margin-bottom: 30px;
                line-height: 1.7;
            }
            
            .reset-button {
                text-align: center;
                margin: 30px 0;
            }
            
            .btn {
                display: inline-block;
                background: linear-gradient(135deg, #8B4513 0%, #5C3317 100%);
                color: #ffffff;
                text-decoration: none;
                padding: 16px 40px;
                border-radius: 50px;
                font-size: 16px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1px;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(139, 69, 19, 0.3);
            }
            .reset-button a{
                color: #ffffff;
            }
            
            .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(139, 69, 19, 0.5);
            }
            
            .security-note {
                background-color: #fff8e1;
                border-left: 4px solid #ffb300;
                padding: 20px;
                margin: 30px 0;
                border-radius: 0 8px 8px 0;
            }
            
            .security-note h3 {
                color: #795548;
                font-size: 16px;
                margin-bottom: 10px;
                font-weight: 600;
            }
            
            .security-note p {
                color: #6d4c41;
                font-size: 14px;
                line-height: 1.5;
            }
            
            .link-fallback {
                margin-top: 20px;
                padding: 20px;
                background-color: #f8f9fa;
                border-radius: 8px;
                border: 1px dashed #ddd;
            }
            
            .link-fallback p {
                font-size: 14px;
                color: #666;
                margin-bottom: 10px;
            }
            
            .fallback-link {
                word-break: break-all;
                color: #8B4513;
                font-size: 13px;
                font-family: 'Courier New', monospace;
                background-color: #fff;
                padding: 8px;
                border-radius: 4px;
                border: 1px solid #e0e0e0;
            }
            
            .footer {
                background-color: #2c3e50;
                color: #ecf0f1;
                padding: 30px;
                text-align: center;
            }
            
            .footer p {
                font-size: 14px;
                margin-bottom: 10px;
                opacity: 0.8;
            }
            
            .footer .company-name {
                font-weight: 600;
                color: #8B4513;
            }
            
            @media only screen and (max-width: 600px) {
                .email-container {
                    margin: 10px;
                    border-radius: 8px;
                }
                
                .header, .content, .footer {
                    padding: 25px 20px;
                }
                
                .header h1 {
                    font-size: 24px;
                }
                
                .greeting {
                    font-size: 20px;
                }
                
                .btn {
                    padding: 14px 30px;
                    font-size: 15px;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>🔐 Password Reset Request</h1>
                <p>Secure password reset for your Ajaz Furnishers account</p>
            </div>
            
            <div class="content">
                <div class="greeting">
                    Hello ${name}!
                </div>
                
                <div class="message">
                    We received a request to reset your password for your <strong>Ajaz Furnishers</strong> account. 
                    If you requested this change, click the button below to proceed.
                </div>
                
                <div class="reset-button">
                    <a href="${resetURL}" class="btn">
                        🔄 Reset My Password
                    </a>
                </div>
                
                <div class="security-note">
                    <h3>⚠️ Important Security Information</h3>
                    <p>
                        Your reset link will expire in <strong>1 hour</strong> for security reasons. 
                        If you didn’t request this, simply ignore this email—your account remains secure.
                    </p>
                </div>
                
                <div class="link-fallback">
                    <p><strong>Having trouble with the button above?</strong></p>
                    <p>Copy and paste this link into your browser:</p>
                    <div class="fallback-link">${resetURL}</div>
                </div>
                
                <div class="message" style="margin-top: 30px; font-size: 14px; color: #777;">
                    If you need further help or did not make this request, please contact our support team immediately.
                </div>
            </div>
            
            <div class="footer">
                <p>This email was sent by <span class="company-name">Ajaz Furnishers</span></p>
                <p>© ${new Date().getFullYear()} Ajaz Furnishers. All rights reserved.</p>
                <p style="margin-top: 15px; font-size: 12px;">
                    This is an automated message. Please do not reply directly to this email.
                </p>
            </div>
        </div>
    </body>
    </html>
    `;

    return SendEmail({
        to: email,
        subject: "Password Reset Request - Ajaz Furnishers",
        html: emailTemplate,
    });
};

export default sendPasswordResetEmail;
