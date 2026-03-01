import { Resend } from 'resend';
import { logger } from '../utils/logger';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
let resend: Resend | null = null;

try {
  if (RESEND_API_KEY && RESEND_API_KEY !== 'your-resend-api-key') {
    resend = new Resend(RESEND_API_KEY);
  } else {
    logger.warn('RESEND_API_KEY not set — email sending is disabled');
  }
} catch {
  logger.warn('Failed to initialize Resend — email sending is disabled');
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'VOXERA <noreply@voxera2026.in>';

export async function sendRegistrationConfirmation(params: {
  to: string;
  name: string;
  registrationCode: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  teamSize: number;
  feeAmount: number;
}): Promise<void> {
  const { to, name, registrationCode, eventTitle, eventDate, eventLocation, teamSize, feeAmount } = params;

  if (!resend) { logger.warn('Email skipped — no API key', { to }); return; }
  try {
    await resend!.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `🎉 Registration Confirmed — ${eventTitle} | VOXERA 2026`,
      html: `
        <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #0F172A; color: #F8FAFC; padding: 40px 30px; border-radius: 16px;">
          <h1 style="font-size: 28px; margin-bottom: 8px; color: #fff;">Hey ${name}! 🎉</h1>
          <p style="color: #94A3B8; font-size: 16px; margin-bottom: 30px;">Your registration for <strong style="color: #A78BFA;">${eventTitle}</strong> at VOXERA 2026 has been confirmed.</p>

          <div style="background: #1E1B4B; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid rgba(124,58,237,0.3);">
            <p style="color: #A78BFA; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;">Registration Code</p>
            <p style="font-size: 28px; font-weight: bold; color: #fff; font-family: monospace;">${registrationCode}</p>
          </div>

          <table style="width: 100%; font-size: 14px; color: #94A3B8; margin-bottom: 24px;">
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #1E293B;">Event</td><td style="text-align: right; color: #fff; padding: 8px 0; border-bottom: 1px solid #1E293B;">${eventTitle}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #1E293B;">Date</td><td style="text-align: right; color: #fff; padding: 8px 0; border-bottom: 1px solid #1E293B;">${eventDate}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #1E293B;">Venue</td><td style="text-align: right; color: #fff; padding: 8px 0; border-bottom: 1px solid #1E293B;">${eventLocation}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #1E293B;">Team Size</td><td style="text-align: right; color: #fff; padding: 8px 0; border-bottom: 1px solid #1E293B;">${teamSize}</td></tr>
            <tr><td style="padding: 8px 0;">Amount Paid</td><td style="text-align: right; color: #fff; font-weight: bold; padding: 8px 0;">₹${(feeAmount / 100).toFixed(0)}</td></tr>
          </table>

          <p style="color: #475569; font-size: 12px; text-align: center;">
            Please carry this code to the venue. For queries, contact us at contact@voxera2026.in.
          </p>
          <p style="color: #475569; font-size: 11px; text-align: center; margin-top: 16px;">© 2026 VOXERA — JB Language Club, JBIET</p>
        </div>
      `,
    });
    logger.info('Registration email sent', { to, registrationCode });
  } catch (err) {
    logger.error('Failed to send registration email', { to, error: String(err) });
  }
}

export async function sendContactNotification(params: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  const { name, email, subject, message } = params;

  if (!resend) { logger.warn('Email skipped — no API key'); return; }
  try {
    await resend!.emails.send({
      from: FROM_EMAIL,
      to: process.env.ADMIN_EMAIL || 'contact@voxera2026.in',
      subject: `New Contact Submission: ${subject}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <blockquote style="border-left: 3px solid #7C3AED; padding-left: 12px; color: #333;">${message}</blockquote>
        </div>
      `,
    });
    logger.info('Contact notification sent', { subject });
  } catch (err) {
    logger.error('Failed to send contact notification', { error: String(err) });
  }
}
