import nodemailer from "nodemailer";

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    }
  });
}

export async function sendPasswordResetEmail({ to, username, resetUrl }) {
  const transporter = createTransporter();

  if (!transporter) {
    const error = new Error("SMTP is not configured. Add SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.");
    error.statusCode = 500;
    throw error;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  await transporter.sendMail({
    from,
    to,
      subject: "DisciplineX password reset",
    text: `Hi ${username},\n\nUse this link to reset your password:\n${resetUrl}\n\nThis link expires in 1 hour.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <h2>DisciplineX password reset</h2>
        <p>Hi ${username},</p>
        <p>Use the button below to reset your password. This link expires in 1 hour.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#0f172a;color:#ffffff;text-decoration:none;border-radius:12px">
            Reset Password
          </a>
        </p>
        <p>If the button does not work, use this link:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
      </div>
    `
  });
}
