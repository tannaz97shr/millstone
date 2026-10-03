import type { Cents, IsoDate, OrderId, ProductId } from "@/shared/domain";

// The error shape every API route returns, shared by the route handlers and
// the browser's API client. Messages are for developers; screens show their
// own copy based on `code`.

export type ApiErrorCode =
  | "invalid_params"
  /** A request body that fails its schema (400); `fields` names them. */
  | "invalid_body"
  | "unknown_branch"
  | "closed_day"
  | "past_cutoff"
  | "out_of_range"
  /** Checkout: items that can't be sold for that branch and day (409). */
  | "items_unavailable"
  /** Checkout: the server's total differs from the one the customer saw (409). */
  | "price_changed"
  /** Checkout: a payment method that isn't offered (422). */
  | "payment_method_unavailable"
  /**
   * Checkout: this checkout key already placed a different order (409), e.g.
   * the response was lost and the cart was edited. Carries that order.
   */
  | "checkout_key_mismatch"
  | "not_found"
  /** Firestore didn't answer in time (503). */
  | "unavailable"
  | "server_error";

/** Why the server refused an item at checkout. */
export type UnavailableReason = "sold_out" | "not_available";

export interface UnavailableItem {
  productId: ProductId;
  /** The product's current name, else the ID when the product no longer exists. */
  name: string;
  reason: UnavailableReason;
}

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    /** On pickup-date errors: the earliest date that can be ordered. */
    earliest?: IsoDate;
    /** On invalid_body: the failing fields as dotted paths, e.g. "contact.phone". */
    fields?: string[];
    /** On items_unavailable. */
    items?: UnavailableItem[];
    /** On price_changed: the total the server would charge. */
    totalCents?: Cents;
    /** On checkout_key_mismatch: the order the key already placed. */
    existingOrder?: { orderId: OrderId; orderNumber: string };
  };
}

export type ApiErrorDetails = Omit<ApiErrorBody["error"], "code" | "message">;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
    readonly details: ApiErrorDetails = {},
  ) {
    super(message);
    this.name = "ApiError";
  }

  toBody(): ApiErrorBody {
    return { error: { code: this.code, message: this.message, ...this.details } };
  }
}
