import type {
  AvailabilityState,
  Cents,
  IsoDate,
  OrderId,
  ProductId,
  VisibleOrderStatus,
} from "@/shared/domain";

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
  /** No session, or it has expired (401). */
  | "unauthenticated"
  /** Signed in, but not allowed: not staff, or an owner-only route (403). */
  | "forbidden"
  /** Staff sign-in: the email and password don't match; never says which (401). */
  | "invalid_credentials"
  /** Staff sign-in: too many failed tries for this email; locked for a while (429). */
  | "too_many_attempts"
  /** Orders and staff sign-in: too many requests from this address; `Retry-After` says when to try again (429). */
  | "rate_limited"
  /**
   * Admin: the order isn't in the state the staff member saw, because it was
   * changed on another screen (409). Carries the order's number and status now.
   */
  | "order_changed"
  /** Admin: the order's state never allows this, e.g. Ready on a collected order (409). */
  | "not_allowed"
  /** Admin: the Undo window after Collected has passed; the order stays collected (409). */
  | "undo_expired"
  /** Admin: Collected on an unpaid order without "Yes, paid" (409). */
  | "payment_unconfirmed"
  /**
   * Admin (A4): the product's row at this branch isn't what the staff member
   * saw, because it was changed on another screen (409). Carries the row now.
   */
  | "availability_changed"
  /**
   * Admin (A5): the product was saved on another screen since the form read
   * it (409). Carries the version now; nothing is written.
   */
  | "product_changed"
  /** Admin (A5): a photo over the size limit, refused before it's read in full (413). */
  | "file_too_large"
  /** Admin (A5): the file's bytes aren't a JPEG, PNG or WebP, whatever its name says (415). */
  | "unsupported_image"
  /** Admin (A5): a photo smaller than the minimum size (422). */
  | "image_too_small"
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
    /** On the admin's order action errors: which order, and its status now. */
    orderNumber?: string;
    currentStatus?: VisibleOrderStatus;
    /** On availability_changed: the product's row at the branch now. */
    currentAvailability?: AvailabilityState;
    /** On product_changed: the product's version now. */
    currentVersion?: number;
  };
}

export type ApiErrorDetails = Omit<ApiErrorBody["error"], "code" | "message">;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
    readonly details: ApiErrorDetails = {},
    /** Extra response headers, e.g. Retry-After on a 429. */
    readonly headers: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }

  toBody(): ApiErrorBody {
    return { error: { code: this.code, message: this.message, ...this.details } };
  }
}
