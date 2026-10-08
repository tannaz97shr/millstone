"use client";

import { useEffect, useRef, useState } from "react";
import { Controller } from "react-hook-form";
import { Button } from "@/shared/components/atoms/Button/Button";
import { Toggle } from "@/shared/components/atoms/Toggle/Toggle";
import { Notice } from "@/shared/components/molecules/Notice/Notice";
import { TextField } from "@/shared/components/molecules/TextField/TextField";
import { Dialog } from "@/shared/components/organisms/Dialog/Dialog";
import { SidePanel } from "@/shared/components/organisms/SidePanel/SidePanel";
import { formatCents } from "@/shared/utils/money";
import { productsContent } from "../content/productsContent";
import {
  PRODUCT_FIELD_IDS,
  PRODUCT_PANEL_MESSAGE_ID,
  type SavedProduct,
  useProductForm,
} from "../hooks/useProductForm";
import { parsePriceInput, productLetter } from "../lib/productFields";
import { hasUnsavedChanges } from "../lib/unsavedChanges";
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
  const {
    form,
    current,
    photo,
    choosePhoto,
    photoPreparing,
    photoError,
    saving,
    removePhoto,
    removingPhoto,
    message,
    dismissMessage,
    submit,
  } = useProductForm({ product, onSaved });
  const { register, control, watch, setValue, getValues, formState } = form;
  const errors = formState.errors;
  const [name, category, newCategory, price, isActive] = watch(["name", "category", "newCategory", "price", "isActive"]);
  // The dialogs name the product as saved, not as typed.
  const savedName = current?.name ?? "";

  // Close, Cancel, Escape and a tap on the dimmed list all ask first when something would be lost.
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const requestClose = () => {
    if (hasUnsavedChanges(getValues(), current, photo !== null || photoPreparing)) setConfirmDiscard(true);
    else onClose();
  };

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
    <>
      <SidePanel
        open
        onClose={requestClose}
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
              aria-disabled={saving || photoPreparing || undefined}
            >
              {saving ? content.saving : current ? content.saveEdit : content.saveNew}
            </Button>
            <Button variant="secondary" onClick={requestClose}>
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
            // A photo still being prepared would be left out of the save.
            if (!saving && !photoPreparing) void submit();
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

          <PhotoField
            name={name}
            currentUrl={current?.imageUrl ?? null}
            chosen={photo}
            preparing={photoPreparing}
            error={photoError}
            onChoose={(file) => void choosePhoto(file)}
            onRemove={() => setConfirmRemove(true)}
            removing={removingPhoto}
          />

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

      <Dialog
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        role="alertdialog"
        adminLayout="confirm"
        title={content.photo.removeTitle(savedName)}
        description={content.photo.removeBody(productLetter(savedName))}
        actions={
          <>
            <Button
              variant="danger"
              icon="cross"
              onClick={() => {
                setConfirmRemove(false);
                void removePhoto();
              }}
            >
              {content.photo.removeConfirm}
            </Button>
            <Button variant="secondary" onClick={() => setConfirmRemove(false)}>
              {content.photo.removeKeep}
            </Button>
          </>
        }
      />
      <Dialog
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        role="alertdialog"
        adminLayout="confirm"
        title={content.discard.title}
        description={current ? content.discard.bodyEdit(savedName) : content.discard.bodyNew}
        actions={
          <>
            <Button variant="danger" onClick={onClose}>
              {content.discard.confirm}
            </Button>
            <Button variant="secondary" onClick={() => setConfirmDiscard(false)}>
              {content.discard.keep}
            </Button>
          </>
        }
      />
    </>
  );
}
