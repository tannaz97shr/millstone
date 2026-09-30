// Copy for the /dev/components preview. Sample people and numbers are
// fictional (ACMA 0491 570 xxx mobiles, example.com emails).

export const devComponentsContent = {
  metadataTitle: "Components — Millstone",
  title: "Components",
  intro:
    "Every shared component in each variant and state, first in the customer context and then inside data-context=\"admin\".",
  valueLabel: "Value",
  frames: {
    customer: "Customer (default)",
    admin: 'Admin (data-context="admin")',
  },
  sections: {
    button: "Button",
    labels: "StatusBadge, PaymentLabel, RecurringLabel",
    textField: "TextField",
    quantityStepper: "QuantityStepper",
    toggle: "Toggle",
    choiceGroup: "ChoiceGroup",
    notice: "Notice",
  },
  captions: {
    variants: "Variants",
    withIcon: "With an icon",
    disabled: "Disabled",
    block: "Block (full width)",
    counter: "Counter (72px on the admin)",
    orderStatus: "Order status",
    payment: "Payment",
    paymentCustomer: "Payment, customer wording",
    recurring: "Recurring",
    controlled: "Controlled",
    uncontrolled: "Uncontrolled",
    atMin: "At the minimum",
    atOne: "At 1 (minus removes)",
    atMax: "At the maximum",
    withError: "With an error",
    nothingChosen: "Controlled, nothing chosen yet",
  },
  button: {
    primary: "Place order",
    secondary: "Add more items",
    quiet: "Menu",
    danger: "Cancel order",
    ready: "Collected",
    disabled: "Choose a date first",
    block: "Go to checkout",
    counterReady: "Ready",
    counterCollected: "Collected",
  },
  labels: {
    payAtPickup: "Pay at pickup",
  },
  textField: {
    name: { label: "Name", error: "Enter your name." },
    phone: {
      label: "Mobile number",
      hint: "So we can call if something changes.",
      error: "Enter a 10-digit mobile number, like 0491 570 156.",
      value: "0491 570",
    },
    email: { label: "Email", hint: "We'll send your confirmation here." },
    notes: { label: "Notes for the bakery", hint: "Like “Sliced, please”." },
    disabled: { label: "Branch", value: "Northcote" },
    search: { label: "Find an order", placeholder: "Order number, name or phone" },
  },
  quantityStepper: {
    product: "Plain bagel",
    maxProduct: "Sourdough rye loaf",
  },
  toggle: {
    product: "Sourdough rye loaf",
    onText: "On the menu",
    offText: "Off the menu",
    disabledProduct: "Fruit loaf",
  },
  choiceGroup: {
    payment: {
      label: "How would you like to pay?",
      options: [
        {
          value: "online",
          label: "Pay online now",
          hint: "Pay by card on a secure payment page, then come back here.",
        },
        {
          value: "at_pickup",
          label: "Pay at pickup",
          hint: "Pay at the counter when you collect your order.",
        },
      ],
      error: "Choose how you'd like to pay.",
    },
    reason: {
      label: "Why is it being cancelled?",
      options: [
        { value: "not_collected", label: "Not collected", hint: "The customer didn’t come in for it." },
        { value: "customer", label: "Customer request", hint: "They called or came in to cancel." },
        { value: "other", label: "Other", hint: "Anything else. You’ll be asked what happened." },
      ],
    },
    none: "none",
  },
  notice: {
    neutral:
      "We took Sourdough rye loaf out of your order because Fitzroy doesn't make it.",
    neutralCheckTitle: "Your account is set up",
    neutralCheckBody: "You're signed in as sam.carter@example.com, and this order is in My account.",
    errorTitle: "Your payment wasn't completed",
    errorBody:
      "You haven't been charged, and your order and details are just as you left them. Try again, or choose Pay at pickup.",
    success: "MS-1043 collected",
    undo: "Undo",
    undoLabel: "Undo: put MS-1043 back to Ready",
    warningTitle: "Hiding takes it off all three menus.",
    warningBody:
      "Orders already placed keep it at the price they paid. Recurring orders will leave it out and say why in their note.",
    info: "New products go on the menu at all three branches. A branch that doesn’t make it can switch it off in Availability.",
    dismissed: "Dismissed. Reload to see it again.",
  },
} as const;
