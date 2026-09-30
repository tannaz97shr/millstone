"use client";

import { useState } from "react";
import {
  ProductCard,
  type ProductCardProps,
} from "@/shared/components/organisms/ProductCard/ProductCard";
import { devComponentsContent } from "../../content/devComponents";

const products = devComponentsContent.productCard.products;

export interface ProductCardDemoProps {
  product: keyof typeof products;
  initialQuantity?: number;
  layout?: "card" | "row";
  image?: ProductCardProps["image"];
  imageAlt?: string;
}

/** Add becomes the stepper; going back to 0 brings Add back. */
export function ProductCardDemo({
  product,
  initialQuantity = 0,
  layout,
  image,
  imageAlt,
}: ProductCardDemoProps) {
  const [quantity, setQuantity] = useState(initialQuantity);
  return (
    <ProductCard
      {...products[product]}
      layout={layout}
      image={image}
      imageAlt={imageAlt}
      quantity={quantity}
      onQuantityChange={setQuantity}
      onAdd={() => setQuantity(1)}
    />
  );
}
