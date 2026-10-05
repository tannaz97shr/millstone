"use client";

import { useEffect, useRef } from "react";
import { Controller } from "react-hook-form";
import { Button } from "@/shared/components/atoms/Button/Button";
import { Toggle } from "@/shared/components/atoms/Toggle/Toggle";
import { Notice } from "@/shared/components/molecules/Notice/Notice";
import { TextField } from "@/shared/components/molecules/TextField/TextField";
import { SidePanel } from "@/shared/components/organisms/SidePanel/SidePanel";
import { formatCents } from "@/shared/utils/money";
import { productsContent } from "../content/productsContent";
import {
  PRODUCT_FIELD_IDS,
  PRODUCT_PANEL_MESSAGE_ID,
  type SavedProduct,
  useProductForm,
} from "../hooks/useProductForm";
import { parsePriceInput } from "../lib/productFields";
import type { AdminProduct } from "../types/adminProduct";
import { CategoryChoice } from "./CategoryChoice";
import { PhotoField } from "./PhotoField";

const content = productsContent.form;
const FORM_ID = "product-form";

export interface ProductFormPanelProps {
  /** The product being edited, or null for a new one. Read once: remount (key) for another. */
  product: AdminProduct | null;
  categories: string[];
  branchCount: number;
  onClose: () => void;
  onSaved: (saved: SavedProduct) => void;
}

/** A5's side panel for a new or an edited product (ProductNew, ProductEdit, ProductHide). */
export function ProductFormPanel({ product, categories, branchCount, onClose, onSaved }: ProductFormPanelProps) {
  const { form, current, photo, choosePhoto, saving, message, dismissMessage, submit } = useProductForm({
    product,
    onSaved,
  });
  const { register, control, watch, setValue, formState } = form;
  const errors = formState.errors;
  const [name, category, newCategory, price, isActive] = watch(["name", "category", "newCategory", "price", "isActive"]);

  // A save's message (a refused photo, a 409) takes focus once it's on screen.
  useEffect(() => {
    if (message) document.getElementById(PRODUCT_PANEL_MESSAGE_ID)?.focus();
  }, [message]);

  const validateNow = { shouldValidate: formState.isSubmitted, shouldDirty: true };
  const newPrice = parsePriceInput(price);
  const priceChanged = current !== null && newPrice !== null && newPrice !== current.priceCents;
  const hiding = current !== null && current.isActive && !isActive;

  // The hiding note can land below the panel's fold in a short window: bring it into view.
  const hideNoteRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!hiding) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    hideNoteRef.current?.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [hiding]);

  return (
    <SidePanel
      open
      onClose={onClose}
      closeLabel={content.close}
      title={current ? content.titleEdit(name.trim() || current.name) : content.titleNew}
      footer={
        <div className="flex gap-3">
          <Button
            type="submit"
            variant="primary"
            form={FORM_ID}
            icon="check"
            className="grow"
            aria-disabled={saving || undefined}
          >
            {saving ? content.saving : current ? content.saveEdit : content.saveNew}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            {content.cancel}
          </Button>
        </div>
      }
    >
      <form
        id={FORM_ID}
        noValidate
        className="flex flex-col gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (!saving) void submit();
        }}
      >
        {message && (
          <Notice tone={message.tone} onDismiss={dismissMessage}>
            <span id={PRODUCT_PANEL_MESSAGE_ID} tabIndex={-1} className="focus-visible:shadow-none">
              {message.text}
            </span>
          </Notice>
        )}
        {!current && (
          <Notice tone="info" role="note">
            {content.newNote(branchCount)}
          </Notice>
        )}

        <TextField
          id={PRODUCT_FIELD_IDS.name}
          label={content.name.label}
          placeholder={content.name.placeholder}
          autoComplete="off"
          error={errors.name?.message}
          {...register("name")}
        />
        <TextField
          id={PRODUCT_FIELD_IDS.description}
          label={content.description.label}
          hint={content.description.hint}
          optional
          multiline
          rows={2}
          error={errors.description?.message}
          {...register("description")}
        />

        <CategoryChoice
          id={PRODUCT_FIELD_IDS.category}
          categories={categories}
          value={category}
          isNew={newCategory}
          onPick={(next) => {
            setValue("newCategory", false, validateNow);
            setValue("category", next, validateNow);
          }}
          onPickNew={() => setValue("newCategory", true, validateNow)}
          error={errors.category?.message}
        />
        {newCategory && (
          <TextField
            id={PRODUCT_FIELD_IDS.newCategoryName}
            label={content.category.newLabel}
            hint={content.category.newHint}
            autoComplete="off"
            error={errors.newCategoryName?.message}
            {...register("newCategoryName")}
          />
        )}

        <TextField
          id={PRODUCT_FIELD_IDS.price}
          label={content.price.label}
          hint={content.price.hint}
          inputMode="decimal"
          autoComplete="off"
          error={errors.price?.message}
          {...register("price")}
        />
        {priceChanged && current && newPrice !== null && (
          <Notice tone="info" role="note">
            {content.price.note(formatCents(newPrice), formatCents(current.priceCents))}
          </Notice>
        )}

        <PhotoField name={name} currentUrl={current?.imageUrl ?? null} chosen={photo} onChoose={choosePhoto} />

        <div className="flex flex-col gap-3 border-t-2 border-line pt-2">
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <Toggle
                label={content.active.label}
                checked={field.value}
                onChange={field.onChange}
                onText={content.active.onText}
                offText={content.active.offText}
              />
            )}
          />
          {hiding && (
            <div ref={hideNoteRef}>
              <Notice tone="warning" role="note">
                <strong>{content.active.hideNoteStrong(branchCount)}</strong> {content.active.hideNote}
              </Notice>
            </div>
          )}
        </div>
      </form>
    </SidePanel>
  );
}
