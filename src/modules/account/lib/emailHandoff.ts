import { logError } from "@/shared/utils/logError";

// The email typed on one C8 form, carried to the other ("Create an account",
// "Sign in instead") in this tab's sessionStorage. Never in the URL, where it
// would end up in history, logs and the Referer. Taken (and removed) once by
// the form it was handed to. Browser only.

const KEY = "millstone:account:email";

export function handOffEmail(email: string): void {
  try {
    const trimmed = email.trim();
    if (trimmed) window.sessionStorage.setItem(KEY, trimmed);
    else window.sessionStorage.removeItem(KEY);
  } catch (error) {
    logError(error, "emailHandoff.handOff", { level: "warn" });
  }
}

export function takeHandedOffEmail(): string | null {
  try {
    const email = window.sessionStorage.getItem(KEY);
    window.sessionStorage.removeItem(KEY);
    return email;
  } catch (error) {
    logError(error, "emailHandoff.take", { level: "warn" });
    return null;
  }
}
