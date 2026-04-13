import { NextResponse } from 'next/server'
import { getTransporter } from '@/lib/email/transporter'

export async function GET() {
  const to = process.env.GMAIL_USER
  if (!to) {
    return NextResponse.json({ error: 'GMAIL_USER not set' }, { status: 500 })
  }

  try {
    const transporter = getTransporter()
    await transporter.verify()

    await transporter.sendMail({
      from: `"Get A Life" <${to}>`,
      to,
      subject: 'Get A Life — email test',
      text: 'If you got this, Nodemailer + Gmail SMTP is working.',
      html: '<p>If you got this, <strong>Nodemailer + Gmail SMTP is working.</strong></p>',
    })

    return NextResponse.json({ ok: true, sentTo: to })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
