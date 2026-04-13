import { getTransporter } from './transporter'

export interface EmailPayload {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const transporter = getTransporter()
  await transporter.sendMail({
    from: `"GetALife" <${process.env.GMAIL_USER}>`,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text ?? payload.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
  })
}
