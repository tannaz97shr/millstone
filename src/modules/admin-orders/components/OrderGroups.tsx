"use client";

import { OrderRow } from "@/shared/components/organisms/OrderRow/OrderRow";
import type { IsoDate, OrderId } from "@/shared/domain";
import { formatPickupDay } from "@/shared/utils/pickup-dates";
import { adminOrdersContent } from "../content/adminOrdersContent";
import { ORDER_ROW_ATTRIBUTE } from "../hooks/useStableRows";
import type { OrderGroup } from "../lib/groupOrders";
import type { AdminOrderRow } from "../types/adminOrder";

const content = adminOrdersContent.groups;

export interface OrderGroupsProps {
  groups: OrderGroup[];
  today: IsoDate;
  tomorrow: IsoDate;
  /** Show "· 2 ready" under each date (the To do list). */
  showReadyCount: boolean;
  openOrderId: OrderId | null;
  onReady: (row: AdminOrderRow) => void;
  onCollected: (row: AdminOrderRow) => void;
  onOpen: (row: AdminOrderRow) => void;
  /** Focus entered a row: it's held in place until focus goes elsewhere. */
  onFocusRow: (row: AdminOrderRow) => void;
}

function dateLabel(date: IsoDate, today: IsoDate, tomorrow: IsoDate): string {
  const day = formatPickupDay(date);
  if (date === today) return content.today(day);
  if (date === tomorrow) return content.tomorrow(day);
  return day;
}

/** A2's orders by pickup date, and for the owner on All branches, by branch within each date. */
export function OrderGroups({
  groups,
  today,
  tomorrow,
  showReadyCount,
  openOrderId,
  onReady,
  onCollected,
  onOpen,
  onFocusRow,
}: OrderGroupsProps) {
  return (
    <>
      {groups.map((group) => {
        const label = dateLabel(group.date, today, tomorrow);
        return (
          <section key={group.date} aria-label={label} className="flex flex-col gap-4">
            <div className="flex flex-wrap items-baseline gap-x-4">
              <h2 className="admin-title">{label}</h2>
              <span className="text-[18px]/[24px] text-ink-muted">
                {content.caption(group.count, showReadyCount ? group.readyCount : null)}
              </span>
            </div>
            {group.sections.map((section) => (
              <div key={section.branch?.id ?? "all"} className="flex flex-col gap-4">
                {section.branch && (
                  <h3 className="mt-2 border-b-2 border-line pb-2 text-[20px]/[28px] font-bold">
                    {section.branch.name}{" "}
                    <span className="font-normal text-ink-muted">{content.branchCaption(section.rows.length)}</span>
                  </h3>
                )}
                {section.rows.map((row) => (
                  <div key={row.id} {...{ [ORDER_ROW_ATTRIBUTE]: row.id }} onFocus={() => onFocusRow(row)}>
                    <OrderRow
                      orderNumber={row.orderNumber}
                      status={row.status}
                      payment={row.paymentLabel}
                      customerName={row.contactName}
                      phone={row.contactPhone}
                      items={row.items}
                      totalCents={row.totalCents}
                      recurring={row.recurring}
                      notes={row.notes ?? undefined}
                      generationNote={row.generationNote ?? undefined}
                      selected={row.id === openOrderId}
                      onReady={() => onReady(row)}
                      onCollected={() => onCollected(row)}
                      onOpen={() => onOpen(row)}
                    />
                  </div>
                ))}
              </div>
            ))}
          </section>
        );
      })}
    </>
  );
}
