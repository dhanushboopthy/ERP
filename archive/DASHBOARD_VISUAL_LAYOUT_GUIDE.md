# 📐 Executive Dashboard - Visual Layout Guide

## 🎨 Complete Visual Structure

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     EXECUTIVE SUMMARY (White Header)                        │
│  ┌──────────────────────────────────┬──────────────────────────────────┐  │
│  │ Executive Dashboard               │  🟢 All Systems Operational      │  │
│  │ Thursday, 26 December 2025        │  📅 FY 2024-25  🔄 Refresh       │  │
│  └──────────────────────────────────┴──────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                          CRITICAL KPIs (LARGE)                              │
│  ════════════════════════════════════════════════════                      │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ 📦 +5.2% ↑   │  │ 🏭 +8.5% ↑   │  │ 📋 +12% ↑    │  │ 💰 -8.3% ↓   │  │
│  │              │  │              │  │              │  │              │  │
│  │ TOTAL YARN   │  │ TODAY'S      │  │ ACTIVE SETS  │  │ PENDING      │  │
│  │ STOCK        │  │ PRODUCTION   │  │              │  │ INVOICES     │  │
│  │              │  │              │  │              │  │              │  │
│  │   45,678.5   │  │   98,500     │  │      8       │  │ ₹1,56,780    │  │
│  │      kg      │  │   meters     │  │    sets      │  │              │  │
│  │              │  │              │  │              │  │              │  │
│  │ vs yesterday │  │ vs yesterday │  │ vs last week │  │  reduction   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                                             │
│  ══ text-4xl font-bold ══ Blue Icon Backgrounds ══ Green/Red Badges ══     │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                      OPERATIONAL KPIs (MEDIUM - QUIETER)                    │
│  ────────────────────────────────────────                                  │
│                                                                             │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐      │
│  │ 📝     │ │ 👥     │ │ 🚚     │ │ ⏱️      │ │ 🎯     │ │ 📊     │      │
│  │        │ │        │ │        │ │        │ │        │ │        │      │
│  │   12   │ │   47   │ │    6   │ │  4.2   │ │  94.5  │ │  48.5  │      │
│  │entries │ │        │ │        │ │  hrs   │ │   %    │ │   L    │      │
│  │        │ │        │ │        │ │        │ │        │ │        │      │
│  │ Today's│ │ Active │ │Pending │ │  Avg   │ │Effici- │ │  MTD   │      │
│  │Receipts│ │Parties │ │Deliver.│ │Set Time│ │  ency  │ │Revenue │      │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘      │
│                                                                             │
│  ══ text-2xl font-bold ══ Gray Icon Backgrounds ══ Left-aligned ══         │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                      ANALYTICS & ACTIONS (TWO COLUMNS)                      │
│                                                                             │
│  LEFT COLUMN (2/3 Width)              RIGHT COLUMN (1/3 Width)             │
│  ┌────────────────────────────────┐  ┌──────────────────────────────┐     │
│  │ 📊 WEEKLY PRODUCTION TREND     │  │ 🟠 ACTION REQUIRED       (8) │     │
│  │ ───────────────────────────    │  │ ────────────────────────     │     │
│  │ This Week                      │  │                              │     │
│  │                                │  │  ┌──┬─────────────┬──────┐  │     │
│  │      ███                       │  │  │8 │ Invoices    │ 2    │  │     │
│  │      ███   ███   ███           │  │  └──┴─────────────┴──────┘  │     │
│  │  ███ ███   ███   ███   ███     │  │  ┌──┬─────────────┬──────┐  │     │
│  │  ███ ███   ███   ███   ███ ███ │  │  │5 │ Job Cards   │ 1    │  │     │
│  │  ███ ███   ███   ███   ███ ███ │  │  └──┴─────────────┴──────┘  │     │
│  │  ███ ███   ███   ███   ███ ▓▓▓ │  │  ┌──┬─────────────┬──────┐  │     │
│  │  Mon Tue   Wed   Thu   Fri Sat │  │  │3 │ Yarn Returns│      │  │     │
│  │                                │  │  └──┴─────────────┴──────┘  │     │
│  │ 🟢 Above  🟠 Below  ▓ Target   │  │                              │     │
│  └────────────────────────────────┘  │  [ Review All ]              │     │
│                                       └──────────────────────────────┘     │
│  ┌────────────────────────────────┐  ┌──────────────────────────────┐     │
│  │ RECENT PRODUCTION JOBS         │  │ 🔵 BEAM UTILIZATION          │     │
│  │ Latest sizing sets in factory  │  │ ────────────────────────     │     │
│  │ ─────────────────────── View →│  │                              │     │
│  │                                │  │  Total Beams           150   │     │
│  │ SET NO     DATE     PARTY  M  │  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓       │     │
│  │ ────────────────────────────  │  │                              │     │
│  │ SET/145  17-Dec  Rajesh  12K │  │  ┌────┐  ┌────┐  ┌────┐     │     │
│  │ SET/144  16-Dec  Krishna  8K │  │  │ 45 │  │ 98 │  │  7 │     │     │
│  │ SET/143  16-Dec  Lakshmi 15K │  │  │🟢  │  │🔵  │  │🟠  │     │     │
│  │ SET/142  15-Dec  Sakthi  11K │  │  │Avl │  │Use │  │Mnt │     │     │
│  │ SET/141  15-Dec  Vinayaka 9K │  │  └────┘  └────┘  └────┘     │     │
│  └────────────────────────────────┘  └──────────────────────────────┘     │
│                                       ┌──────────────────────────────┐     │
│                                       │ 🔴 LOW STOCK ALERTS      (3) │     │
│                                       │ ────────────────────────     │     │
│                                       │                              │     │
│                                       │ 40s 2/100      234.5 kg      │     │
│                                       │ LOT-A123    Min: 500 kg      │     │
│                                       │                              │     │
│                                       │ 60s 2/80       156.2 kg      │     │
│                                       │ LOT-B456    Min: 300 kg      │     │
│                                       │                              │     │
│                                       │ [ View Stock Ledger ]        │     │
│                                       └──────────────────────────────┘     │
│                                       ┌──────────────────────────────┐     │
│                                       │ 👥 TOP PARTIES (MTD)         │     │
│                                       │ ────────────────────────     │     │
│                                       │                              │     │
│                                       │ ① Rajesh Textiles  ₹12.5L   │     │
│                                       │ ② Krishna Mills    ₹9.8L    │     │
│                                       │ ③ Lakshmi Weaving  ₹8.7L    │     │
│                                       │ ④ Sakthi Looms     ₹7.2L    │     │
│                                       └──────────────────────────────┘     │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                            QUICK ACTIONS                                    │
│  ⚡ Quick Actions                                                          │
│  Common factory operations                                                 │
│  ────────────────────────────────────────────────────────────────────      │
│                                                                             │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐      │
│  │   📝   │ │   📋   │ │   📊   │ │   📦   │ │   💰   │ │   📈   │      │
│  │        │ │        │ │        │ │        │ │        │ │        │      │
│  │  Yarn  │ │ Warping│ │ Sizing │ │  Yarn  │ │Invoice │ │Reports │      │
│  │Receipt │ │        │ │  Set   │ │ Return │ │        │ │        │      │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘      │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 📱 Responsive Breakpoints

### Desktop (1920px max-width)
```
┌─────────────────────────────────────────────────────────────────┐
│ [────── Critical KPIs: 4 columns ──────]                        │
│ [────── Operational KPIs: 6 columns ──────]                     │
│ [── Analytics (2/3) ──] [─ Widgets (1/3) ─]                    │
│ [────── Quick Actions: 6 columns ──────]                        │
└─────────────────────────────────────────────────────────────────┘
```

### Tablet (768px - 1023px)
```
┌───────────────────────────────────────┐
│ [─── Critical KPIs: 2 columns ───]    │
│ [─── Operational: 3 columns ───]      │
│ [──── Analytics (full) ────]          │
│ [──── Widgets (full) ────]            │
│ [── Quick Actions: 4 columns ──]      │
└───────────────────────────────────────┘
```

### Mobile (< 768px)
```
┌──────────────────────┐
│ [─ Critical: 2 ─]    │
│ [─ Operational: 2 ─] │
│ [─── Stacked ───]    │
│ [─ Actions: 2 ─]     │
└──────────────────────┘
```

---

## 🎨 Color Usage Map

### Blue (#1E3A8A) - Reserved For:
- ✅ Page title
- ✅ Critical KPI icon backgrounds
- ✅ Section indicators
- ✅ Primary buttons
- ✅ Active states
- ✅ Links
- ✅ Top party #1 badge

### White (#FFFFFF) - Used For:
- ✅ Card backgrounds
- ✅ Header background
- ✅ Data surfaces
- ✅ Text on colored backgrounds

### Gray (#E5E7EB, #6B7280) - Used For:
- ✅ Borders
- ✅ Operational KPI icons
- ✅ Secondary text
- ✅ Subtle backgrounds
- ✅ Dividers

### Green (#22C55E) - Functional:
- ✅ Success indicators
- ✅ Above target bars
- ✅ Positive trends
- ✅ Available status

### Orange (#F97316) - Functional:
- ✅ Warnings
- ✅ Below target bars
- ✅ Action required indicators
- ✅ Maintenance status

### Red (#EF4444) - Functional:
- ✅ Alerts
- ✅ Critical stock levels
- ✅ Negative trends
- ✅ Urgent items

---

## 📏 Spacing & Sizing

### Critical KPI Cards
```
Size: Auto height with p-6 padding
Icon: 6x6 (h-6 w-6) in 3x3 padding container
Number: text-4xl font-bold
Badge: Small with border
Gap: 1.25rem (gap-5)
```

### Operational KPI Cards
```
Size: Auto height with p-4 padding
Icon: 4x4 (h-4 w-4) in 2x2 padding container
Number: text-2xl font-bold
Gap: 0.75rem (gap-3)
```

### Widgets
```
Header: pb-3 with border-b
Content: pt-4
Item padding: p-3
Gap: 1.5rem (gap-6)
```

### Quick Actions
```
Height: 6rem (h-24)
Icon: 6x6 (h-6 w-6)
Border: 2px (border-2)
Gap: 0.75rem (gap-3)
```

---

## 🎯 Visual Weight Distribution

```
Critical KPIs:     40% visual weight  ████████████████████
Operational KPIs:  20% visual weight  ██████████
Analytics:         25% visual weight  ████████████
Widgets:           10% visual weight  █████
Quick Actions:      5% visual weight  ██
```

---

## 🔤 Font Sizes by Element

| Element | Font Size | Font Weight | Line Height |
|---------|-----------|-------------|-------------|
| Page Title | 1.5rem (text-2xl) | 600 | 2rem |
| Critical KPI Value | 2.25rem (text-4xl) | 700 | 2.5rem |
| Operational KPI Value | 1.5rem (text-2xl) | 700 | 2rem |
| Section Heading | 0.875rem (text-sm) | 600 | 1.25rem |
| Card Title | 1rem (text-base) | 600 | 1.5rem |
| Body Text | 0.875rem (text-sm) | 500 | 1.25rem |
| Labels | 0.75rem (text-xs) | 600 | 1rem |
| Secondary Text | 0.75rem (text-xs) | 500 | 1rem |

---

## 🎭 Hover & Active States

### Critical KPI Cards
```css
Default: border-gray-200
Hover: shadow-md (subtle elevation)
Active: N/A (informational)
```

### Operational KPI Cards
```css
Default: border-gray-200
Hover: border-[#1E3A8A]/20 (subtle blue tint)
Active: N/A (informational)
```

### Quick Action Cards
```css
Default: border-gray-200
Hover: border-[#1E3A8A] + bg-blue-50/50
Active: Slight press effect
Cursor: pointer
```

### Table Rows
```css
Default: white background
Hover: bg-gray-50/50 (very subtle)
Active: N/A
```

### Buttons
```css
Primary: bg-blue-600 → hover:bg-blue-700
Secondary: border-gray-300 → hover:bg-gray-50
Danger: bg-red-600 → hover:bg-red-700
Warning: bg-orange-600 → hover:bg-orange-700
```

---

## ✅ Accessibility Checklist

- [x] **Contrast Ratios**
  - Text on white: 7:1+ (AAA)
  - Icons on backgrounds: 4.5:1+ (AA)
  - Buttons: 4.5:1+ (AA)

- [x] **Keyboard Navigation**
  - All interactive elements focusable
  - Logical tab order
  - Visible focus indicators

- [x] **Screen Readers**
  - Semantic HTML structure
  - ARIA labels where needed
  - Meaningful link text

- [x] **Motion**
  - No auto-playing animations
  - Respects prefers-reduced-motion
  - Static content by default

- [x] **Touch Targets**
  - Minimum 44x44px
  - Adequate spacing
  - No overlapping targets

---

This layout guide ensures **consistent, professional, industrial-grade ERP design** across all screen sizes! 🏭✨
