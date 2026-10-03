"use client";

import { Card } from "@/shared/components/atoms/Card/Card";
import { QuantityStepper } from "@/shared/components/molecules/QuantityStepper/QuantityStepper";
import type { ProductId } from "@/shared/domain";
import { formatCents } from "@/shared/utils/money";
import type { MenuProduct } from "@/modules/menu/types/menu";
import { cartContent } from "../content/cartContent";
import { MAX_QUANTITY, type CartLineView } from "../lib/cartLogic";

const content = cartContent.lines;

export interface CartLinesProps {
  lines: CartLineView[];
  onQuantityChange: (product: MenuProduct, quantity: number) => void;
  /** The id of each line's name, so focus can land there after a line is removed. */
  nameId: (productId: ProductId) => string;
}

/** The order's lines: name, "$X each", line total and a full-width stepper. 0 removes the line. */
export function CartLines({ lines, onQuantityChange, nameId }: CartLinesProps) {
  return (
    <Card as="section" padding="none" aria-label={content.regionLabel}>
      <ul className="flex flex-col divide-y divide-line">
        {lines.map(({ product, quantity, lineTotalCents }) => (
          <li key={product.id} className="flex flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col">
                <span id={nameId(product.id)} className="product-name">
                  {product.name}
                </span>
                <span className="caption text-ink-muted tabular-nums">
                  {content.each(formatCents(product.priceCents))}
                </span>
              </div>
              <span className="price">{formatCents(lineTotalCents)}</span>
            </div>
            <QuantityStepper
              block
              value={quantity}
              min={0}
              max={MAX_QUANTITY}
              label={product.name}
              onChange={(next) => onQuantityChange(product, next)}
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}
