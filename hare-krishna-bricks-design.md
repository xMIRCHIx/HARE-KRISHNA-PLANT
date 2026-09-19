# Hare Krishna Bricks — Admin Design System

Applies to the admin-only panel (Login, Dashboard, Daily Entry, Ledger, Expenses, Settings). Light bluish theme, interaction-first — nothing on screen should feel flat or static; every actionable element responds visibly to hover, focus, and state change.

---

## 1. Principle

This is a daily-use operational tool, not a brochure — it should feel calm and light (soft blue, lots of air, no clutter) but **alive under the cursor**: cards lift, numbers animate in, buttons respond, tabs glide. Motion is the personality here since there's no imagery or brand storytelling to carry it — restraint everywhere except interaction.

---

## 2. Color tokens

```css
:root {
  /* Base surfaces */
  --bg:            #F4F9FD;   /* page background — pale sky blue, not pure white */
  --surface:       #FFFFFF;   /* cards, panels */
  --surface-alt:   #EAF3FC;   /* hover/active surface tint */
  --surface-sunken:#E3EEF9;   /* input backgrounds, table stripes */

  /* Blue accent scale */
  --primary:       #2F6FED;   /* main actions, active states */
  --primary-hover: #1E5AD6;
  --primary-soft:  #DCEAFE;   /* chips, badges, soft highlights */
  --primary-ring:  rgba(47,111,237,0.35); /* focus ring / glow */

  /* Text */
  --ink:           #16233B;   /* headings */
  --ink-muted:     #4C5F7A;   /* body text */
  --ink-faint:     #8CA0BC;   /* placeholders, hints */

  /* Status */
  --good:          #1FA97A;
  --good-soft:     #DEF7ED;
  --bad:           #E5484D;
  --bad-soft:      #FCE4E4;
  --warn:          #D9A02B;
  --warn-soft:     #FBF1DC;

  /* Lines */
  --line:          #DCE7F4;
  --line-strong:   #C2D6EC;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg:            #0B1523;
    --surface:       #101E31;
    --surface-alt:   #16283F;
    --surface-sunken:#0F1D2E;
    --primary:       #5B93FF;
    --primary-hover: #7AA6FF;
    --primary-soft:  #1B2E4D;
    --ink:           #EAF2FC;
    --ink-muted:     #A9BEDA;
    --ink-faint:     #6C7F9C;
    --line:          #1E3350;
    --line-strong:   #2B4468;
  }
}
```

No pure black anywhere, no pure white text — everything sits on the blue scale.

---

## 3. Typography

- **Headings / KPI numbers:** `Space Grotesk` — has a slight technical edge, good for large numbers on the dashboard. Weight 600–700.
- **Body / labels / table data:** `Inter` — clean, high legibility at small sizes for dense tables.
- Numbers everywhere use `font-variant-numeric: tabular-nums` so columns of figures align.
- Type scale: 13px table/body, 14.5px form labels, 20px section headers, 30–34px KPI figures, 22px page titles. Avoid anything larger — this is a working tool, not a landing page.
- No all-caps labels. No tracked-out eyebrow text above headings.

---

## 4. Motion language

Every interactive element gets **one** clear, purposeful animation — never combine three effects on the same element.

### Timing
```css
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out-soft: cubic-bezier(0.16, 1, 0.3, 1);
--dur-fast:  120ms;
--dur-base:  200ms;
--dur-slow:  360ms;
```

### Cards & panels (KPI cards, ledger rows, entry panels)
- Rest state: `box-shadow: 0 1px 2px rgba(22,35,59,0.06)`, `border: 1px solid var(--line)`.
- Hover: lift 2px (`transform: translateY(-2px)`), shadow deepens to `0 12px 24px rgba(47,111,237,0.12)`, border tints to `var(--line-strong)`. Transition `var(--dur-base) var(--ease-out-soft)` on `transform, box-shadow, border-color`.
- Never use a static drop shadow with no hover change — every card must visibly respond.

### Buttons
- Primary: `background: var(--primary)`. Hover: background shifts to `--primary-hover` **and** scales to `1.02`, `transition: 150ms var(--ease-standard)`.
- Press (`:active`): scale to `0.97`, transition `80ms`.
- Add a soft radial glow on hover using a pseudo-element (`::after`) that fades in at low opacity behind the button — subtle, not neon.

### Inputs
- Rest: `border: 1px solid var(--line)`, `background: var(--surface-sunken)`.
- Focus: border becomes `var(--primary)`, plus an animated glow ring (`box-shadow: 0 0 0 4px var(--primary-ring)`) that expands in from `0 0 0 0` over `180ms` — not an instant snap.
- Label micro-motion: on focus, label (if floating-style) shifts up and shrinks smoothly.

### KPI numbers (Dashboard)
- On load / on data change, animate the number counting up from 0 (or from previous value) to the new value over ~600–800ms with an ease-out curve — never just swap the digits instantly.
- Profit/loss figure additionally does a color transition (grey → green or red) synced with the count-up finishing.

### Tabs / navigation switch (Dashboard ↔ Daily Entry ↔ Ledger ↔ Expenses ↔ Settings)
- Active tab indicator is a pill/underline that **slides** to the new position (`transform: translateX(...)`, `var(--dur-base) var(--ease-out-soft)`) rather than jumping.
- Pane content cross-fades + slides up slightly (8px) on switch, `var(--dur-base)`.

### Table rows (Ledger)
- Hover: row background tints to `var(--surface-alt)` with a `150ms` transition, and a thin left border in `var(--primary)` fades in — gives a "selected/scannable" feel without being heavy.
- Row delete: confirm action collapses the row height to 0 smoothly rather than disappearing instantly.

### Toggles / mode switches (e.g. ratio vs manual entry mode)
- Custom animated toggle/segmented control, not default radio buttons — the selected segment's background slides between options (`translateX`, `var(--dur-base) var(--ease-out-soft)`).

### Loading / empty states
- Skeleton shimmer (soft blue gradient sweep) while data loads — never a static spinner-only or blank white flash.
- Empty states (e.g. "no entries yet") fade + slide in gently, with a one-line action-oriented message, not just grey placeholder text.

### Page-level
- On login success, transition into the dashboard with a soft fade + 12px upward slide, `var(--dur-slow)` — avoid a hard cut.
- Respect `prefers-reduced-motion`: fall back to opacity-only transitions (no transforms) when set.

---

## 5. Layout & components

- **Shape language:** 8px corner radius across cards, inputs, buttons — consistent, not mixed radii.
- **Elevation:** only two levels — flat (default) and lifted (hover/active). Don't stack multiple shadow depths.
- **Sidebar nav (admin shell):** soft blue-tinted dark panel (`--ink` at low opacity over `--primary`) or a light panel with a colored active-state pill — pick one, stay consistent; avoid plain white nav with no distinction from content.
- **Dashboard KPI row:** 4 cards, equal width, icon or small accent bar per card in `--primary-soft`, animated count-up numbers per §4.
- **Forms (Daily Entry):** grouped fields in a light card, generous spacing (not cramped), inline validation with a smooth color transition on the input border rather than a jarring red flash.
- **Tables (Ledger):** sticky header, tabular-nums, zebra striping using `--surface-sunken` at low opacity, hover row highlight per §4.

---

## 6. What to avoid

- Flat, motionless cards with a static drop shadow and nothing else.
- Instant number swaps on the dashboard (no count-up).
- Default unstyled browser checkboxes/radios/toggles.
- Hard cuts between tabs/pages with no transition.
- All-caps labels, tracked-out eyebrows, monospace data labels, arrows appended to every button (→) — none of that belongs here; keep the personality in motion, not typographic tics.
- Pure white background — always the pale blue `--bg`, even behind modals/overlays.
