import nodemailer, { type Transporter } from "nodemailer";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "varinder2good@gmail.com";

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_APP_PASSWORD;
  if (!user || !pass) return null;

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return transporter;
}

export async function sendMail(to: string, subject: string, text: string) {
  const t = getTransporter();
  if (!t) {
    console.warn(`[mailer] SMTP not configured — skipped email: "${subject}"`);
    return;
  }

  try {
    await t.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      text,
    });
  } catch (err) {
    console.error("[mailer] Failed to send email:", err);
  }
}

export async function sendAdminEmail(subject: string, text: string) {
  await sendMail(ADMIN_EMAIL, subject, text);
}
