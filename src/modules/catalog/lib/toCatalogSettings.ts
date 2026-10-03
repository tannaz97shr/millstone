import "server-only";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import type { CatalogSettings } from "@/shared/domain";
import { parseDoc } from "@/shared/lib/firebase/parseDoc";
import type { CatalogSettingsDoc } from "../types/catalogDocs";
import { catalogSettingsDocSchema } from "./catalogSettingsSchema";

export function toCatalogSettings(snapshot: DocumentSnapshot): CatalogSettings {
  const doc = parseDoc(catalogSettingsDocSchema, snapshot);
  return { categoryOrder: [...doc.categoryOrder] };
}

export function catalogSettingsToDoc(settings: CatalogSettings): CatalogSettingsDoc {
  return { categoryOrder: [...settings.categoryOrder] };
}
