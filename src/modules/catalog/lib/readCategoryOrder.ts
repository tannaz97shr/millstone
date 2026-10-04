import "server-only";
import { catalogSettingsRef } from "@/shared/lib/firebase/collections";
import { firestoreRead } from "@/shared/lib/firebase/firestoreRead";
import { logError } from "@/shared/utils/logError";
import { toCatalogSettings } from "./toCatalogSettings";

/** settings/catalog's category order; empty (A–Z) when the doc is missing. */
export async function readCategoryOrder(context: string): Promise<string[]> {
  const snapshot = await firestoreRead(catalogSettingsRef().get(), "settings/catalog");
  if (!snapshot.exists) {
    logError(new Error("settings/catalog is missing; categories fall back to A–Z"), context, {
      level: "warn",
    });
    return [];
  }
  return toCatalogSettings(snapshot).categoryOrder;
}
