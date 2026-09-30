import type * as React from 'react';

/** Put data-context="admin" on the admin root to switch every component to counter sizes (64px controls, 20px text). */
export type Context = 'customer' | 'admin';
export type IconName = 'check' | 'cross' | 'ring' | 'repeat' | 'note' | 'alert' | 'plus' | 'minus' | 'left' | 'right' | 'refund';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger' | 'ready';
  icon?: IconName;
  /** Full width. */
  block?: boolean;
  /** Admin only: 72px Ready / Collected button on an order row. */
  counter?: boolean;
}
export declare function Button(props: ButtonProps): React.ReactElement;

export interface ProductCardProps {
  name: string;
  price: number | string;
  description?: string;
  image?: string;
  imageAlt?: string;
  quantity?: number;
  onQuantityChange?: (n: number) => void;
  onAdd?: () => void;
  /** true, or the sentence to show, e.g. "Sold out for Tue 30 Sep". */
  soldOut?: boolean | string;
  layout?: 'card' | 'row';
  className?: string;
}
export declare function ProductCard(props: ProductCardProps): React.ReactElement;

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  optional?: boolean;
  multiline?: boolean;
}
export declare function TextField(props: TextFieldProps): React.ReactElement;

export interface QuantityStepperProps { value?: number; defaultValue?: number; onChange?: (n: number) => void; min?: number; max?: number; label?: string; className?: string }
export declare function QuantityStepper(props: QuantityStepperProps): React.ReactElement;

export interface ChoiceOption { value: string; label: React.ReactNode; hint?: React.ReactNode }
export interface ChoiceGroupProps { label?: React.ReactNode; options: ChoiceOption[]; value?: string; defaultValue?: string; onChange?: (v: string) => void; name?: string; className?: string }
export declare function ChoiceGroup(props: ChoiceGroupProps): React.ReactElement;

export interface DatePickerProps {
  /** ISO YYYY-MM-DD. */
  value?: string | null;
  defaultValue?: string;
  onChange?: (iso: string) => void;
  /** First orderable date (apply the branch cutoff before passing it). */
  earliest?: string;
  latest?: string;
  unavailable?: string[];
  /** 0 = Sunday. */
  closedWeekdays?: number[];
  layout?: 'strip' | 'month';
  start?: string;
  days?: number;
  today?: string;
  label?: React.ReactNode;
  note?: React.ReactNode;
  className?: string;
}
export declare function DatePicker(props: DatePickerProps): React.ReactElement;

export interface ToggleProps { label?: React.ReactNode; checked?: boolean; defaultChecked?: boolean; onChange?: (on: boolean) => void; onText?: string; offText?: string; disabled?: boolean; className?: string }
export declare function Toggle(props: ToggleProps): React.ReactElement;

export interface StatusBadgeProps { status: 'placed' | 'ready' | 'collected' | 'cancelled'; children?: React.ReactNode; className?: string }
export declare function StatusBadge(props: StatusBadgeProps): React.ReactElement;

export interface PaymentLabelProps { status: 'unpaid' | 'paid' | 'refunded'; children?: React.ReactNode; className?: string }
export declare function PaymentLabel(props: PaymentLabelProps): React.ReactElement;

export interface RecurringLabelProps { children?: React.ReactNode; title?: string; className?: string }
export declare function RecurringLabel(props: RecurringLabelProps): React.ReactElement;

export interface OrderItemSummary { name: string; quantity: number }
export interface OrderRowProps {
  /** e.g. "MS-1042" — shown in admin-order-number, read aloud at the counter. */
  orderNumber: string;
  status: 'placed' | 'ready' | 'collected' | 'cancelled';
  /** Leave out (or null) on a cancelled pay-at-pickup order: no money changed hands, so no label. */
  payment?: 'unpaid' | 'paid' | 'refunded' | null;
  customerName: string;
  phone?: string;
  /** A preformatted summary, or items to join as "2 × Rye loaf, 6 × Plain bagel". */
  items?: string | OrderItemSummary[];
  total?: number | string;
  /** Show the Recurring label (recurring_order_id is set). */
  recurring?: boolean;
  /** Customer notes. */
  notes?: string;
  /** generation_note — highlights the whole row. */
  generationNote?: string;
  selected?: boolean;
  /** Placed → ready. */
  onReady?: () => void;
  /** Placed or ready → collected. Confirm payment first when payment is 'unpaid'. */
  onCollected?: () => void;
  /** Opens the order detail side panel. */
  onOpen?: () => void;
  className?: string;
}
export declare function OrderRow(props: OrderRowProps): React.ReactElement;

export interface RecurringStatusTagProps {
  /** active = generating orders; paused = no new orders until resumed; ended = ends_on has passed. */
  status: 'active' | 'paused' | 'ended';
  children?: React.ReactNode;
  className?: string;
}
export declare function RecurringStatusTag(props: RecurringStatusTagProps): React.ReactElement;

export interface WeekdayPickerProps {
  /** Selected weekdays, 0 = Sunday … 6 = Saturday (the same numbers as DatePicker's closedWeekdays). */
  value?: number[];
  defaultValue?: number[];
  onChange?: (days: number[]) => void;
  /** Days the branch is closed: shown dashed with the closedText word, can't be picked. */
  closedWeekdays?: number[];
  /** Tile order. Default Monday first: [1, 2, 3, 4, 5, 6, 0]. */
  order?: number[];
  /** Word under a closed day. Default "Closed". */
  closedText?: string;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}
export declare function WeekdayPicker(props: WeekdayPickerProps): React.ReactElement;

export declare function Icon(props: { name: IconName }): React.ReactElement;

declare global {
  interface Window {
    Millstone: {
      Button: typeof Button; ProductCard: typeof ProductCard; TextField: typeof TextField; QuantityStepper: typeof QuantityStepper;
      ChoiceGroup: typeof ChoiceGroup; DatePicker: typeof DatePicker; Toggle: typeof Toggle;
      StatusBadge: typeof StatusBadge; PaymentLabel: typeof PaymentLabel; RecurringLabel: typeof RecurringLabel; OrderRow: typeof OrderRow; RecurringStatusTag: typeof RecurringStatusTag; WeekdayPicker: typeof WeekdayPicker; Icon: typeof Icon;
    };
  }
}
