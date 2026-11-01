# PaperTab Sketchbook Design System

> Design language specification and token reference for PaperTab.

PaperTab follows a **"Sketchbook / paper and ink"** aesthetic, crafted to look and feel like an authentic hand-made notebook with physical ink, paper surfaces, and hard offset shadows.

For full architectural overview, see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 1. Brand Colors & Neutrals

Neutrals cover approximately 80% of every screen. Blue and green are never blended into a gradient; they appear as flat, hard-edged fills side by side (matching the `P` and `T` logo).

| Role | Color | Hex | Usage |
| :--- | :--- | :--- | :--- |
| **Interaction / Blue** | Blue | `#46BAEB` | Selected tool, active tab, focus rings, link accents, marquee |
| **Confirmation / Green**| Green | `#00BF63` | Wallpaper mode CTA, Done/Save buttons, export actions, success states |
| **Text ON Accent** | Ink Dark | `#0E1A1F` | Text and icons placed on blue or green fills (**BOTH** themes) |
| **Blue Text / Links** | Dark Blue | `#137298` (Light) / `#46BAEB` (Dark) | Text links meeting WCAG AA (>= 4.5:1) |
| **Green Text** | Dark Green | `#00834A` (Light) / `#00BF63` (Dark) | Green text meeting WCAG AA (>= 4.5:1) |
| **Danger** | Red | `#D92D20` (Light) / `#F97066` (Dark) | Destructive actions, delete buttons |
| **Warning** | Amber | `#B54708` (Light) / `#FDB022` (Dark) | Warnings, scene limit reached, locked badges |

> [!IMPORTANT]
> **Contrast Rule**: Pure white (`#FFFFFF`) on Blue (`#46BAEB`) yields 2.21:1 (FAIL) and on Green (`#00BF63`) yields 2.43:1 (FAIL). Always use `--on-accent` (`#0E1A1F`) for text and icons placed over blue or green fills (yielding 7.99:1 and 7.28:1 contrast).

---

## 2. Token Specification

Tokens are declared as CSS variables in `src/styles/globals.css` and exposed via `@theme` to Tailwind v4.

### Light Theme (`:root, [data-theme="light"]`)
- `--paper`: `#F6FAF8` (page & panel backdrop)
- `--surface`: `#FFFFFF` (toolbars, dialogs, cards)
- `--ink`: `#0E1A1F` (primary text, borders, hard shadows)
- `--muted`: `#52636A` (secondary text, >= 4.5:1 on paper)
- `--line`: `#0E1A1F` (2px component borders)
- `--blue`: `#46BAEB`
- `--green`: `#00BF63`
- `--blue-text`: `#137298`
- `--green-text`: `#00834A`
- `--on-accent`: `#0E1A1F`
- `--danger`: `#D92D20`
- `--warning`: `#B54708`
- `--shadow-hard`: `3px 3px 0 var(--ink)`
- `--shadow-hard-sm`: `2px 2px 0 var(--ink)`
- `--shadow-hard-pressed`: `1px 1px 0 var(--ink)`

### Dark Theme (`[data-theme="dark"]`)
- `--paper`: `#0E1A1F`
- `--surface`: `#15262D`
- `--ink`: `#EAF4F1`
- `--muted`: `#96AAB0`
- `--line`: `#3D525A` (calibrated border tint)
- `--blue`: `#46BAEB`
- `--green`: `#00BF63`
- `--blue-text`: `#46BAEB`
- `--green-text`: `#00BF63`
- `--on-accent`: `#0E1A1F`
- `--danger`: `#F97066`
- `--warning`: `#FDB022`
- `--shadow-hard`: `3px 3px 0 #000000`
- `--shadow-hard-sm`: `2px 2px 0 #000000`

### Corner Radii
- `--radius-sk-sm`: `4px`
- `--radius-sk`: `6px`
- `--radius-sk-lg`: `8px`
- `.sketch-border`: `255px 15px 225px 15px / 15px 225px 15px 255px` (irregular hand-drawn organic radius for pills/badges)

---

## 3. WCAG Contrast Compliance Table

Computed via `scripts/contrast_check.py` adhering to WCAG 2.1 relative luminance standards:

| Token Pair | Element Type | Light Contrast | Dark Contrast | WCAG Requirement | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ink` on `paper` | Body / Headings | 16.82:1 | 15.77:1 | >= 4.5:1 | **PASS** |
| `ink` on `surface` | Card / Dialog text | 17.70:1 | 13.89:1 | >= 4.5:1 | **PASS** |
| `muted` on `paper` | Secondary text | 5.95:1 | 7.31:1 | >= 4.5:1 | **PASS** |
| `muted` on `surface` | Secondary text | 6.27:1 | 6.44:1 | >= 4.5:1 | **PASS** |
| `blue-text` on `paper` | Text links | 5.13:1 | 7.99:1 | >= 4.5:1 | **PASS** |
| `blue-text` on `surface` | Text links | 5.40:1 | 7.04:1 | >= 4.5:1 | **PASS** |
| `green-text` on `paper` | Success text | 4.59:1 | 7.28:1 | >= 4.5:1 | **PASS** |
| `green-text` on `surface` | Success text | 4.83:1 | 6.41:1 | >= 4.5:1 | **PASS** |
| `danger` on `paper` | Destructive labels | 4.59:1 | 6.35:1 | >= 4.5:1 | **PASS** |
| `danger` on `surface` | Destructive labels | 4.83:1 | 5.60:1 | >= 4.5:1 | **PASS** |
| `warning` on `paper` | Warning badges | 5.16:1 | 9.62:1 | >= 4.5:1 | **PASS** |
| `warning` on `surface` | Warning badges | 5.43:1 | 8.47:1 | >= 4.5:1 | **PASS** |
| `on-accent` on `blue` | Tool button icons/text | 7.99:1 | 7.99:1 | >= 4.5:1 | **PASS** |
| `on-accent` on `green` | CTA button icons/text | 7.28:1 | 7.28:1 | >= 4.5:1 | **PASS** |
| `line` on `paper` / `surface` | UI borders & dividers | 16.82:1 | 2.15:1 | >= 1.5:1 | **PASS** |

---

## 4. Typography Rules

- **Excalifont** (`font-hand`): Headings, button text, labels, tab titles, tooltips, and digital clock digits.
- **Virgil**: Local offline fallback font.
- **System-UI** (`font-sans`): Text the user types or reads in bulk (form inputs, URL fields, paragraphs, numeric fields, search inputs) to guarantee readability and crisp rendering.
- **Monospace** (`font-mono`): Coordinate badges, shortcuts `<kbd>`, and code spans.

---

## 5. Component Recipes

### Primary Button (Confirmation / Call-to-Action)
```tsx
<button className="h-8 px-3.5 rounded-sk bg-brand-green text-on-accent border-2 border-line shadow-hard font-hand font-bold text-xs hover:brightness-105 active:translate-x-[2px] active:translate-y-[2px] active:shadow-hard-pressed transition-all">
  Done
</button>
```

### Active Tool / Icon Button
```tsx
<button className="w-8 h-8 rounded-sk bg-brand-blue text-on-accent border-2 border-line shadow-hard-sm active-tilt">
  <Pencil className="w-4 h-4" />
</button>
```

### Paper Panel / Card
```tsx
<div className="bg-surface text-ink border-2 border-line shadow-hard rounded-sk-lg p-4">
  ...
</div>
```

### Organic Sketch Tag
```tsx
<span className="px-2 py-0.5 text-[10px] font-hand font-bold uppercase tracking-wider border-2 border-line sketch-border bg-paper text-ink">
  Badge
</span>
```

---

## 6. Do's and Don'ts

| Do | Don't |
| :--- | :--- |
| Use 2px solid ink borders (`border-2 border-line`). | Don't use soft, blurry drop shadows (`shadow-xl`, `shadow-2xl`). |
| Use hard offset shadows (`shadow-hard: 3px 3px 0 var(--ink)`). | Don't use `backdrop-blur-*` anywhere except the Wallpaper dock. |
| Use `--on-accent` (`#0E1A1F`) text on blue/green fills. | Never use white text on blue or green fills (fails contrast). |
| Tilt small selected icon buttons 2-3 degrees (`active-tilt`). | Never tilt inputs, labels, cards, or text blocks. |
| Use solid `bg-surface` and `bg-paper`. | Don't use translucent white app chrome (`bg-white/80`, `bg-white/95`). |
| Use `lucide-react` icons. | Don't use emojis as interface icons. |
| Respect `prefers-reduced-motion` (disable tilt/transforms). | Don't add heavy animations or long transitions. |
