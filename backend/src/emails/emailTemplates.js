/**
 * Escapes HTML special characters to prevent XSS in email templates.
 */
function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function createWelcomeEmailTemplate(name, clientURL) {
  const safeName = escapeHtml(name);
  const safeURL = escapeHtml(clientURL);

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Loqui</title>
  </head>
  <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    <div style="background: linear-gradient(to right, #36D1DC, #5B86E5); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 500;">Welcome to Loqui!</h1>
    </div>
    <div style="background-color: #ffffff; padding: 35px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
      <p style="font-size: 18px; color: #5B86E5;"><strong>Hello ${safeName},</strong></p>
      <p>We're excited to have you join our messaging platform! Loqui connects you with friends, family, and colleagues in real-time, no matter where they are.</p>
      
      <div style="background-color: #f8f9fa; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #36D1DC;">
        <p style="font-size: 16px; margin: 0 0 15px 0;"><strong>Get started in just a few steps:</strong></p>
        <ul style="padding-left: 20px; margin: 0;">
          <li style="margin-bottom: 10px;">Set up your profile picture</li>
          <li style="margin-bottom: 10px;">Find and add your contacts</li>
          <li style="margin-bottom: 10px;">Start a conversation</li>
          <li style="margin-bottom: 0;">Share photos, videos, and more</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${safeURL}" style="background: linear-gradient(to right, #36D1DC, #5B86E5); color: white; text-decoration: none; padding: 12px 30px; border-radius: 50px; font-weight: 500; display: inline-block;">Open Loqui</a>
      </div>
      
      <p style="margin-bottom: 5px;">If you need any help or have questions, we're always here to assist you.</p>
      <p style="margin-top: 0;">Happy messaging!</p>
      
      <p style="margin-top: 25px; margin-bottom: 0;">Best regards,<br>The Loqui Team</p>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
      <p>&copy; ${new Date().getFullYear()} Loqui. All rights reserved.</p>
    </div>
  </body>
  </html>
  `;
}

export function createOtpEmailTemplate(name, otp) {
  const safeName = escapeHtml(name);
  const safeOtp = escapeHtml(String(otp));

  // Render each digit in its own styled box
  const digitBoxStyle =
    "display:inline-block;width:48px;height:56px;line-height:56px;text-align:center;" +
    "font-size:28px;font-weight:700;border-radius:10px;" +
    "background:#0f172a;color:#22d3ee;margin:0 4px;border:2px solid #334155;";

  const digitBoxes = safeOtp
    .split("")
    .map((d) => `<span style="${digitBoxStyle}">${d}</span>`)
    .join("");

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Loqui Account</title>
  </head>
  <body style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.6;color:#e2e8f0;max-width:600px;margin:0 auto;padding:20px;background-color:#0f172a;">
    <div style="background:linear-gradient(135deg,#0ea5e9,#22d3ee);padding:30px;text-align:center;border-radius:16px 16px 0 0;">
      <h1 style="color:#fff;margin:0;font-size:26px;font-weight:600;letter-spacing:-0.5px;">Verify Your Account</h1>
    </div>
    <div style="background:#1e293b;padding:36px;border-radius:0 0 16px 16px;border:1px solid #334155;border-top:none;">
      <p style="font-size:17px;color:#94a3b8;margin-top:0;">Hi <strong style="color:#e2e8f0;">${safeName}</strong>,</p>
      <p style="color:#94a3b8;">Use the verification code below to complete your Loqui sign-up. This code expires in <strong style="color:#f59e0b;">10 minutes</strong>.</p>

      <div style="text-align:center;margin:32px 0;">
        <div style="margin-bottom:8px;">${digitBoxes}</div>
        <p style="color:#64748b;font-size:13px;margin-top:12px;">Do not share this code with anyone.</p>
      </div>

      <div style="background:#0f172a;border-radius:10px;padding:16px 20px;border-left:4px solid #22d3ee;margin-bottom:24px;">
        <p style="margin:0;color:#94a3b8;font-size:14px;">
          If you did not create an account on Loqui, you can safely ignore this email.
        </p>
      </div>

      <p style="margin-bottom:0;color:#64748b;font-size:13px;">Best regards,<br><span style="color:#94a3b8;">The Loqui Team</span></p>
    </div>
    <div style="text-align:center;padding:16px;color:#475569;font-size:12px;">
      <p style="margin:0;">&copy; ${new Date().getFullYear()} Loqui. All rights reserved.</p>
    </div>
  </body>
  </html>
  `;
}
