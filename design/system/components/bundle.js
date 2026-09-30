/* @ds-bundle: {"format":4,"namespace":"Millstone","components":[{"name":"Button"},{"name":"ProductCard"},{"name":"TextField"},{"name":"QuantityStepper"},{"name":"ChoiceGroup"},{"name":"DatePicker"},{"name":"Toggle"},{"name":"StatusBadge"},{"name":"PaymentLabel"},{"name":"RecurringLabel"},{"name":"OrderRow"},{"name":"RecurringStatusTag"},{"name":"WeekdayPicker"}]} */
(function () {
  "use strict";
  var R = function () { return window.React; };
  function h() { var r = R(); return r.createElement.apply(r, arguments); }
  function cx() { return Array.prototype.filter.call(arguments, Boolean).join(" "); }
  function omit(o, keys) { var out = {}; for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k) && keys.indexOf(k) < 0) out[k] = o[k]; return out; }
  var uid = 0; function useId(p) { var r = R(); var ref = r.useRef(null); if (ref.current == null) ref.current = (p || "ms") + "-" + (++uid); return ref.current; }

  var PATHS = {
    check: ["M5 12.5l4.5 4.5L19 7.5"],
    cross: ["M6.5 6.5l11 11", "M17.5 6.5l-11 11"],
    ring: [],
    repeat: ["M17 3l3 3-3 3", "M4 12v-1a5 5 0 0 1 5-5h11", "M7 21l-3-3 3-3", "M20 12v1a5 5 0 0 1-5 5H4"],
    note: [],
    alert: ["M12 7.5v6", "M12 17v.01"],
    plus: ["M12 5v14", "M5 12h14"],
    minus: ["M5 12h14"],
    left: ["M15 5l-7 7 7 7"],
    right: ["M9 5l7 7-7 7"],
    refund: ["M9 5L4.5 9.5 9 14", "M4.5 9.5H14a5 5 0 0 1 0 10h-3"]
  };
  function Icon(props) {
    var n = props.name, kids = (PATHS[n] || []).map(function (d, i) { return h("path", { key: i, d: d }); });
    if (n === "ring") kids.push(h("circle", { key: "c", cx: 12, cy: 12, r: 6.5 }));
    if (n === "alert") kids.push(h("circle", { key: "c", cx: 12, cy: 12, r: 9 }));
    if (n === "note") { kids.push(h("rect", { key: "r", x: 2.5, y: 6, width: 19, height: 12, rx: 2 })); kids.push(h("circle", { key: "c", cx: 12, cy: 12, r: 2.5 })); }
    return h("svg", { className: "ms-icon", viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false" }, kids);
  }

  /* Button */
  function Button(p) {
    var variant = p.variant || "secondary";
    var rest = omit(p, ["variant", "block", "counter", "icon", "className", "children", "type"]);
    return h("button", Object.assign({ type: p.type || "button" }, rest, {
      className: cx("ms-btn", "ms-btn-" + variant, p.block && "ms-btn-block", p.counter && "ms-btn-counter", p.className)
    }), p.icon ? h(Icon, { name: p.icon }) : null, p.children);
  }

  /* Status badges */
  var STATUS = {
    placed: { label: "Placed", icon: "ring" },
    ready: { label: "Ready", icon: "check" },
    collected: { label: "Collected", icon: "check" },
    cancelled: { label: "Cancelled", icon: "cross" }
  };
  function StatusBadge(p) {
    var s = STATUS[p.status] || STATUS.placed;
    return h("span", { className: cx("ms-badge", "ms-badge-" + (STATUS[p.status] ? p.status : "placed"), p.className), "data-status": p.status },
      h(Icon, { name: s.icon }), p.children || s.label);
  }
  var PAY = {
    unpaid: { label: "Unpaid", icon: "note" },
    paid: { label: "Paid", icon: "check" },
    refunded: { label: "Refunded", icon: "refund" }
  };
  function PaymentLabel(p) {
    var key = PAY[p.status] ? p.status : "unpaid", s = PAY[key];
    return h("span", { className: cx("ms-tag", "ms-pay-" + key, p.className), "data-payment": key },
      h(Icon, { name: s.icon }), p.children || s.label);
  }
  function RecurringLabel(p) {
    return h("span", { className: cx("ms-tag", "ms-recurring", p.className), title: p.title },
      h(Icon, { name: "repeat" }), p.children || "Recurring");
  }

  /* Product card */
  function money(n) { return typeof n === "number" ? "$" + n.toFixed(2) : n; }
  function ProductCard(p) {
    var soldOut = !!p.soldOut;
    var media = h("div", { className: "ms-card-media" },
      p.image ? h("img", { src: p.image, alt: p.imageAlt || "" }) : h("span", { className: "ms-card-initial", "aria-hidden": "true" }, (p.name || "?").charAt(0)));
    var action;
    if (soldOut) action = h("span", { className: "ms-soldout" }, typeof p.soldOut === "string" ? p.soldOut : "Sold out");
    else if (p.quantity > 0 && p.onQuantityChange) action = h(QuantityStepper, { value: p.quantity, onChange: p.onQuantityChange, label: p.name });
    else action = h(Button, { variant: "primary", icon: "plus", onClick: p.onAdd, "aria-label": "Add " + p.name + " to order" }, "Add");
    return h("article", { className: cx("ms-card", soldOut && "ms-card-soldout", p.layout === "row" && "ms-card-row", p.className) },
      media,
      h("div", { className: "ms-card-body" },
        h("h3", { className: "ms-card-name" }, p.name),
        p.description ? h("p", { className: "ms-card-desc" }, p.description) : null,
        h("div", { className: "ms-card-foot" }, h("span", { className: "ms-price" }, money(p.price)), action)));
  }

  /* Text field */
  function TextField(p) {
    var id = useId("fld"); var fid = p.id || id;
    var hintId = fid + "-hint", errId = fid + "-err";
    var described = [p.hint && hintId, p.error && errId].filter(Boolean).join(" ") || undefined;
    var rest = omit(p, ["label", "hint", "error", "multiline", "optional", "className", "id"]);
    var ctrl = h(p.multiline ? "textarea" : "input", Object.assign({ type: p.multiline ? undefined : (p.type || "text") }, rest, {
      id: fid, className: "ms-input", "aria-invalid": p.error ? "true" : undefined, "aria-describedby": described
    }));
    return h("div", { className: cx("ms-field", p.error && "ms-field-error", p.className) },
      h("label", { className: "ms-label", htmlFor: fid }, p.label, p.optional ? h("span", { className: "ms-label-opt" }, " (optional)") : null),
      p.hint ? h("p", { className: "ms-hint", id: hintId }, p.hint) : null,
      ctrl,
      p.error ? h("p", { className: "ms-error", id: errId }, h(Icon, { name: "alert" }), p.error) : null);
  }

  /* Quantity stepper */
  function QuantityStepper(p) {
    var r = R(); var st = r.useState(p.defaultValue != null ? p.defaultValue : 1);
    var v = p.value != null ? p.value : st[0];
    var min = p.min != null ? p.min : 0, max = p.max != null ? p.max : 99;
    function set(n) { n = Math.max(min, Math.min(max, n)); if (p.value == null) st[1](n); if (p.onChange) p.onChange(n); }
    var name = p.label ? " " + p.label : "";
    return h("div", { className: cx("ms-stepper", p.className), role: "group", "aria-label": "Quantity" + name },
      h("button", { type: "button", onClick: function () { set(v - 1); }, disabled: v <= min, "aria-label": (v - 1 <= 0 ? "Remove" : "One fewer") + name }, h(Icon, { name: "minus" })),
      h("output", { "aria-live": "polite" }, v),
      h("button", { type: "button", onClick: function () { set(v + 1); }, disabled: v >= max, "aria-label": "One more" + name }, h(Icon, { name: "plus" })));
  }

  /* Choice group (radio cards) */
  function ChoiceGroup(p) {
    var r = R(); var name = useId("ch"); var st = r.useState(p.defaultValue);
    var v = p.value !== undefined ? p.value : st[0];
    function pick(x) { if (p.value === undefined) st[1](x); if (p.onChange) p.onChange(x); }
    return h("fieldset", { className: cx("ms-choices", p.className) },
      p.label ? h("legend", { className: "ms-label" }, p.label) : null,
      (p.options || []).map(function (o) {
        var on = o.value === v;
        return h("label", { key: o.value, className: cx("ms-choice", on && "ms-choice-on") },
          h("input", { type: "radio", name: p.name || name, value: o.value, checked: on, onChange: function () { pick(o.value); } }),
          h("span", { className: "ms-choice-dot", "aria-hidden": "true" }),
          h("span", { className: "ms-choice-text" },
            h("span", { className: "ms-choice-title" }, o.label),
            o.hint ? h("span", { className: "ms-choice-hint" }, o.hint) : null));
      }));
  }

  /* Toggle */
  function Toggle(p) {
    var r = R(); var st = r.useState(!!p.defaultChecked);
    var on = p.checked != null ? p.checked : st[0];
    function flip() { if (p.disabled) return; if (p.checked == null) st[1](!on); if (p.onChange) p.onChange(!on); }
    var onText = p.onText || "On", offText = p.offText || "Off";
    return h("button", { type: "button", role: "switch", "aria-checked": on ? "true" : "false", disabled: p.disabled, onClick: flip, className: cx("ms-toggle", on && "ms-toggle-on", p.className) },
      h("span", { className: "ms-toggle-track", "aria-hidden": "true" }, h("span", { className: "ms-toggle-thumb" })),
      h("span", { className: "ms-toggle-text" },
        p.label ? h("span", { className: "ms-toggle-label" }, p.label) : null,
        h("span", { className: "ms-toggle-state" }, on ? onText : offText)));
  }

  /* Date picker */
  function parse(iso) { var a = String(iso).split("-"); return new Date(+a[0], +a[1] - 1, +a[2]); }
  function iso(d) { var m = d.getMonth() + 1, x = d.getDate(); return d.getFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (x < 10 ? "0" : "") + x; }
  function addDays(d, n) { var c = new Date(d.getFullYear(), d.getMonth(), d.getDate()); c.setDate(c.getDate() + n); return c; }
  var WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var MONTH = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function longDate(d) { return WD[d.getDay()] + " " + d.getDate() + " " + MONTH[d.getMonth()]; }
  function DatePicker(p) {
    var r = R();
    var earliest = p.earliest ? parse(p.earliest) : addDays(new Date(), 1);
    var latest = p.latest ? parse(p.latest) : null;
    var closed = p.unavailable || [];
    var st = r.useState(p.defaultValue || null);
    var v = p.value !== undefined ? p.value : st[0];
    var monthSt = r.useState(function () { var b = v ? parse(v) : earliest; return new Date(b.getFullYear(), b.getMonth(), 1); });
    function isOff(d) { var s = iso(d); return d < earliest || (latest && d > latest) || closed.indexOf(s) >= 0 || (p.closedWeekdays || []).indexOf(d.getDay()) >= 0; }
    function pick(d) { if (isOff(d)) return; var s = iso(d); if (p.value === undefined) st[1](s); if (p.onChange) p.onChange(s); }
    var labelId = useId("dp");
    var head = p.label ? h("div", { className: "ms-label", id: labelId, style: { marginBottom: "var(--space-2)" } }, p.label) : null;
    var note = p.note ? h("p", { className: "ms-dates-note" }, p.note) : null;

    if (p.layout === "month") {
      var m0 = monthSt[0], first = m0.getDay(), days = new Date(m0.getFullYear(), m0.getMonth() + 1, 0).getDate();
      var cells = [];
      for (var i = 0; i < first; i++) cells.push(h("span", { key: "b" + i }));
      for (var dnum = 1; dnum <= days; dnum++) (function (d) {
        var s = iso(d), off = isOff(d);
        cells.push(h("button", { key: s, type: "button", className: cx("ms-cell", p.today && s === p.today && "ms-cell-today"), "aria-pressed": s === v ? "true" : "false", "aria-disabled": off ? "true" : undefined, "aria-label": longDate(d) + (off ? ", not available" : ""), onClick: function () { pick(d); } }, d.getDate()));
      })(new Date(m0.getFullYear(), m0.getMonth(), dnum));
      return h("div", { className: cx("ms-dates", p.className), role: "group", "aria-labelledby": p.label ? labelId : undefined },
        head,
        h("div", { className: "ms-month" },
          h("div", { className: "ms-month-head" },
            h("button", { type: "button", className: "ms-month-nav", "aria-label": "Previous month", onClick: function () { monthSt[1](new Date(m0.getFullYear(), m0.getMonth() - 1, 1)); } }, h(Icon, { name: "left" })),
            h("span", { className: "ms-month-title", "aria-live": "polite" }, MONTH[m0.getMonth()] + " " + m0.getFullYear()),
            h("button", { type: "button", className: "ms-month-nav", "aria-label": "Next month", onClick: function () { monthSt[1](new Date(m0.getFullYear(), m0.getMonth() + 1, 1)); } }, h(Icon, { name: "right" }))),
          h("div", { className: "ms-grid" },
            WD.map(function (w) { return h("span", { key: w, className: "ms-grid-wd", "aria-hidden": "true" }, w.charAt(0) + w.charAt(1)); }),
            cells)),
        note);
    }

    var start = p.start ? parse(p.start) : earliest, count = p.days || 7, tiles = [];
    for (var k = 0; k < count; k++) (function (d) {
      var s = iso(d), off = isOff(d);
      tiles.push(h("button", { key: s, type: "button", className: "ms-day", "aria-pressed": s === v ? "true" : "false", "aria-disabled": off ? "true" : undefined, "aria-label": longDate(d) + (off ? ", not available" : ""), onClick: function () { pick(d); } },
        h("span", { className: "ms-day-wd" }, WD[d.getDay()]),
        h("span", { className: "ms-day-num" }, d.getDate()),
        h("span", { className: "ms-day-mo" }, MO[d.getMonth()])));
    })(addDays(start, k));
    return h("div", { className: cx("ms-dates", p.className), role: "group", "aria-labelledby": p.label ? labelId : undefined },
      head, h("div", { className: "ms-dates-strip" }, tiles), note);
  }

  /* Admin order row */
  function OrderRow(p) {
    var status = p.status || "placed", final = status === "collected" || status === "cancelled";
    var items = Array.isArray(p.items) ? p.items.map(function (i) { return i.quantity + " \u00d7 " + i.name; }).join(", ") : p.items;
    var actions = [];
    if (status === "placed") actions.push(h(Button, { key: "r", variant: "primary", counter: true, icon: "check", onClick: p.onReady, "aria-label": "Mark " + p.orderNumber + " ready" }, "Ready"));
    if (status === "placed" || status === "ready") actions.push(h(Button, { key: "c", variant: status === "ready" ? "ready" : "secondary", counter: true, icon: "check", onClick: p.onCollected, "aria-label": "Mark " + p.orderNumber + " collected" }, "Collected"));
    return h("article", { className: cx("ms-row", "ms-row-" + status, final && "ms-row-final", p.generationNote && !final && "ms-row-flagged", p.selected && "ms-row-selected", p.className), "aria-label": "Order " + p.orderNumber },
      h("div", { className: "ms-row-main" },
        h("div", { className: "ms-row-head" },
          h("span", { className: "ms-row-number" }, p.orderNumber),
          h(StatusBadge, { status: status }),
          p.payment ? h(PaymentLabel, { status: p.payment }) : null,
          p.recurring ? h(RecurringLabel, null) : null,
          p.total != null ? h("span", { className: "ms-row-total" }, money(p.total)) : null),
        h("div", { className: "ms-row-who" }, p.customerName, p.phone ? h("span", { className: "ms-row-phone" }, " \u00b7 " + p.phone) : null),
        items ? h("p", { className: "ms-row-items" }, items) : null,
        p.notes ? h("p", { className: "ms-row-notes" }, h("strong", null, "Note: "), p.notes) : null,
        p.generationNote ? h("p", { className: "ms-row-gen" }, h(Icon, { name: "alert" }), h("span", null, p.generationNote)) : null,
        p.onOpen ? h("button", { type: "button", className: "ms-row-open", onClick: p.onOpen }, "Details", h(Icon, { name: "right" })) : null),
      actions.length ? h("div", { className: "ms-row-actions" }, actions) : null);
  }

  /* Recurring order status tag */
  var RSTATUS = {
    active: { label: "Active", icon: "check" },
    paused: { label: "Paused", icon: "ring" },
    ended: { label: "Ended", icon: "cross" }
  };
  function RecurringStatusTag(p) {
    var key = RSTATUS[p.status] ? p.status : "active", s = RSTATUS[key];
    return h("span", { className: cx("ms-tag", "ms-rstatus", "ms-rstatus-" + key, p.className), "data-status": key },
      h(Icon, { name: s.icon }), p.children || s.label);
  }

  /* Weekday picker (multi-select) */
  var WD_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  function WeekdayPicker(p) {
    var r = R(); var st = r.useState(p.defaultValue || []);
    var v = p.value != null ? p.value : st[0];
    var closed = p.closedWeekdays || [];
    var order = p.order || [1, 2, 3, 4, 5, 6, 0];
    var closedText = p.closedText || "Closed";
    var labelId = useId("wd"), hintId = labelId + "-hint", errId = labelId + "-err";
    function toggle(n) {
      if (closed.indexOf(n) >= 0) return;
      var next = v.indexOf(n) >= 0 ? v.filter(function (x) { return x !== n; }) : v.concat([n]);
      next = order.filter(function (x) { return next.indexOf(x) >= 0; });
      if (p.value == null) st[1](next);
      if (p.onChange) p.onChange(next);
    }
    return h("div", { className: cx("ms-weekdays", p.error && "ms-weekdays-error", p.className) },
      p.label ? h("div", { className: "ms-label", id: labelId }, p.label) : null,
      p.hint ? h("p", { className: "ms-hint", id: hintId }, p.hint) : null,
      h("div", { className: "ms-weekdays-grid", role: "group", "aria-labelledby": p.label ? labelId : undefined, "aria-describedby": [p.hint && hintId, p.error && errId].filter(Boolean).join(" ") || undefined },
        order.map(function (n) {
          var off = closed.indexOf(n) >= 0, on = !off && v.indexOf(n) >= 0;
          return h("button", { key: n, type: "button", className: "ms-wd", "aria-pressed": on ? "true" : "false", disabled: off || p.disabled, "aria-label": WD_LONG[n] + (off ? ", " + closedText.toLowerCase() : ""), onClick: function () { toggle(n); } },
            h("span", { className: "ms-wd-name" }, WD[n]),
            off ? h("span", { className: "ms-wd-note" }, closedText) : null);
        })),
      p.error ? h("p", { className: "ms-error", id: errId }, h(Icon, { name: "alert" }), p.error) : null);
  }

  var api = { Button: Button, ProductCard: ProductCard, TextField: TextField, QuantityStepper: QuantityStepper, ChoiceGroup: ChoiceGroup, DatePicker: DatePicker, Toggle: Toggle, StatusBadge: StatusBadge, PaymentLabel: PaymentLabel, RecurringLabel: RecurringLabel, OrderRow: OrderRow, RecurringStatusTag: RecurringStatusTag, WeekdayPicker: WeekdayPicker, Icon: Icon };
  window.Millstone = Object.assign(window.Millstone || {}, api);
})();
