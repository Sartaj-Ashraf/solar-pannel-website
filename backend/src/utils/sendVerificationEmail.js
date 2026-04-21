import SendEmail from "./SendEmail.js";
const sendVerificationEmail = async ({
  name,
  email,
  verificationToken,
  origin,
}) => {
  const verifyEmail = `${origin}/user/verify-email?token=${verificationToken}&email=${email}`;

  const message = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #ffffff;">
      <h2 style="color: #333;">Email Confirmation</h2>
      <p style="font-size: 16px; color: #555;">
        Hello <strong>${name}</strong>,
      </p>
      <p style="font-size: 16px; color: #555;">
        Thank you for registering with us. Please confirm your email address by clicking the button below:
      </p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${verifyEmail}" 
           style="background-color: #0070f3; color: white; text-decoration: none; padding: 12px 24px; border-radius: 5px; font-weight: bold; display: inline-block;">
           Verify Email
        </a>
      </p>
      <p style="font-size: 14px; color: #999;">
        If the button above doesn’t work, copy and paste this URL into your browser:
        <br />
        <a href="${verifyEmail}" style="color: #0070f3;">${verifyEmail}</a>
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="font-size: 12px; color: #999;">
        If you did not create an account, no further action is needed.
      </p>
      <p style="font-size: 12px; color: #999;">
        &copy; ${new Date().getFullYear()} Hotel Devillaz. All rights reserved.
      </p>
    </div>
  `;

  return SendEmail({
    to: email,
    subject: "Please confirm your email address",
    html: message,
  });
};

export default sendVerificationEmail;
