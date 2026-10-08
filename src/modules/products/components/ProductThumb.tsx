import Image from "next/image";
import { cx } from "@/shared/utils/cx";
import { productLetter } from "../lib/productFields";

export interface ProductThumbProps {
  name: string;
  /** A download URL, or a just-chosen file's object URL (`local`). */
  src: string | null;
  size: "row" | "form";
  /** An object URL: shown as is, not through the image optimiser. */
  local?: boolean;
}

const boxes = {
  row: { box: "h-13.5 w-18 text-[28px]", sizes: "72px" },
  form: { box: "h-30 w-40 text-[48px]", sizes: "160px" },
} as const;

/** A product's photo at 4:3, or its first letter on flour-sunk until there is one (design system). */
export function ProductThumb({ name, src, size, local = false }: ProductThumbProps) {
  const { box, sizes } = boxes[size];
  return (
    <div
      aria-hidden="true"
      className={cx(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-flour-sunk font-serif leading-none font-bold text-ink-muted",
        box,
      )}
    >
      {src ? (
        <Image src={src} alt="" fill sizes={sizes} unoptimized={local} className="object-cover" />
      ) : (
        productLetter(name)
      )}
    </div>
  );
}
