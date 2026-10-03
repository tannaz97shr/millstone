"use client";

import { useState } from "react";
import { useBranchesQuery } from "@/modules/branches/hooks/useBranchesQuery";
import type { BranchSummary } from "@/modules/branches/types/branchSummary";
import { cartContent } from "@/modules/cart/content/cartContent";
import { useCart } from "@/modules/cart/hooks/useCart";
import { cartCount } from "@/modules/cart/lib/cartLogic";
import { Button } from "@/shared/components/atoms/Button/Button";
import { ButtonLink } from "@/shared/components/atoms/ButtonLink/ButtonLink";
import { ChoiceGroup, type ChoiceOption } from "@/shared/components/molecules/ChoiceGroup/ChoiceGroup";
import { LoadErrorNotice, LoadingMessage } from "@/shared/components/molecules/LoadState/LoadState";
import { Notice } from "@/shared/components/molecules/Notice/Notice";
import { BottomBar } from "@/shared/components/organisms/BottomBar/BottomBar";
import { routes } from "@/shared/routes";
import { formatPhone } from "@/shared/utils/phone";
import { formatTimeOfDay } from "@/shared/utils/pickup-dates";
import { homeContent } from "../content/homeContent";
import { HowItWorks } from "./HowItWorks";

const content = homeContent;

/** "2pm" when every branch closes orders at the same time. */
function sharedCutoff(branches: BranchSummary[]): string | null {
  const times = new Set(branches.map((b) => b.orderCutoffTime));
  return times.size === 1 ? formatTimeOfDay(branches[0].orderCutoffTime) : null;
}

function branchOption(branch: BranchSummary): ChoiceOption {
  return {
    value: branch.id,
    label: <span className="branch-name">{branch.name}</span>,
    hint: (
      <span className="body flex flex-col">
        <span>{branch.address}</span>
        <span>{formatPhone(branch.phone)}</span>
        <span>{content.branchCutoff(formatTimeOfDay(branch.orderCutoffTime))}</span>
      </span>
    ),
  };
}

/**
 * C1. The first visit, a branch already chosen, and back from the menu with
 * items: all three come from the stored cart.
 */
export function HomeScreen() {
  const branchesQuery = useBranchesQuery();
  const cartState = useCart();
  const [picked, setPicked] = useState<string | null>(null);

  const branches = branchesQuery.data?.branches ?? [];
  const cart = cartState.status === "ready" ? cartState.cart : null;
  const cartBranch = branches.find((b) => b.id === cart?.branchId) ?? null;
  const selected = branches.find((b) => b.id === (picked ?? cartBranch?.id)) ?? null;
  const count = cartCount(cart);

  return (
    <>
      <section className="flex flex-col gap-2">
        <h1 className="page-title">{content.title}</h1>
        <p>{content.intro}</p>
      </section>

      <HowItWorks cutoff={branches.length ? sharedCutoff(branches) : null} />

      <section aria-labelledby="branch-title" className="flex flex-col gap-4">
        <h2 id="branch-title" className="section-title">
          {content.branchTitle}
        </h2>
        {count > 0 && <Notice>{content.cartNotice(cartContent.itemCount(count))}</Notice>}
        {branchesQuery.isError ? (
          <LoadErrorNotice
            retryLabel={content.retry}
            onRetry={() => void branchesQuery.refetch()}
            retrying={branchesQuery.isFetching}
          >
            {content.loadError}
          </LoadErrorNotice>
        ) : branchesQuery.isPending ? (
          <LoadingMessage>{content.loading}</LoadingMessage>
        ) : (
          <ChoiceGroup
            label={content.branchQuestion}
            options={branches.map(branchOption)}
            value={selected?.id ?? null}
            onChange={setPicked}
            name="branch"
          />
        )}
        {cartBranch && (
          <ButtonLink
            href={routes.menu(cartBranch.id, cart?.pickupDate)}
            icon="left"
            className="self-start"
          >
            {content.back(cartBranch.name)}
          </ButtonLink>
        )}
      </section>

      <BottomBar>
        {selected ? (
          <ButtonLink href={routes.menu(selected.id, cart?.pickupDate)} variant="primary" block>
            {content.go(selected.name)}
          </ButtonLink>
        ) : (
          <Button variant="primary" block disabled>
            {content.chooseFirst}
          </Button>
        )}
      </BottomBar>
    </>
  );
}
