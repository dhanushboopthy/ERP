# Professional UI Components

Enterprise-grade UI components following the ERP's professional design system.

## Components Included

### 1. ProfessionalAccountMenu
A professional account dropdown menu with user profile and settings links.

**Features:**
- Clean header with user name and email
- Icon-text combination for clarity
- Profile Settings navigation
- System Settings navigation
- Red logout action for emphasis
- Smooth hover transitions
- Fully accessible

**Usage:**
```tsx
import { ProfessionalAccountMenu } from '@/components/shared/professional-account-menu';

// In your header/navbar
<ProfessionalAccountMenu />
```

**Preview:**
```
┌─────────────────────────┐
│ John Doe               │
│ john@example.com       │
├─────────────────────────┤
│ 👤 Profile Settings    │
│ ⚙️  System Settings    │
├─────────────────────────┤
│ 🚪 Logout              │
└─────────────────────────┘
```

---

### 2. ProfessionalStatusTabs
Status filter tabs with count badges for filtering documents by approval status.

**Features:**
- Active state with white background and blue text
- Optional count badges
- Smooth transitions
- Responsive design
- Accessible keyboard navigation

**Usage:**
```tsx
import { ProfessionalStatusTabs } from '@/components/shared/professional-status-tabs';

const [statusFilter, setStatusFilter] = useState('all');

<ProfessionalStatusTabs 
  activeTab={statusFilter}
  onTabChange={setStatusFilter}
  counts={{
    all: 150,
    draft: 12,
    pending: 8,
    authorized: 130
  }}
/>
```

**Custom Tabs:**
```tsx
<ProfessionalStatusTabs 
  activeTab={statusFilter}
  onTabChange={setStatusFilter}
  tabs={[
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
  ]}
  counts={{ all: 100, draft: 10, pending: 5, approved: 85 }}
/>
```

---

### 3. ProfessionalViewTabs
View filter tabs for different time-based or category-based views.

**Features:**
- Two style variants: Gradient and Flat
- Optional icons for visual clarity
- Active state with blue gradient or border
- Responsive and accessible

**Usage - Gradient Style (Default):**
```tsx
import { ProfessionalViewTabs } from '@/components/shared/professional-view-tabs';

const [activeView, setActiveView] = useState('all');

<ProfessionalViewTabs 
  activeView={activeView}
  onViewChange={setActiveView}
  showIcons={true}
/>
```

**Usage - Flat Style:**
```tsx
import { ProfessionalViewTabsFlat } from '@/components/shared/professional-view-tabs';

<ProfessionalViewTabsFlat 
  activeView={activeView}
  onViewChange={setActiveView}
/>
```

**Custom Views:**
```tsx
import { FileText, Clock, CheckCircle } from 'lucide-react';

<ProfessionalViewTabs 
  activeView={activeView}
  onViewChange={setActiveView}
  views={[
    { value: 'all', label: 'All Documents', icon: FileText },
    { value: 'recent', label: 'Recent', icon: Clock },
    { value: 'complete', label: 'Complete', icon: CheckCircle },
  ]}
/>
```

---

## Design Principles

### Colors
- **Primary Blue**: `#2563eb` (blue-600)
- **Active Background**: White with shadow
- **Inactive Background**: `slate-50` to `slate-100`
- **Hover**: Subtle background change
- **Text**: `slate-700` normal, `blue-700` active

### Spacing
- Padding: `px-4 py-2` (horizontal 16px, vertical 8px)
- Gap: `gap-1` to `gap-2` (4px to 8px)
- Border Radius: `rounded-lg` or `rounded-md`

### Typography
- Font Size: `text-sm` (14px)
- Font Weight: `font-medium` (500)
- Active: `font-semibold` (600)

### Shadows
- Active: `shadow-sm` (subtle)
- Hover: `shadow-sm` on inactive items
- Menu: `shadow-lg` for dropdowns

### Transitions
- Duration: `200ms`
- Properties: Background, color, shadow
- Easing: Default (ease-in-out)

---

## Professional Design Guidelines

### ✅ DO:
- Use consistent spacing across all components
- Maintain visual hierarchy (active > hover > default)
- Include proper focus states for accessibility
- Use subtle transitions (200ms max)
- Keep colors professional (blue, slate, white)
- Show clear active states

### ❌ DON'T:
- Use flashy animations or effects
- Over-emphasize inactive states
- Mix multiple color schemes
- Use heavy shadows or gradients everywhere
- Forget accessibility (keyboard navigation, ARIA)

---

## Accessibility

All components include:
- `aria-current` for active tabs
- `aria-label` for icon-only buttons
- Keyboard navigation support
- Focus-visible rings
- Semantic HTML
- Proper contrast ratios

---

## Integration Example

Complete page example:

```tsx
'use client';

import { useState } from 'react';
import { ProfessionalAccountMenu } from '@/components/shared/professional-account-menu';
import { ProfessionalStatusTabs } from '@/components/shared/professional-status-tabs';
import { ProfessionalViewTabs } from '@/components/shared/professional-view-tabs';

export default function DocumentsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [view, setView] = useState('all');

  return (
    <div className="space-y-6 p-6">
      {/* Header with Account Menu */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
        <ProfessionalAccountMenu />
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-4">
        <ProfessionalViewTabs 
          activeView={view}
          onViewChange={setView}
        />
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-600">Filter by status:</span>
        <ProfessionalStatusTabs 
          activeTab={statusFilter}
          onTabChange={setStatusFilter}
          counts={{
            all: 150,
            draft: 12,
            pending: 8,
            authorized: 130
          }}
        />
      </div>

      {/* Your content here */}
    </div>
  );
}
```

---

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Maintenance

When updating these components:
1. Maintain the professional, enterprise-grade aesthetic
2. Test accessibility with keyboard navigation
3. Verify responsive behavior on mobile
4. Ensure consistency with the design system
5. Update this documentation

---

**Last Updated:** February 9, 2026  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
