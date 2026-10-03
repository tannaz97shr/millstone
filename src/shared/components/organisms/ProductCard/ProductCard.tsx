"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useRef } from "react";
import type { Cents } from "@/shared/domain";
import { componentsContent } from "@/shared/content/components";
import { cx } from "@/shared/utils/cx";
import { formatCents } from "@/shared/utils/money";
import { Button } from "../../atoms/Button/Button";
import { QuantityStepper } from "../../molecules/QuantityStepper/QuantityStepper";

export interface ProductCardProps {
  name: string;
  /** Integer cents; shown as "$9.50". */
  priceCents: Cents;
  /** One line. */
  description?: string;
  /** Leave empty until real photos exist: the initial on flour-sunk is intentional. */
  image?: string | StaticImageData;
  imageAlt?: string;
  /** Shows the stepper instead of Add when above 0 (with onQuantityChange). */
  quantity?: number;
  onQuantityChange?: (n: number) => void;
  onAdd?: () => void;
  /** true, or the sentence to show, e.g. "Sold out for Wed 30 Sep". Sold out is per pickup date. */
  soldOut?: boolean | string;
  /** row: for the cart and narrow lists. */
  layout?: "card" | "row";
  /** stacked: price on its own line, Add or the stepper full width (the menu grid). */
  footer?: "inline" | "stacked";
  /** Opens the product detail (C3). The name becomes a button; the picture is a mouse-only shortcut to it. */
  onOpenDetails?: () => void;
  className?: string;
}

const content = componentsContent.productCard;

/** A menu item. The consumer provides the grid (two columns on phones, space-3 gaps). */
export function ProductCard({
  name,
  priceCents,
  description,
  image,
  imageAlt = "",
  quantity = 0,
  onQuantityChange,
  onAdd,
  soldOut = false,
  layout = "card",
  footer = "inline",
  onOpenDetails,
  className,
}: ProductCardProps) {
  const isSoldOut = Boolean(soldOut);
  const isRow = layout === "row";
  const stacked = footer === "stacked";
  const showStepper = !isSoldOut && quantity > 0 && Boolean(onQuantityChange);

  // Add and the stepper replace each other, so the button that was pressed
  // disappears. Keep focus on the control that took its place.
  const actions = useRef<HTMLDivElement>(null);
  const keepFocus = useRef(false);
  useEffect(() => {
    if (!keepFocus.current) return;
    keepFocus.current = false;
    const buttons = actions.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
    buttons?.[buttons.length - 1]?.focus();
  }, [showStepper]);

  const add = () => {
    keepFocus.current = true;
    onAdd?.();
  };
  const changeQuantity = (n: number) => {
    if (n <= 0) keepFocus.current = true;
    onQuantityChange?.(n);
  };
  const faded = isSoldOut && "opacity-45 grayscale-60";
  const MediaElement = onOpenDetails ? "button" : "div";

  return (
    <article
      className={cx(
        "flex overflow-hidden rounded-lg border border-line bg-flour-raised text-ink shadow-card",
        isRow ? "flex-row" : "flex-col",
        className,
      )}
    >
      <MediaElement
        // The name button is the keyboard and screen-reader way in; this is a bigger mouse target.
        {...(onOpenDetails && {
          type: "button" as const,
          tabIndex: -1,
          "aria-hidden": true,
          onClick: onOpenDetails,
        })}
        className={cx(
          "relative flex items-center justify-center overflow-hidden bg-flour-sunk",
          isRow ? "w-28 shrink-0" : "aspect-4/3",
          onOpenDetails && "cursor-pointer",
        )}
      >
        {image ? (
          <Image
            src={image}
            alt={imageAlt}
            fill
            sizes={isRow ? "112px" : "(min-width: 768px) 25vw, 50vw"}
            className={cx("object-cover", faded)}
          />
        ) : (
          <span
            aria-hidden="true"
            className={cx("font-serif text-[44px] font-bold text-ink-muted", faded)}
          >
            {name.charAt(0)}
          </span>
        )}
      </MediaElement>
      <div className="flex min-w-0 flex-1 flex-col gap-1 px-4 pt-3 pb-4">
        <h3 className="product-name">
          {onOpenDetails ? (
            <button
              type="button"
              onClick={onOpenDetails}
              aria-label={content.detailsLabel(name)}
              className="cursor-pointer rounded-sm text-left underline-offset-3 hover:text-crust hover:underline"
            >
              {name}
            </button>
          ) : (
            name
          )}
        </h3>
        {description && <p className="caption text-ink-muted">{description}</p>}
        {/* Inline wraps, so the stepper keeps full-size buttons on a narrow two-column card. */}
        <div
          ref={actions}
          className={cx(
            "mt-auto flex gap-2 pt-2",
            stacked ? "flex-col items-stretch" : "flex-wrap items-center justify-between",
          )}
        >
          <span className={cx("price", isSoldOut && "text-ink-muted line-through")}>
            {formatCents(priceCents)}
          </span>
          {isSoldOut ? (
            <span className="caption font-bold text-brick">
              {typeof soldOut === "string" ? soldOut : content.soldOut}
            </span>
          ) : showStepper ? (
            <QuantityStepper
              value={quantity}
              onChange={changeQuantity}
              label={name}
              block={stacked}
            />
          ) : (
            <Button
              variant="primary"
              icon="plus"
              block={stacked}
              onClick={add}
              aria-label={content.addLabel(name)}
            >
              {content.add}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
