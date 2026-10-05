import {
  CATEGORY_NAME_MAX,
  PRODUCT_DESCRIPTION_MAX,
  PRODUCT_NAME_MAX,
} from "../lib/productFields";
import { PHOTO_MIN_HEIGHT, PHOTO_MIN_WIDTH } from "../lib/photoRules";

// A5 products (owner only). From design/admin/Products.dc.html, ProductNew,
// ProductEdit and ProductHide unless marked "undesigned" (listed in
// specs/known-issues.md).

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
const products = (count: number) => plural(count, "product", "products");
const NUMBER_WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
/** "three" in running text, as the canvas says "all three branches". */
const inWords = (count: number) => NUMBER_WORDS[count] ?? String(count);

export const productsContent = {
  title: "Products",
  intro: (branches: number) =>
    `One list for all ${inWords(branches)} branches, at the same price everywhere. Each branch switches products on or off in Availability.`,
  regionLabel: "Products",
  add: "Add product",
  summary: (total: number, hidden: number) =>
    [products(total), `${total - hidden} on menus`, hidden ? `${hidden} hidden` : null].filter(Boolean).join(" · "),
  caption: (count: number, hidden: number) => (hidden ? `${products(count)} · ${hidden} hidden` : products(count)),
  row: {
    noDescription: "No description yet.",
    hiddenWhere: "On no menus",
    allBranches: (branches: number) => `At all ${branches} branches`,
    someBranches: (on: number, branches: number, offNames: readonly string[]) =>
      `At ${on} of ${branches} branches · not ${offNames.join(", ")}`,
    /** Undesigned: shown, but every branch has switched it off. */
    noBranches: "Switched off at every branch",
    onMenus: "On menus",
    hidden: "Hidden",
    edit: "Edit",
    editLabel: (name: string) => `Edit ${name}`,
  },
  form: {
    titleNew: "New product",
    titleEdit: (name: string) => `Edit ${name || "product"}`,
    close: "Close",
    newNote: (branches: number) =>
      `New products go on the menu at all ${inWords(branches)} branches. A branch that doesn’t make it can switch it off in Availability.`,
    name: {
      label: "Name",
      placeholder: "Sourdough rye loaf",
      required: "Give it a name, like it would read on the menu.",
      /** Undesigned. */
      tooLong: `Keep the name to ${PRODUCT_NAME_MAX} characters, so it fits on a menu card.`,
    },
    description: {
      label: "Description",
      hint: "One short line for the menu.",
      /** Undesigned. */
      tooLong: `Keep it to one short line (${PRODUCT_DESCRIPTION_MAX} characters at most).`,
    },
    category: {
      label: "Category",
      newButton: "New category",
      required: "Choose a category.",
      newLabel: "New category name",
      newHint: "It shows as a heading on the menu.",
      newRequired: "Name the new category.",
      /** Undesigned. */
      newTooLong: `Keep the category to ${CATEGORY_NAME_MAX} characters.`,
    },
    price: {
      label: "Price",
      hint: "The same at every branch. In dollars, like 9.50.",
      invalid: "Enter the price in dollars, like 9.50.",
      note: (next: string, previous: string) =>
        `The new price, ${next}, applies to new orders and to recurring orders made from now on. Orders already placed keep ${previous}.`,
    },
    photo: {
      label: "Photo",
      choose: "Choose photo",
      /** Undesigned: when there's a photo already. */
      replace: "Choose another photo",
      hint: "A real Millstone bake, natural light, 4:3. Until there’s a photo, the menu shows the first letter.",
      /** Undesigned. */
      chosen: (fileName: string) => `New photo: ${fileName}. It’s cropped to 4:3 and saved when you save.`,
    },
    active: {
      label: "Show on menus",
      onText: "On the menu at branches that have it switched on",
      offText: "Hidden from every branch’s menu",
      hideNoteStrong: (branches: number) => `Hiding takes it off all ${inWords(branches)} menus.`,
      hideNote: "Orders already placed keep it at the price they paid. Recurring orders will leave it out and say why in their note.",
    },
    saveNew: "Add product",
    saveEdit: "Save changes",
    /** Undesigned. */
    saving: "Saving…",
    cancel: "Cancel",
  },
  messages: {
    added: (name: string, branches: number, shown: boolean) =>
      `${name} added. It’s on the menu at all ${inWords(branches)} branches${shown ? "." : " once you show it."}`,
    saved: (name: string, change: "hidden" | "shown" | null) =>
      `${name} saved.${change === "hidden" ? " It’s hidden from every menu." : change === "shown" ? " It’s back on the menus." : ""}`,
    /** Undesigned: everything below. */
    photoFailed: (name: string, why: string) => `${name} is saved, but the photo didn’t upload. ${why}`,
    photoWhy: {
      unsupported: "Choose a JPEG, PNG or WebP photo.",
      tooLarge: "Choose a photo under 10 MB.",
      tooSmall: `Choose a bigger photo, at least ${PHOTO_MIN_WIDTH} × ${PHOTO_MIN_HEIGHT} pixels.`,
      failed: "Try choosing it again.",
    },
    changed: (name: string) =>
      `${name} was changed on another screen. The form now shows the latest details: check them, then save again.`,
    gone: "This product isn’t in the catalogue any more. Close the form and check the list.",
    failed: "That didn’t save. Check the connection and try again.",
    unavailable: "The catalogue didn’t answer in time. Try again in a moment.",
  },
  load: {
    loading: "Loading products…",
    failed: "We couldn’t load the products. Check the connection and try again.",
    retry: "Try again",
    empty: "No products yet. Add the first one.",
  },
} as const;
