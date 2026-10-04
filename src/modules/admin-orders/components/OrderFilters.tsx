"use client";

import { useEffect, useState } from "react";
import { Button } from "@/shared/components/atoms/Button/Button";
import { DatePicker } from "@/shared/components/molecules/DatePicker/DatePicker";
import { FilterButtons, type FilterOption } from "@/shared/components/molecules/FilterButtons/FilterButtons";
import { TextField } from "@/shared/components/molecules/TextField/TextField";
import type { BranchId, IsoDate, Weekday } from "@/shared/domain";
import { formatPickupDay, formatWeekdayList } from "@/shared/utils/pickup-dates";
import { adminOrdersContent } from "../content/adminOrdersContent";
import {
  type AdminOrderFilters,
  DATE_PRESETS,
  isSearching,
  SEARCH_MAX_LENGTH,
  STATUS_FILTERS,
  type StatusFilter,
} from "../lib/orderFilters";
import type { AdminBranchOption } from "../types/adminOrder";

const content = adminOrdersContent.filters;

/** Typing settles for this long before the list searches. */
const SEARCH_DEBOUNCE_MS = 300;

type DateChoice = (typeof DATE_PRESETS)[number] | "custom";
const ALL_BRANCHES = "all";

export interface OrderFiltersProps {
  filters: AdminOrderFilters;
  onChange: (changes: Partial<AdminOrderFilters>) => void;
  owner: boolean;
  /** Melbourne today, from the server; the month grid needs it. */
  today: IsoDate | null;
  branches: AdminBranchOption[];
  counts: Record<StatusFilter, number> | null;
}

/** Weekdays every branch in view is closed: the month grid strikes them through. */
function sharedClosedDays(branches: AdminBranchOption[]): Weekday[] {
  if (branches.length === 0) return [];
  return branches[0].closedDays.filter((day) => branches.every((branch) => branch.closedDays.includes(day)));
}

/**
 * A2's search and filters (AC-A3): search across every date and status, or
 * filter by pickup date, status and (owner) branch. Every choice is a button
 * with a word on it; the month grid opens under "Choose date".
 */
export function OrderFilters({ filters, onChange, owner, today, branches, counts }: OrderFiltersProps) {
  const [text, setText] = useState(filters.q);
  const [picking, setPicking] = useState(false);
  const searching = isSearching(filters);

  // The URL is the source of truth: follow it when it changes from elsewhere (Clear search).
  const [lastQ, setLastQ] = useState(filters.q);
  if (filters.q !== lastQ) {
    setLastQ(filters.q);
    if (filters.q.trim() !== text.trim()) setText(filters.q);
  }

  useEffect(() => {
    if (text.trim() === filters.q.trim()) return;
    const timer = window.setTimeout(() => onChange({ q: text.trim() }), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [text, filters.q, onChange]);

  const custom = !(DATE_PRESETS as readonly string[]).includes(filters.date);
  const customDate = custom ? (filters.date as IsoDate) : null;
  const dateOptions: FilterOption<DateChoice>[] = [
    { value: "all", label: content.dates.all, pressed: filters.date === "all" },
    { value: "today", label: content.dates.today, pressed: filters.date === "today" },
    { value: "tomorrow", label: content.dates.tomorrow, pressed: filters.date === "tomorrow" },
    { value: "custom", label: customDate ? formatPickupDay(customDate) : content.dates.custom, pressed: custom },
  ];

  const statusOptions: FilterOption<StatusFilter>[] = STATUS_FILTERS.map((status) => ({
    value: status,
    label: counts ? content.withCount(content.statuses[status], counts[status]) : content.statuses[status],
  }));

  const branchOptions: FilterOption<string>[] = [
    { value: ALL_BRANCHES, label: content.allBranches },
    ...branches.map((branch) => ({ value: branch.id, label: branch.name })),
  ];

  const closedDays = sharedClosedDays(branches);

  const clearSearch = () => {
    setText("");
    onChange({ q: "" });
  };

  return (
    <section
      aria-label={content.regionLabel}
      className="flex flex-col gap-4 border-b-2 border-line px-8 pt-5 pb-4"
    >
      <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
        <TextField
          className="min-w-90 grow basis-90"
          label={content.searchLabel}
          placeholder={content.searchPlaceholder}
          type="search"
          inputMode="search"
          autoComplete="off"
          maxLength={SEARCH_MAX_LENGTH}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onChange({ q: text.trim() });
          }}
        />
        {searching ? (
          <Button variant="secondary" icon="cross" onClick={clearSearch}>
            {content.clearSearch}
          </Button>
        ) : (
          <FilterButtons
            label={content.dateLabel}
            options={dateOptions}
            value={custom ? "custom" : (filters.date as DateChoice)}
            onChange={(choice) => {
              if (choice === "custom") {
                setPicking((open) => !open);
                return;
              }
              setPicking(false);
              onChange({ date: choice });
            }}
          />
        )}
      </div>

      {picking && !searching && today && (
        <div className="flex flex-wrap items-start justify-end gap-6">
          <DatePicker
            layout="month"
            label={content.pickerLabel}
            value={customDate}
            today={today}
            closedWeekdays={closedDays}
            note={closedDays.length > 0 ? content.closedNote(formatWeekdayList(closedDays)) : undefined}
            onChange={(date) => {
              setPicking(false);
              onChange({ date });
            }}
          />
          <Button variant="secondary" icon="cross" className="mt-8" onClick={() => setPicking(false)}>
            {content.closePicker}
          </Button>
        </div>
      )}

      {searching ? (
        <p className="text-[18px]/[26px] text-ink-muted">{content.searching}</p>
      ) : (
        <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
          <FilterButtons
            label={content.statusLabel}
            options={statusOptions}
            value={filters.status}
            onChange={(status) => onChange({ status })}
          />
          {owner && (
            <FilterButtons
              label={content.branchLabel}
              options={branchOptions}
              value={filters.branch ?? ALL_BRANCHES}
              onChange={(branch) => onChange({ branch: branch === ALL_BRANCHES ? null : (branch as BranchId) })}
            />
          )}
        </div>
      )}
    </section>
  );
}
