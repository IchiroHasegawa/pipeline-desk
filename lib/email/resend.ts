import { Resend } from "resend";

export type OutgoingEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type EmailSender = (email: OutgoingEmail) => Promise<void>;

/**
 * Transactional email over the Resend HTTP API.
 *
 * The API rather than SMTP: in a route handler an HTTPS call is fewer moving
 * parts than nodemailer, reports errors better, and needs no port-465 egress.
 * Soul Leveler's separate SMTP setup on the same Resend account is untouched.
 *
 * The sender is injectable so tests never send real mail, and so a future
 * queue or a different provider can slot in without touching callers.
 */
let injected: EmailSender | null = null;

export function setEmailSender(sender: EmailSender | null): void {
  injected = sender;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} environment variable.`);
  return value;
}

async function resendSender(email: OutgoingEmail): Promise<void> {
  const resend = new Resend(requireEnv("RESEND_API_KEY"));
  const { error } = await resend.emails.send({
    from: requireEnv("RESEND_FROM"),
    to: email.to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
  if (error) {
    throw new Error(`Resend refused the message: ${error.message}`);
  }
}

export async function sendEmail(email: OutgoingEmail): Promise<void> {
  await (injected ?? resendSender)(email);
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  await sendEmail({
    to,
    subject: "Reset your Production OS password",
    text: [
      "Someone asked to reset the password for this Production OS account.",
      "",
      `Open this link to choose a new one: ${resetUrl}`,
      "",
      "The link can only be used once, and expires in 1 hour.",
      "If this wasn't you, you can ignore this email — nothing has changed.",
    ].join("\n"),
    html: [
      "<p>Someone asked to reset the password for this Production OS account.</p>",
      `<p><a href="${resetUrl}">Choose a new password</a></p>`,
      "<p>The link can only be used once, and expires in 1 hour.</p>",
      "<p>If this wasn't you, you can ignore this email — nothing has changed.</p>",
    ].join(""),
  });
}
