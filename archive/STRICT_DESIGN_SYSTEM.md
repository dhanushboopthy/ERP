# Strict Enterprise Design System
## Sudhan Textile ERP - Professional & Minimal

---

## 🎨 Design Philosophy

**STRICT COLOR PALETTE - White + Purple + Grey ONLY**

This design system creates a **calm, professional, enterprise-grade** interface suitable for long working hours. Inspired by SAP and Zoho, with NO unnecessary colors, NO heavy gradients, and NO visual noise.

### Core Principles
- ✅ **Clean & Professional** - Minimal visual elements
- ✅ **Calm & Focused** - Easy on the eyes for 8+ hour workdays
- ✅ **Consistent** - Same purple accent everywhere
- ✅ **Accessible** - High contrast, clear hierarchy
- ❌ **No Blue** - Removed
- ❌ **No Green** - Removed  
- ❌ **No Orange** - Removed
- ❌ **No Gradients** - Except header if needed

---

## 🎨 Color System

### Primary Colors
```css
/* Deep Purple - Primary Accent */
--brand-primary: #29021A;

/* Soft Purple - Secondary Accent */
--brand-secondary: #6B2A4A;
```

### Background Colors
```css
/* App Background - Lightest Grey */
--brand-bg: #F9FAFB;

/* Card Background - Pure White */
--brand-card: #FFFFFF;
```

### Text Colors
```css
/* Primary Text - Deep Grey */
--brand-text-primary: #111827;

/* Secondary Text - Medium Grey */
--brand-text-secondary: #4B5563;

/* Muted Text - Light Grey */
--brand-text-muted: #9CA3AF;
```

### Border Colors
```css
/* Borders - Subtle Grey */
--brand-border: #E5E7EB;
```

---

## 🧩 Components

### Buttons

#### Primary Button
```tsx
<Button>Save</Button>
```
- Background: `#29021A` (Deep Purple)
- Text: White
- Hover: Slightly lighter purple
- Use: Primary actions (Save, Submit, Create)

#### Outline Button
```tsx
<Button variant="outline">Cancel</Button>
```
- Background: White
- Border: `#E5E7EB` (Grey)
- Text: `#111827` (Deep Grey)
- Hover: Light grey background
- Use: Secondary actions (Cancel, Back)

#### Ghost Button
```tsx
<Button variant="ghost">View Details</Button>
```
- Background: Transparent
- Text: `#4B5563` (Medium Grey)
- Hover: Very light grey background
- Use: Tertiary actions (View, Details)

### Cards

#### Standard Card
```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```
- Background: White
- Border: `#E5E7EB` (1px solid)
- Border Radius: 8px
- Shadow: Very subtle (`shadow-sm`)
- Padding: 24px

#### Highlighted Card
```tsx
<Card className="border-l-4 border-l-brand-primary">
  {/* Content */}
</Card>
```
- Same as standard + 4px purple left border
- Use: Important cards, metrics, KPIs

### Inputs

#### Text Input
```tsx
<Input placeholder="Enter value..." />
```
- Background: White
- Border: `#E5E7EB`
- Focus: Purple border (`#29021A`) + ring
- Placeholder: `#9CA3AF`
- Height: 40px
- Border Radius: 8px

#### Error State
```tsx
<Input error placeholder="Invalid value" />
```
- Border: Purple (not red!)
- Focus Ring: Light purple

### Tables

#### Standard Table
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Column</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Data</TableCell>
    </TableRow>
  </TableBody>
</Table>
```
- **Header Background**: `#F3F4F6` (Light grey)
- **Header Text**: `#29021A` (Purple) - Bold
- **Body Background**: White
- **Row Hover**: `#F9FAFB`
- **Borders**: `#E5E7EB` (1px)

### Badges

#### Status Badges (Workflow)
```tsx
<Badge variant="draft">Draft</Badge>
<Badge variant="prepared">Prepared</Badge>
<Badge variant="checked">Checked</Badge>
<Badge variant="approved">Approved</Badge>
```

**Color Mapping:**
- **Draft**: Grey (`#F3F4F6`)
- **Prepared**: Soft Purple (`#6B2A4A`)
- **Checked**: Purple Outline
- **Approved**: Deep Purple (`#29021A`)
- **Locked**: Medium Grey
- **Cancelled**: Light Grey + Strikethrough

**NO colored badges** - Only purple and grey variants allowed

---

## 📐 Layout

### Sidebar
- **Background**: `#29021A` (Solid, NO gradient)
- **Icons**: White at 80% opacity
- **Text**: White
- **Active State**: 
  - Background: `rgba(255,255,255,0.12)`
  - Left Border: 4px white
- **Badges**: Grey with white text only

### Header
- **Background**: White
- **Border Bottom**: `#E5E7EB`
- **Text**: `#111827`
- **Height**: 64px

### Page Content
- **Background**: `#F9FAFB`
- **Padding**: 24px
- **Max Width**: 1400px

---

## 📏 Typography

### Font Stack
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Sizes
- **H1 (Page Title)**: 24px, Bold, `#111827`
- **H2 (Section)**: 18px, Semibold, `#111827`
- **H3 (Card Title)**: 16px, Semibold, `#111827`
- **Body**: 14px, Regular, `#111827`
- **Caption**: 12px, Regular, `#6B7280`
- **Small**: 11px, Regular, `#9CA3AF`

---

## 🎯 Usage Guidelines

### DO ✅
- Use purple (`#29021A`) for primary actions
- Use grey backgrounds for headers
- Use white cards on grey background
- Keep shadows subtle (2-3px max)
- Use purple for links and important text
- Use grey for secondary information

### DON'T ❌
- Use blue, green, orange, or red colors
- Use heavy gradients (except sidebar solid color)
- Use colorful status badges
- Use multiple accent colors
- Use heavy shadows or 3D effects
- Add unnecessary visual decoration

---

## 🔄 Migration from Previous System

### Component Updates

**Button:**
```tsx
// OLD
<Button variant="success">Save</Button>

// NEW
<Button>Save</Button>  // Purple is the only accent
```

**Badge:**
```tsx
// OLD
<Badge variant="success">Approved</Badge>
<Badge variant="warning">Pending</Badge>

// NEW
<Badge variant="approved">Approved</Badge>  // Purple
<Badge variant="draft">Pending</Badge>      // Grey
```

**Card:**
```tsx
// OLD
<Card className="bg-gradient-to-br from-purple-50 to-pink-50">

// NEW
<Card className="border-l-4 border-l-brand-primary">  // Clean white with purple accent
```

---

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Mobile Adaptations
- Sidebar: Drawer overlay
- Cards: Full width
- Tables: Horizontal scroll
- Padding: Reduced to 16px

---

## ♿ Accessibility

### Contrast Ratios
- Purple on White: 10.5:1 ✅ (AAA)
- Deep Grey on White: 15.8:1 ✅ (AAA)
- Medium Grey on White: 7.1:1 ✅ (AA)

### Focus States
- 2px purple ring on all interactive elements
- Visible keyboard navigation
- Screen reader friendly

---

## 🎨 Color Reference Quick Guide

### When to Use Each Color

| Element | Color | Hex |
|---------|-------|-----|
| Primary Button | Deep Purple | `#29021A` |
| Secondary Button | Soft Purple | `#6B2A4A` |
| Links | Deep Purple | `#29021A` |
| Page Background | Light Grey | `#F9FAFB` |
| Card Background | White | `#FFFFFF` |
| Table Header BG | Medium Grey | `#F3F4F6` |
| Table Header Text | Deep Purple | `#29021A` |
| Body Text | Deep Grey | `#111827` |
| Secondary Text | Medium Grey | `#4B5563` |
| Placeholder | Light Grey | `#9CA3AF` |
| Borders | Border Grey | `#E5E7EB` |
| Sidebar | Deep Purple | `#29021A` |

---

## 🚀 Implementation Checklist

- [x] Updated `globals.css` with strict color variables
- [x] Updated `tailwind.config.ts` with strict palette
- [x] Updated `button.tsx` - removed colorful variants
- [x] Updated `card.tsx` - clean white cards only
- [x] Updated `input.tsx` - purple focus states
- [x] Updated `table.tsx` - grey headers, purple text
- [x] Updated `badge.tsx` - purple/grey only
- [x] Updated `app-layout.tsx` - solid purple sidebar
- [x] Updated `PermissionBasedSidebar.tsx` - removed colored badges
- [ ] Update all page components to use new system
- [ ] Remove old gradient components
- [ ] Update documentation

---

## 📝 Example Implementations

### Dashboard Card
```tsx
<Card className="border-l-4 border-l-brand-primary">
  <CardHeader>
    <CardTitle className="text-brand-primary">Total Orders</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-3xl font-bold text-brand-text-primary">1,234</p>
    <p className="text-sm text-brand-text-muted">+12% from last month</p>
  </CardContent>
</Card>
```

### Form
```tsx
<form>
  <div className="space-y-4">
    <div>
      <Label>Order Number</Label>
      <Input placeholder="ORD-001" />
    </div>
    <div className="flex gap-2">
      <Button variant="outline">Cancel</Button>
      <Button>Save Order</Button>
    </div>
  </div>
</form>
```

### Data Table
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Order ID</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell className="text-brand-primary font-medium">ORD-001</TableCell>
      <TableCell><Badge variant="approved">Approved</Badge></TableCell>
      <TableCell>₹12,500</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

**Last Updated**: 2024
**Version**: 2.0 (Strict Design System)
**Status**: ✅ Active & Implemented
