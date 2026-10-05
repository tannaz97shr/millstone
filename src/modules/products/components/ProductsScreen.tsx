"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/shared/components/atoms/Button/Button";
import { LoadErrorNotice, LoadingMessage } from "@/shared/components/molecules/LoadState/LoadState";
import { type StatusMessage, StatusLine } from "@/shared/components/molecules/StatusLine/StatusLine";
import type { ProductId } from "@/shared/domain";
import { productsContent } from "../content/productsContent";
import { useAdminProductsQuery } from "../hooks/useAdminProductsQuery";
import type { SavedProduct } from "../hooks/useProductForm";
import { groupProducts } from "../lib/productList";
import type { AdminProduct } from "../types/adminProduct";
import { ProductFormPanel } from "./ProductFormPanel";
import { ProductRow } from "./ProductRow";

const content = productsContent;
const STATUS_ID = "products-status";

/** Which product the panel is open on; a new key remounts the form. */
interface Editing {
  key: string;
  product: AdminProduct | null;
}

/**
 * A5 products, owner only (AC-P1 to P3): the shared catalogue by category,
 * with the side panel to add or edit a product, change its price or photo,
 * and hide or show it again.
 */
export function ProductsScreen() {
  const query = useAdminProductsQuery();
  const data = query.data;
  const [editing, setEditing] = useState<Editing | null>(null);
  const [message, setMessage] = useState<StatusMessage | null>(null);
  // The product whose Edit gets focus once the panel has closed after a save.
  const focusAfterSave = useRef<ProductId | null>(null);
  const [newCount, setNewCount] = useState(0);

  // After a save, focus goes to that product's Edit. The panel's own return of
  // focus (to Add product or Edit) runs first, in its effect cleanup.
  useEffect(() => {
    const productId = focusAfterSave.current;
    if (!productId || editing) return;
    focusAfterSave.current = null;
    const target = document.querySelector<HTMLElement>(`[data-product-row="${CSS.escape(productId)}"] [data-edit]`);
    (target ?? document.getElementById(STATUS_ID))?.focus();
  }, [editing, data]);

  const openNew = () => {
    setMessage(null);
    setNewCount((n) => n + 1);
    setEditing({ key: `new-${newCount}`, product: null });
  };
  const openEdit = (product: AdminProduct) => {
    setMessage(null);
    setEditing({ key: product.id, product });
  };
  const close = useCallback(() => setEditing(null), []);
  const saved = useCallback(
    ({ product, change }: SavedProduct) => {
      setEditing(null);
      setMessage({
        tone: "success",
        text:
          change === "added"
            ? content.messages.added(product.name, data?.branchCount ?? 0, product.isActive)
            : content.messages.saved(product.name, change),
      });
      focusAfterSave.current = product.id;
    },
    [data?.branchCount],
  );

  const groups = data ? groupProducts(data.products, data.categories) : [];
  const hidden = data?.products.filter((p) => !p.isActive).length ?? 0;

  return (
    <div className="flex flex-col">
      <section
        aria-label={content.regionLabel}
        className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b-2 border-line px-8 pt-6 pb-5"
      >
        <div className="flex flex-col gap-1">
          <h1 className="admin-title">{content.title}</h1>
          <p className="max-w-160 text-[18px]/[26px] text-ink-muted">{content.intro(data?.branchCount ?? 3)}</p>
        </div>
        <Button variant="primary" icon="plus" onClick={openNew} disabled={!data}>
          {content.add}
        </Button>
      </section>

      {data && (
        <StatusLine
          id={STATUS_ID}
          message={message}
          onDismissMessage={() => setMessage(null)}
          summary={content.summary(data.products.length, hidden)}
        />
      )}

      <div className="flex flex-col gap-7 px-8 pt-1 pb-10">
        {query.isError && (
          <LoadErrorNotice retryLabel={content.load.retry} onRetry={() => void query.refetch()} retrying={query.isFetching}>
            {content.load.failed}
          </LoadErrorNotice>
        )}
        {!data && !query.isError && <LoadingMessage>{content.load.loading}</LoadingMessage>}
        {data && groups.length === 0 && <p className="text-ink-muted">{content.load.empty}</p>}
        {data &&
          groups.map((group) => {
            const headingId = `products-${group.slug}`;
            return (
              <section key={group.name} aria-labelledby={headingId} className="flex flex-col gap-3">
                <div className="flex flex-wrap items-baseline gap-x-4">
                  <h2 id={headingId} className="font-serif text-[28px]/[36px] font-bold">
                    {group.name}
                  </h2>
                  <span className="text-[18px]/[24px] text-ink-muted">
                    {content.caption(group.products.length, group.hidden)}
                  </span>
                </div>
                {group.products.map((product) => (
                  <ProductRow key={product.id} product={product} branchCount={data.branchCount} onEdit={openEdit} />
                ))}
              </section>
            );
          })}
      </div>

      {data && editing && (
        <ProductFormPanel
          key={editing.key}
          product={editing.product}
          categories={data.categories}
          branchCount={data.branchCount}
          onClose={close}
          onSaved={saved}
        />
      )}
    </div>
  );
}
