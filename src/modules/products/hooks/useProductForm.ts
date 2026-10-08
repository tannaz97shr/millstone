"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { type FieldErrors, useForm } from "react-hook-form";
import type { StatusMessage } from "@/shared/components/molecules/StatusLine/StatusLine";
import { toApiFailure } from "@/shared/lib/http/apiClient";
import { logError } from "@/shared/utils/logError";
import { createProduct, removeProductPhoto, updateProduct, uploadProductPhoto } from "../api/productsApi";
import { adminProductsQueryOptions } from "../api/productsQueries";
import { adminProductKeys } from "../api/queryKeys";
import { productsContent } from "../content/productsContent";
import { PHOTO_MAX_BYTES, PHOTO_SOURCE_MAX_BYTES } from "../lib/photoRules";
import { formatPriceInput } from "../lib/productFields";
import { withSavedProduct } from "../lib/productList";
import { resizePhoto } from "../lib/resizePhoto";
import {
  PRODUCT_FORM_FIELDS,
  productFormSchema,
  type ProductFormValues,
  toProductInput,
} from "../lib/productSchemas";
import type { AdminProduct, AdminProductsResponse } from "../types/adminProduct";

const content = productsContent;

/** IDs of the form's controls, so an invalid submit can focus the first one with an error. */
export const PRODUCT_FIELD_IDS: Record<(typeof PRODUCT_FORM_FIELDS)[number], string> = {
  name: "product-name",
  description: "product-description",
  category: "product-category",
  newCategoryName: "product-new-category",
  price: "product-price",
};
export const PRODUCT_PANEL_MESSAGE_ID = "product-panel-message";

export function formValuesFor(product: AdminProduct | null): ProductFormValues {
  if (!product) {
    return { name: "", description: "", category: "", newCategory: false, newCategoryName: "", price: "", isActive: true };
  }
  return {
    name: product.name,
    description: product.description,
    category: product.category,
    newCategory: false,
    newCategoryName: "",
    price: formatPriceInput(product.priceCents),
    isActive: product.isActive,
  };
}

function sameFields(product: AdminProduct, values: ProductFormValues): boolean {
  const input = toProductInput(values);
  return (
    input.name === product.name &&
    input.description === product.description &&
    input.category === product.category &&
    input.priceCents === product.priceCents &&
    input.isActive === product.isActive
  );
}

export interface ChosenPhoto {
  file: File;
  /** An object URL for the preview, until it's uploaded or replaced. */
  previewUrl: string;
}

export interface SavedProduct {
  product: AdminProduct;
  /** "added" for a new product; else whether it was hidden or shown by this save. */
  change: "added" | "hidden" | "shown" | null;
}

interface UseProductFormOptions {
  /** The product being edited, or null for a new one. */
  product: AdminProduct | null;
  onSaved: (saved: SavedProduct) => void;
}

/**
 * A5's form: fields in React Hook Form (validated with productFormSchema),
 * the chosen photo, and the save. Saving sends the fields first (create or
 * PATCH with the version read), then the photo with the version that came
 * back. If the photo fails after the fields saved, the panel stays open on
 * the saved product, so trying again only sends the photo.
 */
export function useProductForm({ product, onSaved }: UseProductFormOptions) {
  const queryClient = useQueryClient();
  // The product as last saved, so a retry after a failed photo edits it rather than adding another.
  const [current, setCurrent] = useState<AdminProduct | null>(product);
  const [photo, setPhoto] = useState<ChosenPhoto | null>(null);
  // The preview's object URL is made when a file is chosen and freed when it's replaced or the form closes.
  const previewRef = useRef<string | null>(null);
  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, []);
  const setChosenPhoto = useCallback((file: File | null) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const previewUrl = file ? URL.createObjectURL(file) : null;
    previewRef.current = previewUrl;
    setPhoto(file && previewUrl ? { file, previewUrl } : null);
  }, []);

  // A chosen file is shrunk in the browser before it counts as chosen, so the
  // upload fits Vercel's body limit. Only the latest choice applies.
  const [photoPreparing, setPhotoPreparing] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const prepareAttempt = useRef(0);
  const choosePhoto = useCallback(
    async (file: File) => {
      const attempt = ++prepareAttempt.current;
      const isLatest = () => attempt === prepareAttempt.current;
      setPhotoError(null);
      if (file.size > PHOTO_SOURCE_MAX_BYTES) {
        setPhotoError(content.form.photo.sourceTooLarge);
        return;
      }
      setPhotoPreparing(true);
      try {
        const resized = await resizePhoto(file);
        if (!isLatest()) return;
        // A file this browser can't decode goes up as it is if it fits: the server says what it is.
        const upload = resized ?? (file.size <= PHOTO_MAX_BYTES ? file : null);
        if (!upload) setPhotoError(content.messages.photoWhy.unsupported);
        else if (upload.size > PHOTO_MAX_BYTES) setPhotoError(content.messages.photoWhy.tooLarge);
        else setChosenPhoto(upload);
      } catch (error) {
        logError(error, "prepare photo", { level: "warn" });
        if (isLatest()) setPhotoError(content.form.photo.prepareFailed);
      } finally {
        if (isLatest()) setPhotoPreparing(false);
      }
    },
    [setChosenPhoto],
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<StatusMessage | null>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: formValuesFor(product),
    shouldFocusError: false,
  });

  const remember = useCallback(
    (saved: AdminProduct) => {
      setCurrent(saved);
      queryClient.setQueryData<AdminProductsResponse>(adminProductKeys.list(), (list) => list && withSavedProduct(list, saved));
    },
    [queryClient],
  );

  /** Someone saved it elsewhere: show their version in the form. */
  const reloadLatest = useCallback(
    async (productId: string) => {
      await queryClient.invalidateQueries({ queryKey: adminProductKeys.list() });
      const list = await queryClient.fetchQuery(adminProductsQueryOptions());
      const latest = list.products.find((p) => p.id === productId) ?? null;
      if (latest) {
        setCurrent(latest);
        form.reset(formValuesFor(latest));
      }
      return latest;
    },
    [form, queryClient],
  );

  const onValid = async (values: ProductFormValues) => {
    setSaving(true);
    setMessage(null);
    const before = current;
    let saved = current;
    try {
      if (!before) {
        saved = (await createProduct(toProductInput(values))).product;
        remember(saved);
      } else if (!sameFields(before, values)) {
        saved = (await updateProduct(before.id, { ...toProductInput(values), expectedVersion: before.version })).product;
        remember(saved);
      }
    } catch (error) {
      logError(error, `save product ${before?.id ?? "new"}`, { level: "warn" });
      const failure = toApiFailure(error);
      if (failure.code === "product_changed" && before) {
        await reloadLatest(before.id).catch((reloadError: unknown) => logError(reloadError, "reload product after 409"));
        setMessage({ tone: "error", text: content.messages.changed(before.name) });
      } else {
        setMessage({
          tone: "error",
          text:
            failure.code === "not_found"
              ? content.messages.gone
              : failure.code === "unavailable"
                ? content.messages.unavailable
                : content.messages.failed,
        });
      }
      setSaving(false);
      return;
    }

    if (photo && saved) {
      try {
        saved = (await uploadProductPhoto(saved.id, photo.file, saved.version)).product;
        remember(saved);
        setChosenPhoto(null);
      } catch (error) {
        logError(error, `upload photo ${saved.id}`, { level: "warn" });
        const failure = toApiFailure(error);
        const why = content.messages.photoWhy;
        // Vercel's own 413 (over its 4.5 MB body limit) isn't our JSON, so the status counts too.
        if (failure.code === "product_changed") {
          await reloadLatest(saved.id).catch((reloadError: unknown) => logError(reloadError, "reload product after 409"));
        }
        setMessage({
          tone: "error",
          text: content.messages.photoFailed(
            saved.name,
            failure.code === "unsupported_image"
              ? why.unsupported
              : failure.code === "file_too_large" || failure.status === 413
                ? why.tooLarge
                : failure.code === "image_too_small"
                  ? why.tooSmall
                  : why.failed,
          ),
        });
        setSaving(false);
        void queryClient.invalidateQueries({ queryKey: adminProductKeys.list() });
        return;
      }
    }

    setSaving(false);
    void queryClient.invalidateQueries({ queryKey: adminProductKeys.list() });
    if (!saved) return;
    onSaved({
      product: saved,
      change: !product ? "added" : before?.isActive && !saved.isActive ? "hidden" : !before?.isActive && saved.isActive ? "shown" : null,
    });
  };

  // Remove photo (after the panel's confirm dialog): saved at once, not on Save.
  // Typed fields stay as they are; `current` takes the new version for the next save.
  const [removingPhoto, setRemovingPhoto] = useState(false);
  const removePhoto = async () => {
    if (!current || removingPhoto) return;
    setRemovingPhoto(true);
    setMessage(null);
    try {
      const saved = (await removeProductPhoto(current.id, current.version)).product;
      remember(saved);
      setMessage({ tone: "success", text: content.messages.photoRemoved(saved.name) });
    } catch (error) {
      logError(error, `remove photo ${current.id}`, { level: "warn" });
      const failure = toApiFailure(error);
      if (failure.code === "product_changed") {
        await reloadLatest(current.id).catch((reloadError: unknown) => logError(reloadError, "reload product after 409"));
      }
      setMessage({
        tone: "error",
        text:
          failure.code === "product_changed"
            ? content.messages.changed(current.name)
            : failure.code === "not_found"
              ? content.messages.gone
              : failure.code === "unavailable"
                ? content.messages.unavailable
                : content.messages.failed,
      });
    } finally {
      setRemovingPhoto(false);
      void queryClient.invalidateQueries({ queryKey: adminProductKeys.list() });
    }
  };

  const onInvalid = (errors: FieldErrors<ProductFormValues>) => {
    // The fields say what to fix; an earlier save's message no longer applies.
    setMessage(null);
    const first = PRODUCT_FORM_FIELDS.find((field) => errors[field]);
    if (first) document.getElementById(PRODUCT_FIELD_IDS[first])?.focus();
  };

  return {
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
    dismissMessage: () => setMessage(null),
    submit: () => form.handleSubmit(onValid, onInvalid)(),
  };
}
