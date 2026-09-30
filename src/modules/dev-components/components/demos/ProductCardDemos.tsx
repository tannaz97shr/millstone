"use client";

import { useState } from "react";
import { ProductCard } from "@/shared/components/organisms/ProductCard/ProductCard";
import { devComponentsContent } from "../../content/devComponents";

const products = devComponentsContent.productCard.products;

export interface ProductCardDemoProps {
  product: keyof typeof products;
  initialQuantity?: number;
  layout?: "card" | "row";
}

/** Add becomes the stepper; going back to 0 brings Add back. */
export function ProductCardDemo({ product, initialQuantity = 0, layout }: ProductCardDemoProps) {
  const [quantity, setQuantity] = useState(initialQuantity);
  return (
    <ProductCard
      {...products[product]}
      layout={layout}
      quantity={quantity}
      onQuantityChange={setQuantity}
      onAdd={() => setQuantity(1)}
    />
  );
}
