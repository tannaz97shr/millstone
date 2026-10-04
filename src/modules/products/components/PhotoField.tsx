"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/shared/components/atoms/Button/Button";
import { FieldError } from "@/shared/components/atoms/Field/FieldError";
import { FieldHint } from "@/shared/components/atoms/Field/FieldHint";
import { FieldLabel } from "@/shared/components/atoms/Field/FieldLabel";
import { productsContent } from "../content/productsContent";
import type { ChosenPhoto } from "../hooks/useProductForm";
import { PHOTO_ACCEPT, PHOTO_MAX_BYTES } from "../lib/photoRules";
import { ProductThumb } from "./ProductThumb";

const content = productsContent.form.photo;

export interface PhotoFieldProps {
  name: string;
  /** The saved photo's URL, if there is one. */
  currentUrl: string | null;
  chosen: ChosenPhoto | null;
  onChoose: (file: File | null) => void;
}

/**
 * The product's photo (optional): a preview, then "Choose photo". The file
 * is only checked here for size, to say so straight away; the server decides
 * from the bytes whether it's a JPEG, PNG or WebP, and crops it to 4:3.
 */
export function PhotoField({ name, currentUrl, chosen, onChoose }: PhotoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const errorId = useId();
  const [error, setError] = useState<string | null>(null);

  const onFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    // Cleared so choosing the same file again still counts as a change.
    event.target.value = "";
    if (!file) return;
    if (file.size > PHOTO_MAX_BYTES) {
      setError(productsContent.messages.photoWhy.tooLarge);
      return;
    }
    setError(null);
    onChoose(file);
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
          <Button
            variant="secondary"
            aria-describedby={[hintId, error ? errorId : null].filter(Boolean).join(" ")}
            onClick={() => inputRef.current?.click()}
          >
            {currentUrl || chosen ? content.replace : content.choose}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept={PHOTO_ACCEPT}
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only"
            onChange={onFile}
          />
          <FieldHint id={hintId}>{chosen ? content.chosen(chosen.file.name) : content.hint}</FieldHint>
          <FieldError id={errorId} error={error} />
        </div>
      </div>
    </div>
  );
}
