"use client";

import type { Cart } from "@/modules/cart/types/cart";
import { quantityOf } from "@/modules/cart/lib/cartLogic";
import { ProductCard } from "@/shared/components/organisms/ProductCard/ProductCard";
import type { IsoDate } from "@/shared/domain";
import { formatPickupDay } from "@/shared/utils/pickup-dates";
import { menuContent } from "../content/menuContent";
import type { MenuCategory, MenuProduct } from "../types/menu";
import { categoryAnchor } from "./CategoryNav";

export interface MenuSectionsProps {
  categories: MenuCategory[];
  date: IsoDate;
  cart: Cart | null;
  onQuantityChange: (product: MenuProduct, quantity: number) => void;
  onOpenDetails: (product: MenuProduct) => void;
}

/** One section per category, each a two-column grid of product cards. */
export function MenuSections({
  categories,
  date,
  cart,
  onQuantityChange,
  onOpenDetails,
}: MenuSectionsProps) {
  const soldOutLabel = menuContent.soldOutFor(formatPickupDay(date));

  return categories.map((category) => {
    const headingId = `${categoryAnchor(category.slug)}-title`;
    return (
      <section
        key={category.slug}
        id={categoryAnchor(category.slug)}
        aria-labelledby={headingId}
        className="flex scroll-mt-3 flex-col gap-3"
      >
        <h2 id={headingId} className="section-title">
          {category.name}
        </h2>
        {/* Two columns at every width: the customer column is capped at 640px. */}
        <div className="grid grid-cols-2 gap-3">
          {category.products.map((product) => (
            <ProductCard
              key={product.id}
              name={product.name}
              priceCents={product.priceCents}
              description={product.description}
              image={product.imageUrl ?? undefined}
              quantity={quantityOf(cart, product.id)}
              soldOut={product.soldOut ? soldOutLabel : false}
              onAdd={() => onQuantityChange(product, 1)}
              onQuantityChange={(n) => onQuantityChange(product, n)}
              onOpenDetails={() => onOpenDetails(product)}
              footer="stacked"
            />
          ))}
        </div>
      </section>
    );
  });
}
