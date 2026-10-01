export interface CatalogSettings {
  /**
   * Category names in menu order, e.g. ["Breads", "Pastries", "Bagels"].
   * New categories are appended; any category not listed goes last, A–Z.
   */
  categoryOrder: string[];
}
