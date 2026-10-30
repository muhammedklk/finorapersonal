import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (user && pass) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });
  }
  return transporter;
}

export async function sendOtpEmail(email, otp, type = 'register') {
  const mailTransporter = getTransporter();
  const isRegister = type === 'register';
  const subject = isRegister 
    ? 'Finora - Verify Your Email (OTP)' 
    : 'Finora - Reset Your Password (OTP)';

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 14px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 12px; background: #6c63ff; color: #ffffff; font-weight: bold; font-size: 20px;">fi</div>
        <h2 style="color: #1e293b; margin: 12px 0 4px; font-size: 22px;">Finora Finance</h2>
        <p style="color: #64748b; font-size: 13px; margin: 0;">${isRegister ? 'Email Verification' : 'Password Reset Request'}</p>
      </div>

      <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px; border: 1px dashed #cbd5e1;">
        <p style="color: #475569; font-size: 13px; margin: 0 0 10px;">Your 6-digit One-Time Password (OTP) is:</p>
        <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #6c63ff; display: inline-block; font-family: monospace;">${otp}</span>
        <p style="color: #94a3b8; font-size: 11px; margin: 10px 0 0;">This OTP will expire in 10 minutes.</p>
      </div>

      <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0;">
        If you did not request this verification code, please ignore this email. Do not share this OTP with anyone.
      </p>

      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0 16px;" />
      <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
        © 2026 Finora · Private & Secure Personal Finance
      </p>
    </div>
  `;

  if (mailTransporter) {
    try {
      await mailTransporter.sendMail({
        from: `"Finora" <${process.env.EMAIL_USER}>`,
        to: email,
        subject,
        html,
      });
      console.log(`[Email] OTP email sent successfully to ${email}`);
      return { success: true, sent: true };
    } catch (err) {
      console.error('[Email Error] Failed to send email via SMTP:', err.message);
      // Fallback: log OTP to console so testing is not completely blocked
      console.log(`[TESTING OTP] Code for ${email} is: ${otp}`);
      return { success: true, sent: false, note: 'Email sending failed, but OTP generated for testing' };
    }
  } else {
    // No email credentials configured in .env yet
    console.log(`[OTP NOTICE] EMAIL_USER/EMAIL_PASS not configured in .env yet.`);
    console.log(`[TESTING OTP] Use OTP: ${otp} for ${email}`);
    return { success: true, sent: false, note: 'EMAIL_USER not set. OTP logged in server console.' };
  }
}

