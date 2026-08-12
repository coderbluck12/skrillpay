import nodemailer from 'nodemailer';

/**
 * Creates and returns a Nodemailer transporter instance.
 * If SMTP environment variables are configured, uses SMTP.
 * Otherwise, falls back to a stream/JSON log transport for development/testing.
 */
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  // Fallback transport for development / testing when SMTP is not configured
  return nodemailer.createTransport({
    jsonTransport: true,
  });
}

const transporter = createTransporter();
const defaultSender = process.env.EMAIL_FROM || 'Skrillpay <noreply@skrillpay.com>';

export class MailerUtils {
  /**
   * Sends an account verification email to a newly registered user.
   */
  public static async sendVerificationEmail(
    toEmail: string,
    verificationToken: string,
    businessName: string
  ): Promise<boolean> {
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const verifyUrl = `${baseUrl}/v1/auth/verify-email?token=${verificationToken}`;

    const subject = 'Verify your Skrillpay account email';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #4f46e5;">Welcome to Skrillpay, ${businessName}!</h2>
        <p>Thank you for creating an account with Skrillpay. Please verify your email address to complete your registration and activate email notifications.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${verifyUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p style="font-size: 13px; color: #666666;">Or copy and paste this link into your browser:</p>
        <p style="font-size: 13px; color: #4f46e5; word-break: break-all;">${verifyUrl}</p>
        <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999999;">If you did not sign up for a Skrillpay account, you can safely ignore this email.</p>
      </div>
    `;

    const textContent = `Welcome to Skrillpay, ${businessName}!\n\nPlease verify your email address by visiting the following link:\n${verifyUrl}\n\nIf you did not create this account, please ignore this email.`;

    try {
      const info = await transporter.sendMail({
        from: defaultSender,
        to: toEmail,
        subject,
        text: textContent,
        html: htmlContent,
      });

      if (process.env.NODE_ENV !== 'production' && !process.env.SMTP_HOST) {
        console.log(`[DEV/TEST MAILER] Verification email for ${toEmail}: ${verifyUrl}`);
      }

      return true;
    } catch (error) {
      console.error('Error sending verification email via Nodemailer:', error);
      return false;
    }
  }
}
