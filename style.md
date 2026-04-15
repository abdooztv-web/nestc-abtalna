# NESTEC Admin Portal — Design System

## Brand Identity
- **Product:** Nestec Admin Engine (Background Verification Portal)
- **Partners:** NESTC × Abtalna
- **Tone:** Professional, secure, data-dense but clean

---

## Color Palette (Material Design 3 — Tonal Surface System)

| Token | Hex | Usage |
|---|---|---|
| `primary` | `#006184` | CTAs, active nav, links |
| `primary-container` | `#007ba7` | Button bg, icon bg |
| `primary-fixed` | `#c4e7ff` | Light badge bg, progress fill |
| `primary-fixed-dim` | `#7cd0ff` | Inverse primary accents |
| `on-primary` | `#ffffff` | Text on primary bg |
| `secondary` | `#49626c` | Secondary text, progress |
| `secondary-container` | `#cce7f3` | Secondary badge bg |
| `tertiary` | `#834d00` | Warnings, high-priority labels |
| `tertiary-container` | `#a36410` | Warning bg |
| `tertiary-fixed` | `#ffdcbc` | Awaiting doc badge bg |
| `surface` | `#f7f9ff` | Page background |
| `surface-bright` | `#f7f9ff` | Panel bg |
| `surface-container-lowest` | `#ffffff` | Card / table bg |
| `surface-container-low` | `#f1f4fa` | Sidebar bg, subtle card |
| `surface-container` | `#ebeef4` | Section bg |
| `surface-container-high` | `#e5e8ee` | Hover state |
| `surface-container-highest` | `#dfe3e8` | Dividers, table header |
| `on-surface` | `#181c20` | Primary body text |
| `on-surface-variant` | `#3f484e` | Secondary / muted text |
| `outline` | `#6f787f` | Borders, dividers |
| `outline-variant` | `#bfc8cf` | Subtle borders |
| `error` | `#ba1a1a` | Error states |
| `inverse-surface` | `#2d3135` | Dark card (client breakdown) |
| `inverse-on-surface` | `#eef1f7` | Text on dark card |

---

## Typography

**Font:** `Inter` (Google Fonts) — applied globally

| Style | Class Example |
|---|---|
| Page Heading | `text-xl font-extrabold tracking-tight text-on-surface` |
| Metric Number | `text-4xl font-black tracking-tighter` |
| Label / Nav Item | `font-['Inter'] uppercase tracking-wider text-[11px] font-bold` |
| Body | `text-sm font-medium text-on-surface` |
| Muted / Caption | `text-xs text-on-surface-variant` |
| Mono ID | `text-[10px] text-on-surface-variant/70 font-mono uppercase` |

---

## Icons

**Library:** [Material Symbols Outlined](https://fonts.google.com/icons)
```html
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1" rel="stylesheet"/>
```
Usage:
```html
<span class="material-symbols-outlined">dashboard</span>
```
Custom weight:
```css
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
```

---

## Key Components

### Sidebar Navigation
- **Width:** `w-64` (256px), fixed, full height
- **Background:** `bg-[#f1f4fa]`
- **Active item:** `bg-white border-r-4 border-[#007BA7] shadow-sm translate-x-1`
- **Inactive item:** hover `bg-[#e5e8ee]`

### Top Header
- **Background:** `bg-[#f7f9ff]`, height `h-16`, sticky
- Search bar with `pl-10` for icon offset
- Notifications bell with red dot indicator

### Stat Cards (Bento Grid)
- `bg-surface-container-lowest p-6 rounded-xl`
- Hover transforms: `group-hover:bg-primary-container` → text turns white
- Metric: `text-4xl font-black tracking-tighter`
- Sub-label: `text-[11px] uppercase tracking-widest font-bold text-on-surface-variant`

### Tables
- Container: `bg-surface-container-lowest rounded-xl overflow-hidden`
- Header row: `bg-surface-container-low`
- Header cell: `text-[11px] font-bold uppercase tracking-widest text-on-surface-variant`
- Row hover: `hover:bg-surface-container-low/50 transition-colors`
- Dividers: `divide-y divide-outline-variant/10`

### Status Badges
```html
<!-- Processing -->
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-fixed text-primary">Processing</span>
<!-- New Request -->
<span class="... bg-surface-container-high text-on-surface-variant">New Request</span>
<!-- Awaiting Docs -->
<span class="... bg-tertiary-fixed text-tertiary">Awaiting Documentation</span>
<!-- Finalizing -->
<span class="... bg-secondary-container text-secondary">Finalizing</span>
<!-- In Progress -->
<span class="... bg-primary-fixed text-primary">In Progress</span>
<!-- Completed -->
<span class="... bg-secondary-container text-secondary">Completed</span>
```

### Buttons
```html
<!-- Primary CTA -->
<button class="precision-gradient text-white px-4 py-2 text-[11px] font-bold uppercase tracking-widest rounded flex items-center gap-2">
<!-- Secondary -->
<button class="bg-surface-container-high px-4 py-2 text-[11px] font-bold uppercase tracking-widest hover:bg-surface-container-highest transition-colors rounded">
<!-- Danger -->
<button class="hover:bg-error hover:text-white hover:border-error transition-all">
```

### Floating Action Bar (Glassmorphic)
```css
.glass-panel {
  background: rgba(223, 227, 232, 0.7);
  backdrop-filter: blur(20px);
}
```
Fixed bottom center, `rounded-full`, `shadow-2xl`

### Activity Feed (Timeline)
- Circular icon badges per event type
- Vertical connector line: `w-px h-full bg-outline-variant mt-2`
- Timestamp: `text-[10px] text-outline mt-1 uppercase font-bold`

---

## Layout Structure

```
┌──────────────────────────────────────────────────────┐
│  Sidebar (fixed w-64)  │  Header (sticky h-16)        │
│                        ├──────────────────────────────│
│  Logo + Brand           │  Main Content Canvas         │
│  Nav Items              │  (p-8 max-w-[1600px] mx-auto)│
│  ─────────              │                              │
│  Support / Sign Out     │                              │
└────────────────────────────────────────────────────── ┘
```

---

## Gradients & Special Classes

```css
.precision-gradient {
  background: linear-gradient(135deg, #006184 0%, #007ba7 100%);
}
.glass-panel {
  background: rgba(223, 227, 232, 0.7);
  backdrop-filter: blur(20px);
}
```

---

## Border Radius

| Token | Value |
|---|---|
| `DEFAULT` | `0.125rem` |
| `lg` | `0.25rem` |
| `xl` | `0.5rem` |
| `full` | `0.75rem` |

Note: For pills and badges use `rounded-full`. For cards use `rounded-xl`.
