"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useWatch } from "react-hook-form";
import { BackLink } from "@/modules/account/components/BackLink";
import { useBranchesQuery } from "@/modules/branches/hooks/useBranchesQuery";
import type { BranchSummary } from "@/modules/branches/types/branchSummary";
import { useBranchMenuQuery } from "@/modules/menu/hooks/useBranchMenuQuery";
import { Button } from "@/shared/components/atoms/Button/Button";
import { FieldError } from "@/shared/components/atoms/Field/FieldError";
import { Toggle } from "@/shared/components/atoms/Toggle/Toggle";
import { ChoiceGroup } from "@/shared/components/molecules/ChoiceGroup/ChoiceGroup";
import { DatePicker } from "@/shared/components/molecules/DatePicker/DatePicker";
import { LoadErrorNotice, LoadingMessage } from "@/shared/components/molecules/LoadState/LoadState";
import { Notice } from "@/shared/components/molecules/Notice/Notice";
import { TextField } from "@/shared/components/molecules/TextField/TextField";
import { WeekdayPicker } from "@/shared/components/molecules/WeekdayPicker/WeekdayPicker";
import { BottomBar } from "@/shared/components/organisms/BottomBar/BottomBar";
import type { IsoDate, Weekday } from "@/shared/domain";
import { CONTACT_LIMITS } from "@/modules/checkout/lib/checkoutSchema";
import { toApiFailure } from "@/shared/lib/http/apiClient";
import { routes } from "@/shared/routes";
import {
  addDays,
  formatPickupDay,
  formatTimeOfDay,
  PICKUP_STRIP_DAYS,
  RECURRING_HORIZON_DAYS,
  weekdayOf,
} from "@/shared/utils/pickup-dates";
import { recurringContent } from "../content/recurringContent";
import { sectionIdOf, useRecurringForm } from "../hooks/useRecurringForm";
import { useRecurringOrder } from "../hooks/useRecurringOrders";
import {
  blankFormValues,
  formSummary,
  formValuesFromDetail,
  keepListed,
  type RecurringFormValues,
} from "../lib/recurringForm";
import type { RecurringOrderDetail } from "../types/recurringOrderView";
import { RecurringItemRows, type FormItem } from "./RecurringItemRows";
import { RecurringNotFound } from "./RecurringNotFound";
import { RecurringProblemNotice } from "./RecurringProblemNotice";

const content = recurringContent.form;

/** C11 new (RecFormNew, RecFormErrors). */
export function RecurringNewScreen() {
  const branchesQuery = useBranchesQuery();
  const branches = branchesQuery.data?.branches;
  if (branches?.length) return <RecurringForm branches={branches} detail={null} />;
  return (
    <FormLoadState
      backHref={routes.account.recurring.list}
      backLabel={content.backNew}
      failed={branchesQuery.isError}
      retrying={branchesQuery.isFetching}
      onRetry={() => void branchesQuery.refetch()}
    />
  );
}

/** C11 edit (RecFormEdit): the branch is locked (AC-R4). */
export function RecurringEditScreen({ recurringOrderId }: { recurringOrderId: string }) {
  const branchesQuery = useBranchesQuery();
  const detailQuery = useRecurringOrder(recurringOrderId);
  const branches = branchesQuery.data?.branches;
  const detail = detailQuery.data;
  const backHref = routes.account.recurring.detail(recurringOrderId);

  if (detailQuery.isError && toApiFailure(detailQuery.error).status === 404) return <RecurringNotFound />;
  if (detail?.status === "ended") {
    return (
      <div className="flex flex-col gap-6">
        <BackLink href={backHref}>{content.backEdit}</BackLink>
        <h1 className="page-title">{content.titleEdit}</h1>
        <Notice>{recurringContent.problems.ended}</Notice>
      </div>
    );
  }
  if (detail && branches?.length) return <RecurringForm branches={branches} detail={detail} />;
  return (
    <FormLoadState
      backHref={backHref}
      backLabel={content.backEdit}
      failed={detailQuery.isError || branchesQuery.isError}
      retrying={detailQuery.isFetching || branchesQuery.isFetching}
      onRetry={() => {
        void detailQuery.refetch();
        void branchesQuery.refetch();
      }}
    />
  );
}

function FormLoadState(props: {
  backHref: string;
  backLabel: string;
  failed: boolean;
  retrying: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <BackLink href={props.backHref}>{props.backLabel}</BackLink>
      {props.failed ? (
        <LoadErrorNotice retryLabel={recurringContent.common.retry} onRetry={props.onRetry} retrying={props.retrying}>
          {recurringContent.common.loadErrorOne}
        </LoadErrorNotice>
      ) : (
        <LoadingMessage>{recurringContent.common.loadingOne}</LoadingMessage>
      )}
    </div>
  );
}

/** The earliest first pickup any branch takes now (they share a cutoff, so usually all the same). */
function earliestAcross(branches: readonly BranchSummary[]): IsoDate {
  return branches.map((branch) => branch.pickup.earliest).sort()[0];
}

/** Dates from `from` (within the horizon) that aren't one of the chosen days: struck through in the end picker. */
function notChosenDays(from: IsoDate, days: readonly number[]): IsoDate[] {
  return Array.from({ length: RECURRING_HORIZON_DAYS }, (_, i) => addDays(from, i)).filter(
    (date) => !days.includes(weekdayOf(date)),
  );
}

function RecurringForm({ branches, detail }: { branches: BranchSummary[]; detail: RecurringOrderDetail | null }) {
  // Read once: a reload after a version clash resets the form itself.
  const [defaultValues] = useState<RecurringFormValues>(() =>
    detail ? formValuesFromDetail(detail) : blankFormValues(earliestAcross(branches)),
  );
  const { form, submit, problem, earliestOverride, pending } = useRecurringForm({ defaultValues, detail });
  const { control, register, setValue, formState } = form;
  const [branchId, daysOfWeek, quantities, startsOn, hasEnd] = useWatch({
    control,
    name: ["branchId", "daysOfWeek", "quantities", "startsOn", "hasEnd"],
  });

  const branch = branches.find((b) => b.id === branchId) ?? null;
  const menuQuery = useBranchMenuQuery(branch?.id ?? null, branch?.pickup.earliest ?? null);
  const menu = menuQuery.data?.branchId === branch?.id ? menuQuery.data : undefined;

  // What the form lists: the branch's menu now, then (editing) items already
  // in the order that have left it, which may stay but can't be added (AC-P2).
  const items = useMemo<FormItem[]>(() => {
    const onMenu: FormItem[] = (menu?.categories ?? []).flatMap((category) =>
      category.products.map((product) => ({ productId: product.id, name: product.name, priceCents: product.priceCents })),
    );
    const listed = new Set(onMenu.map((item) => item.productId as string));
    const kept: FormItem[] = (detail?.items ?? [])
      .filter((item) => !listed.has(item.productId))
      .map((item) => ({ productId: item.productId, name: item.name, priceCents: null, keptQuantity: item.quantity }));
    return [...onMenu, ...kept];
  }, [menu, detail]);
  const productOrder = useMemo(() => items.map((item) => item.productId as string), [items]);

  // A branch's menu has arrived: anything it doesn't make leaves the order (as designed).
  useEffect(() => {
    if (!menu) return;
    const kept = keepListed(form.getValues("quantities"), new Set(productOrder));
    if (Object.keys(kept).length !== Object.keys(form.getValues("quantities")).length) {
      setValue("quantities", kept, { shouldValidate: formState.isSubmitted });
    }
  }, [menu, productOrder, form, setValue, formState.isSubmitted]);

  const cutoff = formatTimeOfDay((branch ?? branches[0]).orderCutoffTime);
  const closedDays: Weekday[] = branch?.closedDays ?? [];
  const errorCount = formState.isSubmitted ? Object.keys(formState.errors).length : 0;
  const canChangeStart = !detail || !detail.started;
  const startEarliest = (earliestOverride ??
    detail?.earliestStart ??
    branch?.pickup.earliest ??
    defaultValues.startsOn) as IsoDate;
  const endFloor = (detail && detail.firstChangeable > startsOn ? detail.firstChangeable : startsOn) as IsoDate;
  const validateLive = { shouldValidate: formState.isSubmitted, shouldDirty: true };

  const backHref = detail ? routes.account.recurring.detail(detail.id) : routes.account.recurring.list;

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (!pending) void submit({ branch, productOrder });
      }}
      className="flex flex-col gap-6"
    >
      <BackLink href={backHref}>{detail ? content.backEdit : content.backNew}</BackLink>
      <div className="flex flex-col gap-2">
        <h1 className="page-title">{detail ? content.titleEdit : content.titleNew}</h1>
        <p>
          {detail
            ? content.introEdit(detail.firstNewPickup ? formatPickupDay(detail.firstNewPickup) : null)
            : content.introNew(cutoff)}
        </p>
      </div>
      <RecurringProblemNotice problem={problem} />

      <div inert={pending} className="flex flex-col gap-6">
        <section id={sectionIdOf("branchId")} aria-labelledby="recurring-form-branch" className="flex flex-col gap-3">
          <h2 id="recurring-form-branch" className="section-title">
            {content.branchTitle}
          </h2>
          {detail ? (
            <div className="flex flex-col gap-1 rounded-md bg-flour-sunk px-4 py-3">
              <span className="branch-name">{detail.branch.name}</span>
              <span className="caption text-ink-muted">{detail.branch.address}</span>
              <span className="caption">{content.branchLocked}</span>
            </div>
          ) : (
            <Controller
              control={control}
              name="branchId"
              render={({ field, fieldState }) => (
                <ChoiceGroup
                  label={content.branchQuestion}
                  name="recurring-branch"
                  value={field.value || null}
                  onChange={(value) => {
                    field.onChange(value);
                    const chosen = branches.find((b) => b.id === value);
                    if (chosen && form.getValues("startsOn") < chosen.pickup.earliest) {
                      setValue("startsOn", chosen.pickup.earliest);
                    }
                  }}
                  error={fieldState.error?.message}
                  options={branches.map((b) => ({
                    value: b.id,
                    label: <span className="branch-name">{b.name}</span>,
                    hint: b.address,
                  }))}
                />
              )}
            />
          )}
        </section>

        <section id={sectionIdOf("daysOfWeek")} aria-labelledby="recurring-form-days" className="flex flex-col gap-3">
          <h2 id="recurring-form-days" className="section-title">
            {content.daysTitle}
          </h2>
          <Controller
            control={control}
            name="daysOfWeek"
            render={({ field, fieldState }) => (
              <WeekdayPicker
                label={content.daysLabel}
                value={field.value as Weekday[]}
                onChange={field.onChange}
                closedWeekdays={closedDays}
                hint={content.daysHint(cutoff)}
                error={fieldState.error?.message}
              />
            )}
          />
        </section>

        <section id={sectionIdOf("quantities")} aria-labelledby="recurring-form-items" className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 id="recurring-form-items" className="section-title">
              {content.itemsTitle}
            </h2>
            <p className="caption text-ink-muted">{content.itemsNote}</p>
          </div>
          <FieldError id="recurring-form-items-error" error={(formState.errors.quantities as { message?: string } | undefined)?.message} />
          {!branch ? (
            <p className="rounded-md bg-flour-sunk p-4 text-ink-muted">{content.noBranch}</p>
          ) : menuQuery.isError && !menu ? (
            <LoadErrorNotice
              retryLabel={recurringContent.common.retry}
              onRetry={() => void menuQuery.refetch()}
              retrying={menuQuery.isFetching}
            >
              {content.itemsLoadError}
            </LoadErrorNotice>
          ) : !menu ? (
            <LoadingMessage>{content.itemsLoading}</LoadingMessage>
          ) : (
            <RecurringItemRows
              items={items}
              quantities={quantities}
              branchName={branch.name}
              onChange={(productId, quantity) =>
                setValue("quantities", { ...form.getValues("quantities"), [productId]: quantity }, validateLive)
              }
            />
          )}
        </section>

        <section aria-labelledby="recurring-form-dates" className="flex flex-col gap-4">
          <h2 id="recurring-form-dates" className="section-title">
            {content.datesTitle}
          </h2>
          {canChangeStart ? (
            <div id={sectionIdOf("startsOn")}>
              <Controller
                control={control}
                name="startsOn"
                render={({ field }) => (
                  <DatePicker
                    label={content.startsOn}
                    value={field.value as IsoDate}
                    onChange={field.onChange}
                    earliest={startEarliest}
                    start={startEarliest}
                    days={PICKUP_STRIP_DAYS}
                    closedWeekdays={closedDays}
                    note={content.startNote(cutoff)}
                  />
                )}
              />
            </div>
          ) : (
            <div className="flex flex-col">
              <span className="caption text-ink-muted">{content.started}</span>
              <span>{formatPickupDay(detail?.startsOn ?? (startsOn as IsoDate))}</span>
            </div>
          )}
          <Controller
            control={control}
            name="hasEnd"
            render={({ field }) => (
              <Toggle
                label={content.setEnd}
                checked={field.value}
                onChange={(on) => {
                  field.onChange(on);
                  if (!on) setValue("endsOn", null, validateLive);
                }}
                onText={content.yes}
                offText={content.no}
              />
            )}
          />
          {hasEnd && (
            <div id={sectionIdOf("endsOn")} className="flex flex-col gap-2">
              <Controller
                control={control}
                name="endsOn"
                render={({ field }) => (
                  <DatePicker
                    layout="month"
                    label={content.lastPickup}
                    value={(field.value as IsoDate | null) ?? null}
                    onChange={(date) => setValue("endsOn", date, validateLive)}
                    earliest={endFloor}
                    unavailable={notChosenDays(endFloor, daysOfWeek)}
                    closedWeekdays={closedDays}
                    today={detail?.today}
                  />
                )}
              />
              <FieldError id="recurring-form-end-error" error={formState.errors.endsOn?.message} />
            </div>
          )}
        </section>

        <div id={sectionIdOf("notes")}>
          <TextField
            label={content.notes}
            optional
            hint={content.notesHint}
            multiline
            rows={2}
            maxLength={CONTACT_LIMITS.notes}
            error={formState.errors.notes?.message}
            {...register("notes")}
          />
        </div>
      </div>

      <BottomBar>
        <div className="flex flex-col gap-2">
          {errorCount > 0 && (
            <p role="alert" className="caption font-bold text-brick">
              {content.fixCount(errorCount)}
            </p>
          )}
          <span className="caption">{formSummary({ daysOfWeek, quantities }, productOrder, branch?.name ?? null)}</span>
          <Button type="submit" variant="primary" block aria-disabled={pending || undefined}>
            {pending ? (detail ? content.savingEdit : content.savingNew) : detail ? content.saveEdit : content.saveNew}
          </Button>
        </div>
      </BottomBar>
    </form>
  );
}
