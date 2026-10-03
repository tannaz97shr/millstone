import { menuContent } from "../content/menuContent";
import type { MenuCategory } from "../types/menu";

export const categoryAnchor = (slug: string) => `category-${slug}`;

/** Jump links to each category section, in menu order. Scrolls sideways if they don't fit. */
export function CategoryNav({ categories }: { categories: MenuCategory[] }) {
  return (
    <nav aria-label={menuContent.categoriesLabel} className="-mx-4 -my-1 overflow-x-auto px-4 py-1">
      <ul className="flex gap-2">
        {categories.map((category) => (
          <li key={category.slug} className="shrink-0">
            <a
              href={`#${categoryAnchor(category.slug)}`}
              className="inline-flex min-h-control items-center rounded-md border-(length:--control-border) border-line-strong bg-flour-raised px-4 font-bold hover:bg-crust-soft"
            >
              {category.name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
