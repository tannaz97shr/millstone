"use client";

import { useState } from "react";
import { OrderRow } from "@/shared/components/organisms/OrderRow/OrderRow";
import { devComponentsContent } from "../../content/devComponents";
import { sampleOrders } from "../../lib/sampleData";

const content = devComponentsContent;
const copy = content.orderRow;

/** Every row, with a readout of the last button pressed. */
export function OrderRowDemo() {
  const [lastAction, setLastAction] = useState<string>(copy.none);
  return (
    <div className="flex flex-col gap-4">
      <p className="caption text-ink-muted">
        {content.captions.lastAction}: <span data-testid="last-action">{lastAction}</span>
      </p>
      {sampleOrders.map((order) => (
        <OrderRow
          key={order.orderNumber}
          {...order}
          onReady={() => setLastAction(copy.ready(order.orderNumber))}
          onCollected={() => setLastAction(copy.collected(order.orderNumber))}
          onOpen={() => setLastAction(copy.opened(order.orderNumber))}
        />
      ))}
    </div>
  );
}
