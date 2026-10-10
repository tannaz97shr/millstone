// C8 (sign in, create an account), C9 (My account), the account order page
// and C7's "Save your details". Copy is from design/customer/Account.dc.html,
// AccountArea.dc.html, Home.dc.html and Confirmation.dc.html unless marked
// undesigned.

/** Where C8 was opened from: sets its back link, intro and "Continue as a guest". */
export type SignInContext = "checkout" | "menu" | "home";

export const accountContent = {
  /** C1/C2 header (Home.dc.html, Menu.dc.html). */
  header: {
    signIn: "Sign in",
    myAccount: "My account",
  },

  back: {
    checkout: "Checkout",
    menu: "Menu",
    home: "Home",
  } satisfies Record<SignInContext, string>,

  signIn: {
    metadataTitle: "Sign in · Millstone",
    title: "Sign in",
    intro: {
      checkout: "Sign in and we'll fill in your details for this order.",
      menu: "Sign in to check out faster and see your past orders.",
      home: "Sign in to check out faster and see your past orders.",
    } satisfies Record<SignInContext, string>,
    email: "Email",
    password: "Password",
    forgot: "Forgot your password?",
    submit: "Sign in",
    /** Undesigned. */
    submitting: "Signing in…",
    /** AC-U2. The design adds "or reset your password"; there's no reset without email yet. */
    invalid: "That email and password don't match. Check them and try again.",
    /** Undesigned: the per-email lock, as on A1. */
    locked: "Too many tries. Wait 15 minutes and try again.",
    /** Undesigned: the per-address limit. */
    rateLimited: "Too many sign-in tries from this network. Wait 15 minutes and try again.",
    /** Undesigned. */
    failed: "We couldn't sign you in just now. Check your connection and try again.",
    newTitle: "New to Millstone?",
    createAccount: "Create an account",
    /**
     * Undesigned. The design says guest orders "come with you"; they don't
     * until emails can be checked (specs/known-issues.md, Customer accounts).
     */
    newNote: "Orders you place while signed in show up in My account.",
    continueAsGuest: "Continue as a guest",
  },

  signUp: {
    metadataTitle: "Create an account · Millstone",
    title: "Create an account",
    /** The design adds "and see your past orders"; only orders placed signed in show (undesigned change). */
    intro: "Save your details for next time and see your orders.",
    name: "Name",
    phone: { label: "Mobile number", hint: "So we can call if something changes with an order." },
    /** Undesigned: replaces "Ordered as a guest before? Use the same email and those orders come with you." */
    email: { label: "Email", hint: "You'll sign in with this." },
    password: { label: "Password", hint: "At least 8 characters." },
    submit: "Create account",
    /** Undesigned. */
    submitting: "Creating your account…",
    haveAccount: "Already have an account?",
    signIn: "Sign in",
    /** Undesigned: the email already has an account (409 email_taken). */
    emailTaken: "There's already an account for this email.",
    emailTakenAction: "Sign in instead",
    /** Undesigned: the per-address limit. */
    rateLimited: "Too many new accounts from this network. Try again in an hour.",
    /** Undesigned. */
    failed: "We couldn't create your account just now. Check your connection and try again.",
  },

  /** Undesigned: there's no email, so no reset link (ResetRequest.dc.html waits for it). */
  forgot: {
    metadataTitle: "Forgot your password · Millstone",
    title: "Forgot your password?",
    body: "We can't reset passwords online yet. You can still order as a guest with the same email, or create an account with a different one.",
    backToSignIn: "Back to sign in",
    startOrder: "Start an order",
  },

  /** C9, from AccountArea.dc.html (without the Recurring orders section, which comes next step). */
  myAccount: {
    metadataTitle: "My account · Millstone",
    title: "My account",
    /** Undesigned. */
    loading: "Loading your account…",
    signedInAs: (email: string) => `Signed in as ${email}`,
    details: {
      title: "Your details",
      edit: "Edit",
      editLabel: "Edit your details",
      name: "Name",
      phone: "Mobile number",
      email: "Email",
      note: "New orders will use these. Past orders keep the details they were placed with.",
      save: "Save details",
      /** Undesigned. */
      saving: "Saving…",
      cancel: "Cancel",
      saved: "Details saved. New orders will use them.",
      /** Undesigned: another account has that email (409 email_taken). */
      emailTaken: "There's already an account for this email. Use a different one.",
      /** Undesigned. */
      rateLimited: "Too many changes from this network. Wait 15 minutes and try again.",
      /** Undesigned. */
      failed: "We couldn't save your details just now. Check your connection and try again.",
      dismiss: "OK",
    },
    orders: {
      title: "Your orders",
      emptyTitle: "No orders yet",
      emptyBody: "When you place an order, it'll show up here with its order number.",
      /** Undesigned: guest orders aren't carried over without an email check. */
      guestNote: "Orders you placed as a guest before signing in don't show here.",
      startOrder: "Start an order",
      pickup: (day: string, branch: string) => `Pickup ${day} at ${branch}`,
      line: (quantity: number, name: string) => `${quantity} × ${name}`,
      noItems: "No items",
      noteHelp: (branch: string) => `We left this out of your order. Call ${branch} on `,
      noteHelpAfter: " if you'd like something instead.",
      call: (branch: string) => `To change or cancel, call ${branch} on `,
      callAfter: ".",
      /** Undesigned: each card links to the account order page. */
      details: "Order details",
      detailsLabel: (orderNumber: string) => `Order details for ${orderNumber}`,
      /** Undesigned: past ACCOUNT_ORDERS_LIMIT. */
      limited: "Showing your latest 50 orders.",
      /** Undesigned. */
      loading: "Loading your orders…",
      loadError: "We couldn't load your orders. Check your connection and try again.",
      retry: "Try again",
    },
    signOut: "Sign out",
    /** Undesigned. */
    signingOut: "Signing out…",
    signOutFailed: "We couldn't sign you out just now. Check your connection and try again.",
  },

  /** Undesigned page: one of the account's orders (C9 has only the cards). */
  order: {
    back: "My account",
    title: (orderNumber: string) => `Order ${orderNumber}`,
    pickupTitle: "Pickup",
    branchName: (branch: string) => `Millstone ${branch}`,
    readyFrom: (time: string) => `Ready from ${time}`,
    total: "Total",
    paid: { label: "Paid", note: "Paid online. Nothing to pay at the counter." },
    unpaid: { label: "Pay at pickup", note: (total: string) => `Pay ${total} at the counter when you collect.` },
    refunded: { label: "Refunded", note: "Refunded to your card." },
    cancelledUnpaid: "Nothing to pay: this order was cancelled.",
    notesTitle: "Notes for the bakery",
    contactTitle: "Details for this order",
    changeTitle: "Need to change or cancel?",
    call: (branch: string) => `Call ${branch} on `,
    callAfter: ". Orders can't be changed online.",
    loading: "Loading your order…",
    loadError: "We couldn't load this order. Check your connection and try again.",
    retry: "Try again",
    notFound: "We couldn't find that order in your account.",
    backToAccount: "Back to My account",
  },

  /** C7's offer to a guest (AC-C10), from Confirmation.dc.html and ConfAccountCreated.dc.html. */
  saveDetails: {
    title: "Save your details for next time",
    body: "Set a password and your details will fill in by themselves next time. This order goes into your account too.",
    password: "Password",
    passwordHint: (email: string) => `At least 8 characters. Your account email is ${email}.`,
    submit: "Create account",
    /** Undesigned. */
    submitting: "Creating your account…",
    createdTitle: "Your account is set up",
    created: (email: string) => `You're signed in as ${email}, and this order is in My account.`,
    seeOrders: "See your orders in My account",
    /** Undesigned: 409 account_exists. */
    accountExists: "There's already an account for this email. Sign in to see your orders.",
    accountExistsAction: "Sign in",
    /** Undesigned: 409 already_linked / not_eligible / window_closed. */
    unavailable: "This order can't be saved to an account any more.",
    /** Undesigned. */
    rateLimited: "Too many new accounts from this network. Try again in an hour.",
    failed: "We couldn't create your account just now. Check your connection and try again.",
  },

  errors: {
    name: "Enter your name.",
    nameTooLong: "Enter a name of 100 characters or fewer.",
    phone: "Enter a 10-digit mobile number, like 0491 570 156.",
    email: "Enter your email address, like name@example.com.",
    passwordRequired: "Enter your password.",
    passwordTooShort: "Use at least 8 characters.",
    /** Undesigned: past the 200-character cap. */
    passwordTooLong: "Use 200 characters or fewer.",
  },
} as const;
