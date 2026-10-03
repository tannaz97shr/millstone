/**
 * Phones are stored as digits. For display: mobiles read "0491 570 156",
 * landlines "03 7010 2140". Anything else is shown as it was stored.
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length !== 10 || !digits.startsWith("0")) return phone;
  if (digits.startsWith("04")) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
}

/**
 * An Australian mobile as typed ("0491 570 156", "+61 491 570 156",
 * "(0491) 570-156") to its stored digits "0491570156", or null when it isn't
 * one. Only spaces, dashes, dots and brackets are ignored; letters are not.
 */
export function parseAuMobile(input: string): string | null {
  const compact = input.trim().replace(/[\s().-]/g, "");
  const local = compact.replace(/^\+?61(?=4)/, "0");
  return /^04\d{8}$/.test(local) ? local : null;
}
