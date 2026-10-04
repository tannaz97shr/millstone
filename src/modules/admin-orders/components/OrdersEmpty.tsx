import { Button } from "@/shared/components/atoms/Button/Button";
import { EmptyState } from "@/shared/components/molecules/EmptyState/EmptyState";
import { adminOrdersContent } from "../content/adminOrdersContent";
import { type AdminOrderFilters, isSearching } from "../lib/orderFilters";

const content = adminOrdersContent.empty;

export interface OrdersEmptyProps {
  filters: AdminOrderFilters;
  /** " for today", " for Tue 6 Oct" or "" (All dates). */
  where: string;
  onClearSearch: () => void;
  onShowAllDates: () => void;
}

/** A2 with nothing to show: a search with no match, an empty date, or nothing left to do. */
export function OrdersEmpty({ filters, where, onClearSearch, onShowAllDates }: OrdersEmptyProps) {
  if (isSearching(filters)) {
    return (
      <EmptyState
        title={content.searchTitle(filters.q.trim())}
        action={<Button onClick={onClearSearch}>{adminOrdersContent.filters.clearSearch}</Button>}
      >
        {content.searchHint}
      </EmptyState>
    );
  }
  if (filters.date !== "all") {
    return (
      <EmptyState title={content.dateTitle(where)} action={<Button onClick={onShowAllDates}>{content.showAllDates}</Button>}>
        {content.dateHint}
      </EmptyState>
    );
  }
  return <EmptyState title={content.statusTitle(filters.status)}>{content.statusHint}</EmptyState>;
}
