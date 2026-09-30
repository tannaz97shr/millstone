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
