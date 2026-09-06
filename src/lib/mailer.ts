import nodemailer, { type Transporter } from "nodemailer";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "varinder2good@gmail.com";

function envFlag(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return defaultValue;
  return raw === "true" || raw === "1";
}

// Master switches for outbound email, read once at module load. Both
// default to OFF — set SEND_ADMIN_EMAILS=true / SEND_USER_EMAILS=true in
// the environment to turn a category back on without touching code.
//
// Password-reset mail is deliberately its own flag (defaulting ON) since
// disabling it silently breaks account recovery; SEND_USER_EMAILS only
// gates non-critical user notifications (deposit/withdrawal/ticket status,
// profile-updated confirmations, etc).
const ADMIN_EMAILS_ENABLED = envFlag("SEND_ADMIN_EMAILS", false);
const USER_EMAILS_ENABLED = envFlag("SEND_USER_EMAILS", false);
const PASSWORD_RESET_EMAILS_ENABLED = envFlag("SEND_PASSWORD_RESET_EMAILS", true);

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

async function deliver(to: string, subject: string, text: string) {
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

export async function sendMail(
  to: string,
  subject: string,
  text: string,
  options: { critical?: boolean } = {}
) {
  const enabled = options.critical ? PASSWORD_RESET_EMAILS_ENABLED : USER_EMAILS_ENABLED;
  if (!enabled) {
    const flag = options.critical ? "SEND_PASSWORD_RESET_EMAILS" : "SEND_USER_EMAILS";
    console.warn(`[mailer] User emails disabled (${flag}=false) — skipped: "${subject}"`);
    return;
  }

  await deliver(to, subject, text);
}

export async function sendAdminEmail(subject: string, text: string) {
  if (!ADMIN_EMAILS_ENABLED) {
    console.warn(`[mailer] Admin emails disabled (SEND_ADMIN_EMAILS=false) — skipped: "${subject}"`);
    return;
  }

  await deliver(ADMIN_EMAIL, subject, text);
}
