# InfraHub v2 design system: Direction C "Tapak", light only

Field-first: the PJA standing at a drain in the sun is the primary user. The concept's dark desktop "command
centre" is re-drawn **light**: warm survey paper, dark ink, one colour per meaning. Gallery: `/kit.html`
(`entries/kit.tsx`); screenshots in `docs/overhaul/v2/reports/img/D/`.

## 1. Light only (hard rule)
- `html { color-scheme: light }` (in `public/theme.css`). There is no dark palette.
- No `dark:` utilities and no `prefers-color-scheme: dark` rules. `tw-config.js` sets `darkMode: 'class'` and
  no element ever gets `.dark`, so a stray `dark:` class stays inert; reviewers should still reject it.
- High-contrast "siang" surfaces are the point: the app is used outdoors on phones.

## 2. Tokens
CSS variables live in `public/theme.css`; `public/tw-config.js` mirrors them as Tailwind colours.

| Role | CSS variable | Tailwind | Hex | Use |
|---|---|---|---|---|
| Paper | `--ih-paper` | `bg-paper` | `#F7F5EF` | App background |
| Paper deep | `--ih-paper-deep` | `bg-paper-deep` | `#EFEBE1` | Desktop rail, tab track, sunken groups |
| Surface | `--ih-surface` | `bg-surface` | `#FFFFFF` | Cards, bars, sheets, inputs |
| Ink | `--ih-ink` | `text-ink` / `bg-ink` | `#14211F` | Text; the one "do this next" card |
| Ink soft | `--ih-ink-soft` | `ink-soft` | `#2A3936` | Ink hover, secondary text on tints |
| Muted | `--ih-muted` | `text-muted` | `#5B6B68` | Secondary text (AA on paper and white) |
| Faint | `--ih-faint` | `muted-faint` | `#8A9794` | Placeholders, neutral dots only (not body text) |
| Line | `--ih-line` | `border-line` | `#E3DFD3` | Hairlines, card borders |
| Line strong | `--ih-line-strong` | `border-line-strong` | `#CEC8B6` | Input borders, todo stepper nodes |
| Emerald | `--ih-emerald` | `emerald` | `#059669` | System state, done steps, focus ring |
| Emerald bright | `--ih-emerald-bright` | `emerald-bright` | `#10B981` | Primary action fill (with **ink** text, 6.5:1) |
| Emerald deep | `--ih-emerald-deep` | `emerald-deep` | `#047857` | Emerald text on light |
| Teal | `--ih-teal` | `teal` | `#14B8A6` | Secondary system accent (info, rate went down) |
| **Kontrak** | `--ih-kontrak` | `kontrak` | `#3B2E8C` | Anything that IS a contract / sebutharga / rate book |
| Amber | `--ih-amber` | `amber` | `#B45309` | Warning, stale rate, late |
| Danger | `--ih-danger` | `danger` | `#B42318` | Destructive, missing (TIADA) |

Each accent also has `-tint` (background) and `-line` (border) steps: `bg-kontrak-tint border-kontrak-line`,
`bg-amber-tint border-amber-line`, `bg-danger-tint border-danger-line`, `bg-emerald-tint`, `bg-teal-tint`.
Tailwind's default scales (`emerald-500`, `slate-200` …) still work; existing pages keep rendering.

**Purple is a teaching colour.** If a user sees purple, it is a contract or a rate book: contract chips, item
codes from a book, "Klon kontrak", version tags. Never use purple for decoration, links or generic emphasis.

## 3. Type
Self-hosted in `public/fonts/` (variable WOFF2, latin subset, OFL-1.1, see `public/fonts/LICENSES.md`).

| Token | Family | Size / line | Weight | Use |
|---|---|---|---|---|
| `text-display-xl` | Bricolage Grotesque (`font-display`) | 44 / 1.05, -0.025em | 800 | Page h1 on desktop |
| `text-display-l` | Bricolage | 32 / 1.1 | 800 | Page h1 on phone, hero numbers |
| `text-display-m` | Bricolage | 24 / 1.2 | 700 | Section h2 (desktop), card titles |
| `text-title` | Bricolage | 18 / 1.35 | 700 | Section h2 (phone), sheet title |
| body | Atkinson Hyperlegible Next (`font-sans`) | 16 / 1.5 (15 on dense desktop) | 400 | All UI text |
| small | Atkinson | 13–14 | 400/700 | Meta, hints, table cells |
| `.ih-eyebrow` | Atkinson | 12 / 16, +0.08em, caps | 700 | Labels above headings and table heads |

- `h1, h2, h3` default to Bricolage (theme.css), so existing pages pick it up; `font-sans` is Atkinson.
- Legacy keys `font-jakarta` → Bricolage, `font-geist` → Atkinson. `font-mono` is unchanged.
- **Numbers:** add `ih-num` (or Tailwind `tabular-nums`) wherever figures line up: money, quantities, counts,
  dates in columns. Both families ship `tnum`. Big counters use Bricolage 800 + `ih-num`.

## 4. Space, shape, elevation
- Spacing: Tailwind's 4 px scale. Card padding `p-4 md:p-5` (lg `p-5 md:p-7`); section rhythm `py-10 md:py-14`;
  grid gaps 12–24 px.
- Radius: `rounded-ih-sm` 8 (chips/inputs inside), `rounded-ih-md` 12 (buttons, inputs), `rounded-ih-lg` 18
  (cards), `rounded-ih-xl` 24 (sheets). Pills use `rounded-full`.
- Elevation: none. `tw-config.js` turns shadows and blur off; separate layers with `border-line` and a tone
  step (paper → surface). Fixed/sticky bars are solid `bg-surface`.
- Desktop shell: a 112 px flush rail (`w-28`, `bg-paper-deep`) with visible labels; content starts at `md:pl-32`.
  `ProjectDetail`'s fixed header starts at `md:left-28` and meets the rail edge exactly.
- Desktop header area sits on a faint 24 px survey grid (`.ih-grid-paper .ih-fade-down`). Use it only there.

## 5. Mobile rules (from `docs/mobile-redesign.md`, still binding)
- Tap targets ≥ 44 px (`min-h-11`, `w-11 h-11`); inputs ≥ 16 px text below `md` (theme.css enforces it).
- No hover-only actions; hover is an enhancement only. Labels are visible, not tooltips.
- 56 px top bar (`h-14`), 64 px tab bar (`h-16` + safe area); sticky offsets under the shell use `top-14`.
- The shell root uses `overflow-x-clip` (not `hidden`) so `sticky` works. Wide content scrolls inside its own
  frame (`DataTable` does this); the page never scrolls sideways at 360/390/430.

## 6. Components (`components/ui`, import from `components/ui`)
| Component | Use it for | Rules |
|---|---|---|
| `Button` | Actions | `primary` = the one main action per screen (emerald + ink text). `ink` = strong secondary / the chosen option. `outline` = the safe alternative. `kontrak` = contract actions only (Klon, Import BQ). `danger` = destructive, outlined. `size="lg"` + `hint` = big two-line choice (rate decisions). |
| `IconButton` | Icon-only actions | `label` is required (aria-label + title). 44×44. |
| `Chip` | Small status/meta labels | Tone by meaning (table in §2). Not clickable. |
| `ContractChip` | Every place a contract/sebutharga appears | Always code + status (`DRAF`/`AKTIF`/`DITUTUP`). `sm` inline; `lg` in project headers with `book`, `meta`, `locked`. DRAF is hatched, DITUTUP desaturated. |
| `StatusPill` | Project status in lists | Label from `StatusHelper` + six ticks = position in the workflow. Do not recolour per status. |
| `WorkflowStepper` | Project header | `vertical` on phone (children = "giliran anda" card under the current step); `horizontal` only at `md`+. `notes` carry dates (past) or owner, e.g. "PT" (future). |
| `Card` | Grouping | `surface` default; `ink` once per screen for the next action; `sunken` for secondary groups. |
| `SectionHeader` | Page h1 / section h2 | `level="page"` once per page. Eyebrow for context, actions on the right. |
| `StatTile` | Counters | Tone colours the number only. Pass `onClick` when it filters a list. |
| `DataTable` | Tabular data (BQ rows, versions) | `numeric` columns are right-aligned with tabular figures. Scrolls inside its frame. Pass `empty` for the empty case. |
| `Field` / `Input` / `Select` | Forms | Always wrap in `Field` (label, hint, error). `Input suffix="m"` for units; `inputMode="decimal"` for measurements. |
| `Sheet` | Phone decisions, filters | Wraps `BottomSheet`. `lead` takes an `Indicator`. Two big choices max. |
| `Tabs` | Switching views of one list | Track scrolls sideways on narrow phones; counts optional. |
| `Indicator` | BQ rows vs the contract's book | `KADAR_BERUBAH` amber fill, `PERKATAAN_BERUBAH` amber outline, `TIADA` red. `variant="dot"` inside rows (label kept for screen readers). Never silently rewrite a row; show the indicator. |
| `EmptyState` | Empty lists | One action max. |
| `Timeline` | change_log / rate-book versions | Newest first. `tag="v3"`, tone `kontrak` for published book versions. |
| `DiffRow` | Re-price preview, version diff | old → new rate with %; reworded text shows the old wording struck; `oldRate=null` = Baharu, `newRate=null` = Tiada. |

Primitives hold no business logic and fetch nothing: pass data in, get markup out.

## 7. Do / don't
**Do**
- Keep one primary (emerald) button per screen; make the rest `outline` / `ghost`.
- Put a `ContractChip` next to every rate, BQ or project header that depends on a contract.
- Write money as `RM 1,092.00` (`Formatter.formatCurrency`) with `ih-num`.
- Use Malay copy that says what happens next ("PT akan sahkan", "Keputusan direkod dengan nama dan tarikh anda").

**Don't**
- Don't add dark mode, translucent bars, shadows, glows or gradients on surfaces.
- Don't use purple for anything that is not a contract; don't use amber for anything that is not a warning.
- Don't introduce new fonts or load Google Fonts from the CDN; everything is in `public/fonts/`.
- Don't hide actions behind hover, and don't put controls under 44 px on phones.
- Don't recolour project statuses (yellow/blue/indigo); use `StatusPill`.
