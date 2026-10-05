import { Button } from "@/shared/components/atoms/Button/Button";
import { Stamp } from "@/shared/components/atoms/Stamp/Stamp";
import { cx } from "@/shared/utils/cx";
import { formatCents } from "@/shared/utils/money";
import { productsContent } from "../content/productsContent";
import { productWhere } from "../lib/productList";
import type { AdminProduct } from "../types/adminProduct";
import { ProductThumb } from "./ProductThumb";

const content = productsContent.row;

export interface ProductRowProps {
  product: AdminProduct;
  branchCount: number;
  onEdit: (product: AdminProduct) => void;
}

/** One product in A5's list: photo or letter, name and description, price, where it's on, and Edit. */
export function ProductRow({ product, branchCount, onEdit }: ProductRowProps) {
  const shown = product.isActive;
  return (
    <article
      aria-label={product.name}
      data-product-row={product.id}
      className={cx(
        "flex min-h-22 items-center gap-5 rounded-lg border-2 border-line px-5 py-3",
        shown ? "bg-flour-raised shadow-card" : "border-dashed bg-flour",
      )}
    >
      <ProductThumb name={product.name} src={product.imageUrl} size="row" />
      <div className="flex min-w-0 grow flex-col gap-0.5">
        <span className={cx("admin-strong", !shown && "text-ink-muted")}>{product.name}</span>
        <span className="text-[16px]/[22px] text-ink-muted">{product.description || content.noDescription}</span>
      </div>
      <span className="admin-strong w-24 shrink-0 text-right tabular-nums">{formatCents(product.priceCents)}</span>
      <span className="w-50 shrink-0 text-[16px]/[22px] text-ink-muted">{productWhere(product, branchCount)}</span>
      <span className="flex w-37.5 shrink-0">
        <Stamp
          shape="tag"
          icon={shown ? "check" : "cross"}
          toneClassName={
            shown
              ? "bg-flour-raised text-ink border-line-strong"
              : "bg-transparent text-ink-muted border-line-strong border-dashed"
          }
        >
          {shown ? content.onMenus : content.hidden}
        </Stamp>
      </span>
      <Button
        variant="secondary"
        data-edit
        aria-label={content.editLabel(product.name)}
        onClick={() => onEdit(product)}
        className="shrink-0"
      >
        {content.edit}
      </Button>
    </article>
  );
}
