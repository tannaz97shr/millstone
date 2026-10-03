// Copy for the /dev/emails outbox (development only, not designed).

export const devEmailsContent = {
  metadataTitle: "Emails — Millstone",
  title: "Emails",
  intro: "Emails the app would have sent, newest first. They're saved in .dev-emails and never leave this machine.",
  empty: "No emails yet. Place an order to see its confirmation here.",
  sentAt: (when: string) => `Saved ${when}`,
  to: (address: string) => `To ${address}`,
  back: "All emails",
  from: "From",
  toLabel: "To",
  subject: "Subject",
  preheader: "Preview text",
  html: "HTML",
  text: "Plain text",
  widths: { phone: "Phone, 390px", desktop: "Desktop client, 600px" },
  frameTitle: (subject: string) => `Email: ${subject}`,
} as const;

/** Widths the viewer frames the HTML at: a phone, and EmailWide.dc.html's 640px with a 600px email. */
export const EMAIL_PREVIEW_WIDTHS = { phone: 390, desktop: 640 } as const;
