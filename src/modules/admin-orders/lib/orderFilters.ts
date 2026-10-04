import { z } from "zod";
import { branchIdParam, pickupDateParam } from "@/modules/branches/lib/branchParams";
import type { BranchId, IsoDate, VisibleOrderStatus } from "@/shared/domain";

// A2's filters, shared by the page URL and GET /api/admin/orders. Defaults
// are left out of the URL, so plain /admin is the default list (AC-A2).

/** "todo" is placed and ready together: the default. */
export const STATUS_FILTERS = ["todo", "placed", "ready", "collected", "cancelled"] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

/** The order statuses each filter shows. */
export const STATUSES_FOR: Record<StatusFilter, readonly VisibleOrderStatus[]> = {
  todo: ["placed", "ready"],
  placed: ["placed"],
  ready: ["ready"],
  collected: ["collected"],
  cancelled: ["cancelled"],
};

export const isFinalFilter = (status: StatusFilter) => status === "collected" || status === "cancelled";

export const DATE_PRESETS = ["all", "today", "tomorrow"] as const;
export type DatePreset = (typeof DATE_PRESETS)[number];
/** A preset, or one pickup date. "today" stays a word so a tablet left on overnight rolls over. */
export type DateFilter = DatePreset | IsoDate;

/** Longest search a person would type; anything longer is cut. */
export const SEARCH_MAX_LENGTH = 60;

export interface AdminOrderFilters {
  status: StatusFilter;
  date: DateFilter;
  /** Owner only; null is every branch. Staff are always on their own. */
  branch: BranchId | null;
  /** Free text; when it isn't blank, the other filters are ignored (every date and status). */
  q: string;
}

export const DEFAULT_FILTERS: AdminOrderFilters = { status: "todo", date: "all", branch: null, q: "" };

const dateFilterParam = z.union([z.enum(DATE_PRESETS), pickupDateParam]);

/** Strict: the API answers 400 for a value it doesn't know. */
export const adminOrderFiltersSchema = z.object({
  status: z.enum(STATUS_FILTERS).default(DEFAULT_FILTERS.status),
  date: dateFilterParam.default(DEFAULT_FILTERS.date),
  branch: branchIdParam.nullable().default(null),
  q: z.string().max(SEARCH_MAX_LENGTH * 2).default("").transform((q) => q.trim().slice(0, SEARCH_MAX_LENGTH)),
});

type ParamsSource = URLSearchParams | Record<string, string | string[] | undefined>;

function read(source: ParamsSource, key: string): string | undefined {
  if (source instanceof URLSearchParams) return source.get(key) ?? undefined;
  const value = source[key];
  return Array.isArray(value) ? value[0] : value;
}

/** Raw query values for the schema; an empty value counts as missing. */
export function filterInput(source: ParamsSource): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const key of ["status", "date", "branch", "q"] as const) {
    const value = read(source, key);
    out[key] = value === "" ? undefined : value;
  }
  return out;
}

/** Lenient, for a page URL: anything unreadable falls back to its default. */
export function filtersFromUrl(source: ParamsSource): AdminOrderFilters {
  const input = filterInput(source);
  const field = <K extends keyof AdminOrderFilters>(key: K): AdminOrderFilters[K] => {
    const parsed = adminOrderFiltersSchema.shape[key].safeParse(input[key]);
    return (parsed.success ? parsed.data : DEFAULT_FILTERS[key]) as AdminOrderFilters[K];
  };
  return { status: field("status"), date: field("date"), branch: field("branch"), q: field("q") };
}

/** Query values for a URL or the API, leaving out defaults. */
export function filtersToQuery(filters: AdminOrderFilters): Record<string, string> {
  const out: Record<string, string> = {};
  if (filters.status !== DEFAULT_FILTERS.status) out.status = filters.status;
  if (filters.date !== DEFAULT_FILTERS.date) out.date = filters.date;
  if (filters.branch) out.branch = filters.branch;
  const q = filters.q.trim();
  if (q) out.q = q;
  return out;
}

export const isSearching = (filters: Pick<AdminOrderFilters, "q">) => filters.q.trim().length > 0;

/**
 * Whether a row still belongs on screen after this tablet changed it: a
 * collected order leaves To do straight away (A2 design). A search shows
 * every status. Dates never change, so only the status is checked.
 */
export function rowFitsFilters(row: { status: VisibleOrderStatus }, filters: AdminOrderFilters): boolean {
  return isSearching(filters) || STATUSES_FOR[filters.status].includes(row.status);
}
