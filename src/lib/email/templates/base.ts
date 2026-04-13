export interface EmailTemplateOptions {
  body: string
  unsubscribeUrl: string
  ctaText?: string
  ctaUrl?: string
  videoId?: string       // YouTube video ID — rendered as clickable thumbnail
  videoCaption?: string
}

export function wrapWithBaseTemplate({
  body,
  unsubscribeUrl,
  ctaText,
  ctaUrl,
  videoId,
  videoCaption,
}: EmailTemplateOptions): string {

  const founderGreeting = `
    <p style="margin:0 0 28px;font-size:14px;color:#555;font-family:-apple-system,sans-serif;line-height:1.6;border-left:2px solid #e8e8e8;padding-left:14px;">
      Hi — I'm Haris, founder of Get A Life. I built this because I was tired of starting things and never finishing them. Every email you get from me is a nudge to keep going.
    </p>
  `

  // Play button: no flexbox — email clients don't support it reliably
  const videoBlock = videoId ? `
    <div style="margin:28px 0;">
      <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" style="display:block;position:relative;text-decoration:none;line-height:0;">
        <img
          src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg"
          alt="${videoCaption ?? 'watch video'}"
          style="width:100%;max-width:500px;height:auto;display:block;border-radius:4px;"
        />
        <div style="position:absolute;top:50%;left:50%;margin-top:-28px;margin-left:-28px;width:56px;height:56px;background:rgba(0,0,0,0.72);border-radius:50%;">
          <div style="position:absolute;top:50%;left:53%;margin-top:-10px;margin-left:-9px;width:0;height:0;border-style:solid;border-width:10px 0 10px 18px;border-color:transparent transparent transparent #ffffff;"></div>
        </div>
      </a>
      ${videoCaption ? `<p style="margin:8px 0 0;font-size:12px;color:#999;font-family:-apple-system,sans-serif;">${videoCaption} ↗</p>` : ''}
    </div>
  ` : ''

  const ctaBlock = ctaText && ctaUrl ? `
    <p style="margin:32px 0 0;">
      <a href="${ctaUrl}" style="display:inline-block;padding:11px 22px;border:1px solid #111;color:#111;text-decoration:none;font-size:13px;font-family:-apple-system,sans-serif;letter-spacing:0.02em;">${ctaText} →</a>
    </p>
  ` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>get a life</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;-webkit-font-smoothing:antialiased;">
  <div style="max-width:520px;margin:0 auto;padding:48px 24px 64px;font-family:Georgia,'Times New Roman',serif;color:#111111;">

    <p style="margin:0 0 40px;font-size:11px;color:#999;letter-spacing:0.12em;text-transform:uppercase;font-family:-apple-system,sans-serif;">
      get a life
    </p>

    <div style="font-size:16px;line-height:1.85;color:#111;">
      ${body}
    </div>

    ${videoBlock}
    ${ctaBlock}

    <div style="margin-top:48px;padding-top:20px;border-top:1px solid #e8e8e8;">
      ${founderGreeting}
      <p style="margin:12px 0 0;font-size:11px;color:#bbb;font-family:-apple-system,sans-serif;line-height:1.6;">
        you signed up to be held accountable. this is that.
        &nbsp;&nbsp;<a href="${unsubscribeUrl}" style="color:#bbb;text-decoration:underline;">unsubscribe</a>
      </p>
    </div>

  </div>
</body>
</html>`
}
