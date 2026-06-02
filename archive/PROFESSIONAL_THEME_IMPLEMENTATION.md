# Professional White + Purple Theme - Implementation Guide

## ✅ Completed Transformations

### 1. **System Frame (Purple Structure)**

#### Top Header Bar
- **Background**: `#29021A` (Brand Purple)
- **Height**: 56px (14rem on mobile, consistent across breakpoints)
- **Text & Icons**: White
- **Features**:
  - Breadcrumb navigation (white text)
  - Financial year badge (white border & text)
  - User dropdown icon (white)
  - Mobile menu button (white)
- **File**: [`app-layout.tsx`](src/components/layout/app-layout.tsx#L535)

#### Sidebar (Maintained)
- **Background**: `#29021A`
- **Icons**: White at 80% opacity
- **Active State**: `rgba(255,255,255,0.18)` with 4px white left border
- **File**: [`PermissionBasedSidebar.tsx`](src/components/layout/PermissionBasedSidebar.tsx)

### 2. **Working Surface (White Content)**

#### Page Background
- **Color**: `#F6F7FB` (Subtle off-white)
- **Applied**: Body tag, main content area
- **Files**: 
  - [`globals.css`](src/app/globals.css#L85)
  - [`tailwind.config.ts`](tailwind.config.ts#L27)

#### Cards with Purple Accent
- **Background**: White
- **Border**: 1px solid `#E5E7EB`
- **Top Border**: **3px solid `#29021A`** (Purple accent)
- **Radius**: 14px
- **Shadow**: Subtle, enhanced on hover
- **Files**: 
  - [`card.tsx`](src/components/ui/card.tsx)
  - Utility class: `.card-brand` in [`globals.css`](src/app/globals.css#L493)

#### Form Sections
- **Background**: White
- **Border**: 1px solid `#E5E7EB`
- **Top Border**: **3px solid `#29021A`**
- **Title Color**: `#29021A`
- **File**: [`globals.css`](src/app/globals.css#L260-L272)

### 3. **Color Distribution**

```css
/* Primary Brand Purple */
--purple-primary: #29021A

/* Page Background */
--app-bg: #F6F7FB

/* Cards & Forms */
--card-bg: #FFFFFF

/* Borders */
--border-light: #E5E7EB

/* Text Hierarchy */
--text-primary: #111827
--text-secondary: #6B7280
--text-muted: #9CA3AF
```

### 4. **Button System**

#### Primary Button
```tsx
<Button>Save</Button>
```
- Background: `#29021A`
- Text: White
- Hover: `#3A0324`

#### Secondary Button
```tsx
<Button variant="secondary">Cancel</Button>
```
- Background: White
- Border: 1px solid `#29021A`
- Text: `#29021A`
- Hover: Light purple background

#### Ghost Button
```tsx
<Button variant="ghost">Details</Button>
```
- Text: `#29021A`
- Hover: `#F6F7FB` background

**File**: [`button.tsx`](src/components/ui/button.tsx)

### 5. **Form Inputs**

- **Background**: White
- **Default Border**: `#E5E7EB`
- **Focus Border**: `#29021A`
- **Focus Ring**: Purple with opacity
- **Label Color**: `#374151`
- **Required Indicator**: `#29021A` (was red)
- **Placeholder**: `#9CA3AF`
- **File**: [`input.tsx`](src/components/ui/input.tsx), [`label.tsx`](src/components/ui/label.tsx)

### 6. **Tables**

#### Header
- **Background**: `#F9FAFB`
- **Text**: `#29021A` (Purple, bold)

#### Rows
- **Background**: White
- **Hover**: `rgba(41,2,26,0.04)` (Subtle purple tint)
- **Borders**: `#E5E7EB`

**File**: [`table.tsx`](src/components/ui/table.tsx)

### 7. **Status Badges**

- **Active**: White background, purple border & text
- **Draft**: Grey background, grey text
- **Approved**: Purple text only (no background)
- **Locked**: Light grey
- **Cancelled**: Light grey with strikethrough

**All colorful variants removed** (no green, blue, orange, red)

**File**: [`badge.tsx`](src/components/ui/badge.tsx)

---

## 🎨 Design Philosophy

### Purple = Structure & Control
The purple brand color (`#29021A`) is used for:
- System frame elements (header, sidebar)
- Primary actions (buttons, links)
- Active states (navigation, focus)
- Visual hierarchy (card top borders, section titles)
- Critical indicators (required fields)

### White = Data & Work
White backgrounds are used for:
- Main content areas
- Cards and panels
- Forms and inputs
- Tables and data grids
- Working surfaces

---

## 📐 Visual Hierarchy

```
┌─────────────────────────────────────────┐
│ PURPLE HEADER (Brand Identity)          │ #29021A
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────────────┐      │
│  │ PURPLE ───────────────────── │      │ 3px accent
│  │                              │      │
│  │   WHITE CARD CONTENT         │      │ #FFFFFF
│  │                              │      │
│  └──────────────────────────────┘      │
│                                         │
│  Page Background: #F6F7FB              │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔧 Implementation Files

| Component | File Path | Key Change |
|-----------|-----------|------------|
| **Header** | `src/components/layout/app-layout.tsx` | Purple bg, white text |
| **Cards** | `src/components/ui/card.tsx` | 3px purple top border |
| **Buttons** | `src/components/ui/button.tsx` | Purple primary, outline secondary |
| **Inputs** | `src/components/ui/input.tsx` | Purple focus states |
| **Labels** | `src/components/ui/label.tsx` | Purple required marker |
| **Tables** | `src/components/ui/table.tsx` | Purple headers, subtle hover |
| **Badges** | `src/components/ui/badge.tsx` | Purple/grey only variants |
| **Global CSS** | `src/app/globals.css` | Purple variables, #F6F7FB background |
| **Tailwind Config** | `tailwind.config.ts` | Brand color tokens |

---

## 📱 Mobile Responsiveness

- Purple header maintained (56px)
- Sidebar collapses to drawer
- Cards stack vertically
- Purple top borders visible
- Same color rules apply

---

## ✨ Professional ERP Standards

This implementation follows:
- **SAP**: Structured purple/blue headers with white content areas
- **Oracle**: Clean white workspace with branded top bar
- **Zoho**: Professional color hierarchy with minimal decoration

### Key Differentiators:
✅ No colored page backgrounds  
✅ No heavy gradients  
✅ No bright accent colors  
✅ Calm, professional palette  
✅ Purple used strategically for structure  
✅ White for focus and data clarity  
✅ Suitable for 8-10 hour daily use  

---

## 🚀 Usage Examples

### Page with Cards
```tsx
<div className="space-y-6">
  <Card>
    <CardHeader>
      <CardTitle>Company Master</CardTitle>
    </CardHeader>
    <CardContent>
      {/* Form fields */}
    </CardContent>
  </Card>
</div>
```
Result: White card with 3px purple top border on #F6F7FB background

### Form Section
```tsx
<div className="form-section">
  <h3 className="form-section-title">Basic Details</h3>
  <div className="form-group">
    <Label required>Company Name</Label>
    <Input placeholder="Enter company name" />
  </div>
</div>
```
Result: White section with purple top border, purple title, purple required marker

### Data Table
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Order ID</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell className="text-brand-primary font-medium">ORD-001</TableCell>
      <TableCell><Badge variant="active">Active</Badge></TableCell>
    </TableRow>
  </TableBody>
</Table>
```
Result: Purple column headers, subtle purple row hover, white background

---

**Last Updated**: December 26, 2025  
**Version**: 3.0 (Professional Purple Theme)  
**Status**: ✅ Production Ready
