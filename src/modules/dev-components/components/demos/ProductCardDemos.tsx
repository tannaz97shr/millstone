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
  footer?: ProductCardProps["footer"];
  image?: ProductCardProps["image"];
  imageAlt?: string;
}

/** Add becomes the stepper; going back to 0 brings Add back. */
export function ProductCardDemo({
  product,
  initialQuantity = 0,
  layout,
  footer,
  image,
  imageAlt,
}: ProductCardDemoProps) {
  const [quantity, setQuantity] = useState(initialQuantity);
  return (
    <ProductCard
      {...products[product]}
      layout={layout}
      footer={footer}
      image={image}
      imageAlt={imageAlt}
      quantity={quantity}
      onQuantityChange={setQuantity}
      onAdd={() => setQuantity(1)}
    />
  );
}

/** The name (and picture) open the product detail; this demo just reports the press. */
export function ProductCardDetailsDemo({ product }: { product: keyof typeof products }) {
  const copy = devComponentsContent.productCard;
  const [quantity, setQuantity] = useState(0);
  const [opened, setOpened] = useState(0);
  return (
    <div className="flex flex-col gap-2">
      <ProductCard
        {...products[product]}
        quantity={quantity}
        onQuantityChange={setQuantity}
        onAdd={() => setQuantity(1)}
        onOpenDetails={() => setOpened((n) => n + 1)}
      />
      <p className="caption text-ink-muted">
        {copy.detailsOpened}: <span data-testid="details-opened">{opened}</span>
      </p>
    </div>
  );
}
