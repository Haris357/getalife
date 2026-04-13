import nodemailer from 'nodemailer'

let transport: nodemailer.Transporter | null = null

export function getTransporter(): nodemailer.Transporter {
  if (!transport) {
    transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })
  }
  return transport
}
