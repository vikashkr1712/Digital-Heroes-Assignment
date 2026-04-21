import nodemailer from "nodemailer";

export type EmailRecipient = {
  email: string;
  name?: string | null;
};

let transporter: nodemailer.Transporter | null = null;
let warnedForMissingConfig = false;

function getEmailConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const portText = process.env.SMTP_PORT?.trim() || "587";
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = process.env.SMTP_FROM?.trim();
  const secure = process.env.SMTP_SECURE === "true";

  const port = Number(portText);

  if (!host || !user || !pass || !from || Number.isNaN(port)) {
    return null;
  }

  return {
    host,
    port,
    user,
    pass,
    from,
    secure,
  };
}

function getTransporter(): nodemailer.Transporter | null {
  const config = getEmailConfig();

  if (!config) {
    if (!warnedForMissingConfig) {
      console.warn("SMTP email configuration missing. Notification emails are disabled.");
      warnedForMissingConfig = true;
    }

    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
  }

  return transporter;
}

export function isEmailEnabled(): boolean {
  return getEmailConfig() !== null;
}

export async function sendNotificationEmail(
  recipient: EmailRecipient,
  subject: string,
  message: string,
): Promise<boolean> {
  const client = getTransporter();
  const config = getEmailConfig();

  if (!client || !config) {
    return false;
  }

  await client.sendMail({
    from: config.from,
    to: recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email,
    subject,
    text: message,
    html: `<p>${message}</p>`,
  });

  return true;
}

export async function sendBulkNotificationEmails(
  recipients: EmailRecipient[],
  subject: string,
  message: string,
): Promise<void> {
  if (recipients.length === 0) {
    return;
  }

  await Promise.allSettled(
    recipients.map((recipient) => sendNotificationEmail(recipient, subject, message)),
  );
}
