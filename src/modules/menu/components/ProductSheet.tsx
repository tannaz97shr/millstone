"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/shared/components/atoms/Button/Button";
import { FieldLabel } from "@/shared/components/atoms/Field/FieldLabel";
import { QuantityStepper } from "@/shared/components/molecules/QuantityStepper/QuantityStepper";
import { Sheet } from "@/shared/components/organisms/Sheet/Sheet";
import type { IsoDate } from "@/shared/domain";
import { formatCents } from "@/shared/utils/money";
import { formatPickupDay } from "@/shared/utils/pickup-dates";
import { menuContent } from "../content/menuContent";
import type { MenuProduct } from "../types/menu";

const content = menuContent.detail;

export interface ProductSheetProps {
  product: MenuProduct;
  date: IsoDate;
  /** How many are in the order now; 0 when it isn't. */
  inCart: number;
  onSave: (quantity: number) => void;
  onClose: () => void;
}

/**
 * C3, not designed: the CartBranchSheet sheet pattern (spec section 13) with
 * the picture, description, price and a quantity to add or update. Mount it
 * only while open, keyed by product, so the quantity starts fresh each time.
 */
export function ProductSheet({ product, date, inCart, onSave, onClose }: ProductSheetProps) {
  const [quantity, setQuantity] = useState(inCart > 0 ? inCart : 1);
  const totalCents = quantity * product.priceCents;

  const primaryLabel =
    quantity === 0
      ? content.remove
      : inCart > 0
        ? content.update(totalCents)
        : content.add(totalCents);

  const save = () => {
    onSave(quantity);
    onClose();
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title={product.name}
      actions={
        <>
          {!product.soldOut && (
            <Button variant={quantity === 0 ? "danger" : "primary"} block onClick={save}>
              {primaryLabel}
            </Button>
          )}
          <Button block onClick={onClose}>
            {product.soldOut ? content.close : content.cancel}
          </Button>
        </>
      }
    >
      <div className="relative flex aspect-16/9 items-center justify-center overflow-hidden rounded-md bg-flour-sunk">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt=""
            fill
            sizes="(min-width: 480px) 448px, 100vw"
            className="object-cover"
          />
        ) : (
          <span aria-hidden="true" className="font-serif text-[64px] font-bold text-ink-muted">
            {product.name.charAt(0)}
          </span>
        )}
      </div>
      {product.description && <p>{product.description}</p>}
      <p className={product.soldOut ? "price text-ink-muted line-through" : "price"}>
        {formatCents(product.priceCents)}
      </p>
      {product.soldOut ? (
        <p className="body-strong text-brick">{content.soldOut(formatPickupDay(date))}</p>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <FieldLabel as="div">{content.quantity}</FieldLabel>
          <QuantityStepper
            value={quantity}
            onChange={setQuantity}
            min={inCart > 0 ? 0 : 1}
            label={product.name}
          />
        </div>
      )}
    </Sheet>
  );
}
