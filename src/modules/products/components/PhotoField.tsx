"use client";

import { useId, useRef } from "react";
import { Button } from "@/shared/components/atoms/Button/Button";
import { FieldError } from "@/shared/components/atoms/Field/FieldError";
import { FieldHint } from "@/shared/components/atoms/Field/FieldHint";
import { FieldLabel } from "@/shared/components/atoms/Field/FieldLabel";
import { productsContent } from "../content/productsContent";
import type { ChosenPhoto } from "../hooks/useProductForm";
import { PHOTO_ACCEPT } from "../lib/photoRules";
import { ProductThumb } from "./ProductThumb";

const content = productsContent.form.photo;

export interface PhotoFieldProps {
  name: string;
  /** The saved photo's URL, if there is one. */
  currentUrl: string | null;
  chosen: ChosenPhoto | null;
  /** True while the chosen file is being shrunk for upload. */
  preparing: boolean;
  /** Why the last file chosen can't be used, if it can't. */
  error: string | null;
  onChoose: (file: File) => void;
  /** Asks to remove the saved photo; offered only while no new file is chosen. */
  onRemove?: () => void;
  removing?: boolean;
}

/**
 * The product's photo (optional): a preview, then "Choose photo". The form
 * shrinks the file in the browser (useProductForm); the server decides from
 * the bytes whether it's a JPEG, PNG or WebP, and crops it to 4:3.
 */
export function PhotoField({
  name,
  currentUrl,
  chosen,
  preparing,
  error,
  onChoose,
  onRemove,
  removing = false,
}: PhotoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const errorId = useId();

  const onFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    // Cleared so choosing the same file again still counts as a change.
    event.target.value = "";
    if (file) onChoose(file);
  };

  return (
    <div className="flex flex-col gap-2">
      <FieldLabel as="div" optional>
        {content.label}
      </FieldLabel>
      <div className="flex items-center gap-5">
        <ProductThumb
          name={name}
          src={chosen?.previewUrl ?? currentUrl}
          size="form"
          local={chosen !== null}
        />
        <div className="flex min-w-0 flex-col items-start gap-2">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              aria-describedby={[hintId, error ? errorId : null].filter(Boolean).join(" ")}
              onClick={() => inputRef.current?.click()}
            >
              {currentUrl || chosen ? content.replace : content.choose}
            </Button>
            {onRemove && currentUrl && !chosen && !preparing && (
              <Button
                variant="danger"
                icon="cross"
                aria-disabled={removing || undefined}
                onClick={() => !removing && onRemove()}
              >
                {removing ? content.removing : content.remove}
              </Button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={PHOTO_ACCEPT}
            tabIndex={-1}
            aria-hidden="true"
            className="hidden"
            onChange={onFile}
          />
          <FieldHint id={hintId}>
            {preparing ? content.preparing : chosen ? content.chosen(chosen.file.name) : content.hint}
          </FieldHint>
          <FieldError id={errorId} error={error} />
        </div>
      </div>
    </div>
  );
}
