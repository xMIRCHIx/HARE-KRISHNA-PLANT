# Hare Krishna Bricks — Production & Inventory Management System
**Spec for build**

- **Client:** Hare Krishna Bricks
- **Owner:** Maneesh Garg
- **Prepared by:** synchAD
- **Scope of this phase:** Admin panel only. No public/visitor page in this build — the tool is internal-use only, accessed directly at a login screen.

---

## 1. What this system does

A daily production ledger for a brick manufacturing plant. Every day, the owner (or a manager) logs how many bricks were made, how much raw material was used, what was sold, and the system calculates real cost-per-brick and profit/loss automatically — because material rates and quantities change day to day, cost is never assumed to be fixed.

---

## 2. Pages / Screens

Only these — no public marketing page.

1. **Login** — single password gate (see §6).
2. **Dashboard** — today's snapshot + recent activity.
3. **Daily Entry** — form to log one day's production, materials, and sales.
4. **Ledger** — full history table of every entry, with per-row breakdown.
5. **Expenses** — overhead costs, separate from daily production entries.
6. **Settings** — ratios, default rates, password change.

---

## 3. Data model

### 3.1 Production Entry (one per day, or one per run — see §5.2)
| Field | Type | Notes |
|---|---|---|
| date | date | |
| produced | number | bricks produced |
| sold | number | bricks sold that day |
| salePrice | number | ₹ per brick; falls back to Settings default if blank |
| costMode | `ratio` \| `manual` | which material-cost method was used for this entry |
| cementBags | number | actual bags used **that day** — not a fixed daily amount, can be 0.5, 1, 3, etc. |
| cementRate | number | ₹ per bag, that day's rate |
| dustTrucks | number | actual trucks used **that day** — flexible, can exceed 1 on big days |
| dustRate | number | ₹ per truck, that day's rate |
| raakhQty | number | fly ash quantity used that day (bori/tasla/kg — unit fixed once in Settings) |
| raakhRate | number | ₹ per raakh unit, that day's rate |
| manualMaterialCost | number | used only when costMode = manual; total material cost for the day, entered directly |
| workerRate | number | ₹ per brick paid to labour; falls back to Settings default |
| otherCost | number | any extra one-off cost tied to that day |
| note | text | optional |

### 3.2 Expense (overhead, logged separately from production)
| Field | Type | Notes |
|---|---|---|
| date | date | |
| category | enum | Electricity, Diesel/Fuel, Machine maintenance, Rent, Transport, Fixed staff salary, Other |
| amount | number | ₹ |
| frequency | `daily` \| `monthly` | how this expense was entered |
| note | text | optional |

Expenses are **never mixed into the Daily Entry cost fields.** Whether they get folded into cost-per-brick is a Settings toggle (§5.5).

### 3.3 Settings (single record)
| Field | Type | Notes |
|---|---|---|
| productionEstimateMode | `fixed` \| `auto` | see §5.1 |
| cementRatio | number \| null | bricks per cement bag, if fixed mode |
| dustRatio | number \| null | bricks per dust truck, if fixed mode |
| raakhRatio | number \| null | bricks per raakh unit, if fixed mode |
| defaultWorkerRate | number | ₹ per brick, default 0.60 |
| defaultSalePrice | number | ₹ per brick, default 4 |
| overheadSplitMode | `split` \| `separate` | see §5.5 |
| adminPassword | string | stored client-side; see §6 |

---

## 4. Calculation logic (runs on every entry, and rolls up on Dashboard/Ledger)

```
materialCost   = (cementBags × cementRate) + (dustTrucks × dustRate) + (raakhQty × raakhRate)
                 — OR manualMaterialCost, if costMode = manual

workerCost     = produced × workerRate

overheadShare  = (this day's share of overhead) — only if overheadSplitMode = split;
                 otherwise 0, and overheads are shown as a separate monthly total

totalCost      = materialCost + workerCost + otherCost + overheadShare

costPerBrick   = totalCost ÷ produced

revenue        = sold × salePrice

profit         = revenue − (sold × costPerBrick)

stockDelta     = produced − sold
runningStock   = sum of stockDelta across all entries (plus opening stock, if entered — see §5.7)
```

Cost-per-brick is **recalculated fresh every day** — it is never assumed to be a fixed ₹3.5 or similar. If material rates rise and cost-per-brick crosses the sale price, that day should visibly flag as a loss (red), not just a lower profit number.

---

## 5. Feature details (decisions from client discovery)

### 5.1 Production estimate method
Two modes, both supported, switchable in Settings:
- **Fixed** — owner provides ratios directly (bricks per cement bag / dust truck / raakh unit).
- **Auto** — system takes the first 4–5 days of actual entries and computes the average ratio itself, then uses that as the estimate going forward. Should be editable later if the owner wants to override.

### 5.2 Production counting frequency
Support **once-per-day** entry as the default and simplest path. If the plant runs multiple batches/shifts in a day, the Daily Entry form should allow adding more than one production line for the same date (each with its own count), which the system sums into that day's total. Don't force multi-run entry when the plant only produces once a day — keep the single-count path the fast default.

### 5.3 Raw material quantity — always actual, never assumed
No "1 truck lasts N days" assumption anywhere in the logic. Every entry asks for that day's real quantity used (cement bags, dust trucks, raakh), which can vary freely — 0.5 one day, 3 the next, on a large plant. This is a hard constraint on the data model (§3.1) — quantity fields are always per-entry inputs, never derived from a fixed schedule.

### 5.4 Worker payoff
₹0.60/brick (default, editable) is paid — confirm with client whether on gross production or net-of-breakage count (open question, see §7). If some workers are fixed-salary rather than piece-rate, that cost goes under Expenses (§3.2, category "Fixed staff salary"), not into the per-brick worker cost.

### 5.5 Overheads (Expenses page)
Logged separately from daily production. Categories: Electricity, Diesel/Fuel, Machine maintenance, Rent, Transport, Fixed staff salary, Other. Entered either as a daily fixed estimate or as actual monthly bills.

A single Settings toggle decides how overhead affects reported profit:
- **Split** — overhead is distributed across the period's total bricks and folded into cost-per-brick (more accurate true profit).
- **Separate** — overhead is shown only as its own running total, never touching production cost-per-brick (simpler, less precise).

### 5.6 Sales
Sale price defaults from Settings but is editable per entry (some days/customers may differ). Support a simple credit/udhaar flag per entry if the client confirms they extend credit — track amount owed separately from cash sales (open question, see §7).

### 5.7 Stock
Running stock = cumulative produced − sold. Support an optional one-time "opening stock" value (what's already sitting at the yard before this system starts tracking), so historic inventory isn't lost.

### 5.8 Access & scale (this phase)
- Single user / single admin password (§6). No per-user accounts yet.
- Single site. Multi-site support is a future phase, not in this build.
- Data persists in the browser only (localStorage) — no backend/database in this phase. This means data does not sync across devices and is lost if browser storage is cleared. Flag this clearly in the UI (e.g. a small note in Settings), not just in this doc.

---

## 6. Login / access

Simple client-side password gate protecting the whole app (there's no public page to gate around, so this can be the very first screen). Password is stored and changeable from Settings. This is **not real security** — it's a basic deterrent, not encryption or auth — and should be described that way to the client, not oversold.

---

## 7. Open questions (not yet confirmed by client — flag in UI or ask before finalizing)

- Worker payoff: gross production count or net-of-breakage count?
- Are all workers piece-rate, or is some staff on fixed salary?
- Does the plant extend credit (udhaar) to customers — if yes, needs a due-amount tracking field?
- Should existing/current stock be entered as an opening balance?
- Do cement, dust, and raakh rates change on independent schedules, or together?

These don't block building the core screens — default to the simpler option (net stays off, cash-only, no opening stock) and make each one a Settings toggle so the client can flip it once confirmed.

---

## 8. Non-goals for this phase

- No visitor/public marketing page.
- No multi-user accounts or roles.
- No multi-site support.
- No real backend/database — single-browser storage only.
- No real authentication — password gate is a basic access deterrent only.

These may become later phases; don't build hooks for them unless it's free to do so.
