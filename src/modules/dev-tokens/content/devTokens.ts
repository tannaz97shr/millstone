export const devTokensContent = {
  metadataTitle: "Design tokens — Millstone",
  title: "Design tokens",
  intro:
    "Every sample is painted from the Tailwind theme. Labels show the value expected by design/system/tokens.json.",
  sections: {
    palette: "Palette",
    type: "Type styles",
    spacing: "Spacing",
    radius: "Radii",
    shadow: "Shadows",
    controls: "Control sizes",
  },
  expected: "Expected",
  measured: "Measured",
  controls: {
    customerHeading: "Customer (default)",
    adminHeading: 'Admin (data-context="admin")',
    bodySample: "Body text in this context.",
    primaryButton: "Place order",
    inputLabel: "Mobile number",
    inputPlaceholder: "0491 570 006",
    tapTarget: "+",
    tapTargetLabel: "Add one",
    readyButton: "Ready",
    collectedButton: "Collected",
  },
} as const;
