// Reminder emails are sent daily
// Coaching emails are sent weekly (Sundays)
// Newsletter emails are sent weekly (Wednesdays)
// Countdown emails are triggered by deadline proximity

export function shouldSendCoaching(dayOfWeek: number): boolean {
  return dayOfWeek === 0 // Sunday
}

export function shouldSendNewsletter(dayOfWeek: number): boolean {
  return dayOfWeek === 3 // Wednesday
}
