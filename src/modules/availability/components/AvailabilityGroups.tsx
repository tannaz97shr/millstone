"use client";

import Link from "next/link";
import type { IsoDate } from "@/shared/domain";
import { routes } from "@/shared/routes";
import { availabilityContent } from "../content/availabilityContent";
import type { AvailabilityChange } from "../lib/availabilityRules";
import type { AvailabilityCategory, AvailabilityProduct } from "../types/availability";
import { AvailabilityRow } from "./AvailabilityRow";

const content = availabilityContent;

export interface AvailabilityGroupsProps {
  categories: AvailabilityCategory[];
  branchName: string;
  date: IsoDate;
  /** Owner only: products hidden from every menu, which aren't listed. */
  hiddenCount: number | null;
  onChange: (product: AvailabilityProduct, change: AvailabilityChange) => void;
}

/** A4's list: a heading per category with how many are off, then a row per product. */
export function AvailabilityGroups({ categories, branchName, date, hiddenCount, onChange }: AvailabilityGroupsProps) {
  return (
    <>
      {categories.length === 0 && <p className="text-ink-muted">{content.load.empty}</p>}
      {categories.map((category) => {
        const headingId = `av-${category.slug}`;
        const off = category.products.filter((product) => !product.state.isAvailable).length;
        return (
          <section key={category.slug} aria-labelledby={headingId} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline gap-x-4">
              <h2 id={headingId} className="font-serif text-[28px]/[36px] font-bold">
                {category.name}
              </h2>
              <span className="text-[18px]/[24px] text-ink-muted">
                {content.caption(category.products.length, off)}
              </span>
            </div>
            {category.products.map((product) => (
              <AvailabilityRow
                key={product.id}
                product={product}
                branchName={branchName}
                date={date}
                onChange={onChange}
              />
            ))}
          </section>
        );
      })}
      {hiddenCount ? (
        <p className="text-[18px]/[26px] text-ink-muted">
          {content.hiddenNote(hiddenCount)}{" "}
          <Link
            href={routes.admin.products}
            className="font-bold text-crust underline underline-offset-3 hover:text-crust-deep"
          >
            {content.manageProducts}
          </Link>
        </p>
      ) : null}
    </>
  );
}
