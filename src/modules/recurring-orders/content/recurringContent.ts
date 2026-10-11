import type { UnavailableReason } from "@/shared/lib/api/apiError";

// Recurring orders: C10 to C12, from design/customer/AccountArea.dc.html
// (the Rec*.dc.html states) unless marked undesigned.

export const recurringContent = {
  /**
   * The note saved on a generated order (spec 8, AC-R9) and shown to staff
   * (A2/A3) and the customer (C9). Stored text, in the designs' wording:
   * "Sourdough rye loaf ×4 skipped: sold out".
   */
  generationNote: {
    reason: {
      sold_out: "sold out",
      not_available: "not on the menu",
    } satisfies Record<UnavailableReason, string>,
    /** One dropped item. */
    line: (name: string, quantity: number, reason: string) => `${name} ×${quantity} skipped: ${reason}`,
    /** Between dropped items (undesigned: the designs only show one). */
    separator: "; ",
  },

  /** Shared wording across C9 to C12. */
  common: {
    /** "Today, Sun 11 Oct" (AccountArea.dc.html dayLabel). */
    today: (day: string) => `Today, ${day}`,
    line: (quantity: number, name: string) => `${quantity} × ${name}`,
    itemCount: (count: number) => (count === 1 ? "1 item" : `${count} items`),
    /** Undesigned: an item that's left the branch's menu (AC-P2). */
    offMenu: (branch: string) => `Not on the menu at ${branch} right now. We'll leave it out of each order until it's back.`,
    /** Undesigned. */
    loading: "Loading your recurring orders…",
    loadingOne: "Loading this recurring order…",
    loadError: "We couldn't load your recurring orders. Check your connection and try again.",
    loadErrorOne: "We couldn't load this recurring order. Check your connection and try again.",
    retry: "Try again",
  },

  /** C9's Recurring orders section (AccountArea.dc.html, MyAccountNew.dc.html). */
  account: {
    title: "Recurring orders",
    count: (count: number) => (count === 1 ? "1 recurring order" : `${count} recurring orders`),
    summary: (count: string, next: string | null) => (next ? `${count}. Next pickup ${next}.` : `${count}.`),
    empty: "Get the same order on the days you choose, made the day before.",
    manage: "Manage recurring orders",
    setUp: "Set up a recurring order",
  },

  /** C1's block (Home.dc.html). */
  promo: {
    title: "For cafes and regulars",
    body: (cutoff: string | null) =>
      `Set up a recurring order and we'll make the same bakes on the days you choose. You can skip a day, pause or change it any time before ${cutoff ?? "the cutoff"} the day before.`,
    account: "You'll need an account for this, so you can manage it later.",
    action: "Set up a recurring order",
  },

  /** C10 (RecList.dc.html, RecListEnded.dc.html). */
  list: {
    metadataTitle: "Recurring orders · Millstone",
    back: "My account",
    title: "Recurring orders",
    intro: (cutoff: string | null) =>
      `The same order on the days you choose. We make each one at ${cutoff ?? "the branch's cutoff"} the day before, and you pay at pickup.`,
    emptyTitle: "No recurring orders yet",
    emptyBody: "Handy if you run a cafe or need the same bread every week.",
    open: "View and change",
    openLabel: (branch: string) => `View and change the ${branch} recurring order`,
    setUp: "Set up a recurring order",
    next: {
      ended: "Ended. No more orders.",
      pausedMade: (day: string, orderNumber: string) => `Paused. ${day}’s order (${orderNumber}) still stands.`,
      paused: "Paused. No new orders until you resume.",
      next: (day: string) => `Next pickup ${day}`,
      none: "No pickups coming up",
      lastPickup: (day: string) => ` · last pickup ${day}`,
    },
  },

  /** C11 (RecFormNew, RecFormErrors, RecFormEdit). */
  form: {
    metadataTitleNew: "Set up a recurring order · Millstone",
    metadataTitleEdit: "Change recurring order · Millstone",
    titleNew: "Set up a recurring order",
    titleEdit: "Change recurring order",
    introNew: (cutoff: string) =>
      `Choose the branch, the days and what you need. We make each order at ${cutoff} the day before, and you pay at pickup.`,
    introEdit: (from: string | null) =>
      `Changes apply from ${from ?? "your next pickup day"}. Orders we’ve already made won’t change.`,
    backNew: "Recurring orders",
    backEdit: "Recurring order",
    branchTitle: "Branch",
    branchQuestion: "Which Millstone will you pick up from?",
    branchLocked: "The branch can't be changed. To order from another branch, end this recurring order and set up a new one there.",
    daysTitle: "Pickup days",
    daysLabel: "Which days?",
    daysHint: (cutoff: string) => `Choose one or more. We make each order at ${cutoff} the day before.`,
    itemsTitle: "What you need each time",
    itemsNote: "Each order is charged at that day's prices.",
    noBranch: "Choose a branch first to see what it makes.",
    eachToday: (price: string) => `${price} each today`,
    /** Undesigned. */
    itemsLoading: "Loading what this branch makes…",
    itemsLoadError: "We couldn't load what this branch makes. Check your connection and try again.",
    datesTitle: "Start and end",
    startsOn: "Starts on",
    startNote: (cutoff: string) =>
      `Order by ${cutoff} for next-day pickup. Your first order is on the first chosen day from here.`,
    started: "Started",
    setEnd: "Set an end date",
    yes: "Yes",
    no: "No",
    lastPickup: "Last pickup",
    notes: "Notes for the bakery",
    notesHint: "Like “Back door, before 7am”.",
    noDays: "no days chosen",
    summary: (items: string, days: string, branch: string | null) =>
      branch ? `${items} · ${days} · ${branch}` : `${items} · ${days}`,
    fixCount: (count: number) => (count === 1 ? "Fix the 1 thing marked above." : `Fix the ${count} things marked above.`),
    saveNew: "Start recurring order",
    saveEdit: "Save changes",
    /** Undesigned. */
    savingNew: "Starting…",
    savingEdit: "Saving…",
  },

  /** C12 (RecDetail, RecDetailPaused, RecDetailEnd, RecDetailEnded). */
  detail: {
    metadataTitle: "Recurring order · Millstone",
    back: "Recurring orders",
    title: (branch: string, days: string) => `${branch}, ${days}`,
    pausedTitle: "Paused",
    pausedBody: "We won't make any new orders until you resume. Orders we've already made still stand.",
    resume: "Resume",
    endedTitle: (day: string) => `Ended after ${day}`,
    /** Undesigned: "Stop now" before the first pickup sets the end to the day before the start. */
    endedBeforeStart: "Ended before its first pickup",
    endedBody: (branch: string) =>
      `Orders we'd already made still stand. To order from ${branch} again, set up a new recurring order.`,
    upcomingTitle: "Upcoming pickups",
    upcomingNote: (cutoff: string) => `You can skip a day, or bring it back, until ${cutoff} the day before.`,
    made: (orderNumber: string, branch: string) => `Order ${orderNumber} is made. To change it, call ${branch} on `,
    /** Undesigned: the cutoff has passed and the order is about to be made. */
    closing: (closedAt: string, branch: string) => `Ordering for this day closed at ${closedAt}. To change it, call ${branch} on `,
    callAfter: ".",
    skipped: (until: string) => `Skipped. Undo until ${until}.`,
    open: (until: string) => `Skip or change until ${until}.`,
    skip: "Skip",
    skipLabel: (day: string) => `Skip ${day}`,
    undo: "Undo",
    undoLabel: (day: string) => `Undo skip for ${day}`,
    noUpcoming: {
      ended: "No more pickups.",
      paused: "No new pickups while paused.",
      none: "No pickups in the next few weeks.",
    },
    eachTitle: "Each order",
    pickupFrom: "Pickup from",
    pickupFromValue: (branch: string, address: string) => `${branch}, ${address}`,
    days: "Days",
    started: "Started",
    ends: "Ends",
    endsAfter: (day: string) => `After ${day}`,
    noEnd: "No end date",
    notes: "Notes for the bakery",
    payAtPickup: "Pay at pickup",
    pricesNote: "Charged at that day's prices.",
    edit: "Change items or days",
    pause: "Pause",
    end: "End recurring order",
    /** Undesigned. */
    pausing: "Pausing…",
    resuming: "Resuming…",
    flash: {
      created: (first: string | null) => `Your recurring order is set up.${first ? ` First pickup ${first}.` : ""}`,
      saved: (from: string | null) =>
        `Changes saved. They apply from ${from ?? "your next pickup"}. Orders we’ve already made won’t change.`,
      paused: "Paused. We won’t make any new orders until you resume.",
      resumed: (next: string | null) => `Resumed.${next ? ` Your next new order is for ${next}.` : ""}`,
      ended: "Ended. Orders we’d already made still stand.",
      endsAfter: (day: string) => `This recurring order will end after ${day}.`,
    },
  },

  /** C12's end sheet (RecDetailEnd.dc.html). */
  end: {
    title: "End this recurring order?",
    body: "No more orders will be made after the day you choose. Orders we've already made still stand.",
    question: "When should it stop?",
    now: { label: "Stop now", hint: "No more orders after the ones we’ve already made." },
    after: { label: "After a pickup day", hint: "Keep going until a day you choose, then stop." },
    lastPickup: "Last pickup",
    lastPickupNote: "Only your pickup days can be chosen.",
    confirmNow: "End it now",
    confirmAfter: (day: string) => `End after ${day}`,
    chooseDay: "Choose a last pickup day",
    keep: "Keep it going",
    /** Undesigned. */
    ending: "Ending…",
  },

  /** The page's 404 (not-found.tsx). Undesigned. */
  notFound: {
    title: "Recurring order not found",
    body: "We couldn't find that recurring order in your account.",
    back: "Back to recurring orders",
  },

  /** Undesigned: what the API's refusals say on C11 and C12. */
  problems: {
    changed: "This recurring order changed in another window, so we've loaded the latest version. Check it and try again.",
    dateLocked: (day: string | null, branch: string) =>
      `Ordering for ${day ?? "that day"} has closed, so it can't change here. Call ${branch} on `,
    ended: "This recurring order has ended, so it can't be changed.",
    paused: "Resume this recurring order to skip a day.",
    closedDay: (branch: string, days: string) => `${branch} is closed on ${days}. Take that day off to save.`,
    itemsUnavailable: (names: string, branch: string) => `${names} isn't on the menu at ${branch} now. Remove it to save.`,
    startTooEarly: (day: string) => `The earliest start is now ${day}. Choose that day or later.`,
    notScheduled: "Choose one of your pickup days.",
    limitReached: (max: number) =>
      `You already have ${max} recurring orders, the most one account can have. End one to set up another.`,
    rateLimited: "Too many changes from this network. Wait 15 minutes and try again.",
    tryAgain: "We couldn't save that just now. Try again.",
    failed: "We couldn't save that just now. Check your connection and try again.",
  },

  /** C11 field errors (RecFormErrors.dc.html). */
  errors: {
    branch: "Choose a branch.",
    days: "Choose at least one day.",
    items: "Add at least one item.",
    endsOn: "Choose the last pickup day.",
    /** Undesigned: past the length limit. */
    notesTooLong: "Keep notes to 500 characters or fewer.",
    /** Undesigned: more lines than the form allows. */
    tooManyItems: "That's more items than one recurring order can hold. Remove a few.",
    /** Undesigned: an end before the start. */
    endBeforeStart: "Choose a last pickup day on or after the first.",
  },
} as const;
