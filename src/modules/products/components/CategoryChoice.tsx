"use client";

import { useId } from "react";
import { Button } from "@/shared/components/atoms/Button/Button";
import { FieldError } from "@/shared/components/atoms/Field/FieldError";
import { FieldLabel } from "@/shared/components/atoms/Field/FieldLabel";
import { pressedClasses } from "@/shared/components/molecules/FilterButtons/FilterButtons";
import { productsContent } from "../content/productsContent";

const content = productsContent.form.category;

export interface CategoryChoiceProps {
  /** On the first button, so an invalid submit can focus the group. */
  id: string;
  categories: string[];
  value: string;
  isNew: boolean;
  onPick: (category: string) => void;
  onPickNew: () => void;
  error?: string;
}

/** The existing categories as pressed buttons, then "New category" (AC-P1: choose one or type a new one). */
export function CategoryChoice({ id, categories, value, isNew, onPick, onPickNew, error }: CategoryChoiceProps) {
  const labelId = useId();
  const errorId = useId();
  return (
    <div
      role="group"
      aria-labelledby={labelId}
      aria-describedby={error ? errorId : undefined}
      className="flex flex-col gap-2"
    >
      <FieldLabel as="div" id={labelId}>
        {content.label}
      </FieldLabel>
      <div className="flex flex-wrap gap-2">
        {categories.map((category, index) => (
          <Button
            key={category}
            id={index === 0 ? id : undefined}
            variant="secondary"
            aria-pressed={!isNew && value === category}
            onClick={() => onPick(category)}
            className={pressedClasses}
          >
            {category}
          </Button>
        ))}
        <Button
          id={categories.length === 0 ? id : undefined}
          variant="secondary"
          icon="plus"
          aria-pressed={isNew}
          onClick={onPickNew}
          className={pressedClasses}
        >
          {content.newButton}
        </Button>
      </div>
      <FieldError id={errorId} error={error} />
    </div>
  );
}
