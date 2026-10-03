/** One email, ready for any transport. The address the email is sent from is the transport's. */
export interface EmailMessage {
  to: string;
  /** Shown as the sender, e.g. "Millstone Northcote". */
  fromName: string;
  subject: string;
  /** The preview line after the subject. Already inside `html`; kept for the dev viewer. */
  preheader: string;
  html: string;
  text: string;
}
