# ROUTE GUARD IMPLEMENTATION GUIDE

**Quick Reference**: Apply route protection to all 35+ protected pages

---

## PERMISSION MAPPING

### Masters Module (8 pages)

| Page | Path | Required Permission |
|------|------|---------------------|
| Parties | `/masters/parties` | `PARTY.VIEW` |
| Parties Create | `/masters/parties/new` | `PARTY.CREATE` |
| Yarn Counts | `/masters/yarn-counts` | `YARN_COUNT.VIEW` |
| Loom Types | `/masters/loom-types` | `LOOM_TYPE.VIEW` |
| Beams | `/masters/beams` | `BEAM.VIEW` |
| Vehicles | `/masters/vehicles` | `VEHICLE.VIEW` |
| Financial Years | `/masters/financial-years` | `FINANCIAL_YEAR.VIEW` |
| Sort Masters | `/masters/sort-masters` | `SORT_MASTER.VIEW` |

### Sizing Module (9 pages)

| Page | Path | Required Permission |
|------|------|---------------------|
| Yarn Receipt List | `/sizing/yarn-receipt` | `YARN_RECEIPT.VIEW` ✅ |
| Yarn Receipt Create | `/sizing/yarn-receipt/new` | `YARN_RECEIPT.CREATE` ✅ |
| Yarn Stock Ledger | `/sizing/yarn-stock-ledger` | `YARN_STOCK.VIEW` |
| Warping Job Card List | `/sizing/warping-job-card` | `WARPING.VIEW` |
| Warping Job Card Create | `/sizing/warping-job-card/new` | `WARPING.CREATE` |
| Sizing Job Card List | `/sizing/sizing-job-card` | `SIZING.VIEW` |
| Sizing Job Card Create | `/sizing/sizing-job-card/new` | `SIZING.CREATE` |
| Tax Invoice List | `/sizing/tax-invoice` | `TAX_INVOICE.VIEW` |
| Tax Invoice Create | `/sizing/tax-invoice/new` | `TAX_INVOICE.CREATE` |

### Reports Module (6 pages)

| Page | Path | Required Permission |
|------|------|---------------------|
| Yarn Stock Report | `/reports/yarn-stock` | `REPORTS.VIEW` |
| Set-wise Production | `/reports/set-wise-production` | `REPORTS.VIEW` |
| Beam Utilization | `/reports/beam-utilization` | `REPORTS.VIEW` |
| Party Ledger | `/reports/party-ledger` | `REPORTS.VIEW` |
| Invoice Register | `/reports/invoice-register` | `REPORTS.VIEW` |
| Pending Invoices | `/reports/pending-invoices` | `REPORTS.VIEW` |

### Settings Module (9 pages)

| Page | Path | Required Permission |
|------|------|---------------------|
| Users | `/settings/users` | `USER.VIEW` (Admin Only) |
| Roles | `/settings/roles` | `ROLE.VIEW` (Admin Only) |
| Audit Logs | `/settings/audit-logs` | `AUDIT.VIEW` (Admin Only) |
| System Settings | `/settings/system` | Admin Only |
| Backups | `/settings/backups` | Admin Only |
| Database | `/settings/database` | Admin Only |
| Email Config | `/settings/email` | Admin Only |
| Notifications | `/settings/notifications` | Admin Only |
| Profile | `/settings/profile` | Any authenticated user |

---

## IMPLEMENTATION PATTERN

### For List Pages (VIEW Permission)

```typescript
'use client';

import { RouteGuard } from '@/components/auth/RouteGuard';
// ... other imports

export default function PartyListPage() {
  return (
    <RouteGuard requiredPermission="PARTY.VIEW">
      <PartyListContent />
    </RouteGuard>
  );
}

function PartyListContent() {
  // Original page component code here
  return (
    <div>...</div>
  );
}
```

### For Create/Edit Pages (CREATE/EDIT Permission)

```typescript
'use client';

import { RouteGuard } from '@/components/auth/RouteGuard';
// ... other imports

export default function NewPartyPage() {
  return (
    <RouteGuard requiredPermission="PARTY.CREATE">
      <NewPartyForm />
    </RouteGuard>
  );
}

function NewPartyForm() {
  // Original form component code here
  return (
    <form>...</form>
  );
}
```

### For Admin-Only Pages

```typescript
'use client';

import { RouteGuard } from '@/components/auth/RouteGuard';
// ... other imports

export default function UsersPage() {
  return (
    <RouteGuard requireAdmin>
      <UsersContent />
    </RouteGuard>
  );
}

function UsersContent() {
  // Admin-only content here
  return (
    <div>...</div>
  );
}
```

### For Public/Dashboard Pages (No Guard Needed)

```typescript
// Dashboard is accessible to all authenticated users
// No RouteGuard needed - handled by AppLayout authentication check

export default function DashboardPage() {
  return (
    <div>...</div>
  );
}
```

---

## STEP-BY-STEP INSTRUCTIONS

### 1. Add Import Statement
At the top of the file (after other imports):

```typescript
import { RouteGuard } from '@/components/auth/RouteGuard';
```

### 2. Rename Default Export
Change:
```typescript
export default function PartyListPage() {
```

To:
```typescript
function PartyListContent() {
```

### 3. Add New Default Export with RouteGuard
```typescript
export default function PartyListPage() {
  return (
    <RouteGuard requiredPermission="PARTY.VIEW">
      <PartyListContent />
    </RouteGuard>
  );
}
```

### 4. Verify Permission String
Check `lib/navigation.ts` for the correct permission format:
- Module key: `PARTY`, `YARN_RECEIPT`, `WARPING`, etc.
- Action: `.VIEW`, `.CREATE`, `.EDIT`, `.DELETE`
- Combined: `PARTY.VIEW`, `YARN_RECEIPT.CREATE`, etc.

---

## BULK IMPLEMENTATION SCRIPT

### PowerShell Script to Find Unprotected Pages

```powershell
# Find all page.tsx files in protected routes
$protectedPaths = @(
    "frontend/src/app/(dashboard)/masters/**",
    "frontend/src/app/(dashboard)/sizing/**",
    "frontend/src/app/(dashboard)/reports/**",
    "frontend/src/app/(dashboard)/settings/**"
)

foreach ($path in $protectedPaths) {
    Get-ChildItem -Path $path -Filter "page.tsx" -Recurse | ForEach-Object {
        $content = Get-Content $_.FullName -Raw
        
        # Check if RouteGuard is already used
        if ($content -notmatch "RouteGuard") {
            Write-Host "❌ UNPROTECTED: $($_.FullName)" -ForegroundColor Red
        } else {
            Write-Host "✅ PROTECTED: $($_.FullName)" -ForegroundColor Green
        }
    }
}
```

---

## TESTING CHECKLIST

After applying RouteGuard to each page:

### Browser Testing
1. Login as **Operator** (limited permissions)
2. Try accessing protected pages via URL:
   - `/settings/users` → Should redirect to dashboard
   - `/masters/parties/new` → Should redirect if no CREATE permission
   - `/reports/yarn-stock` → Should allow if REPORTS.VIEW granted

3. Check browser console for:
   - No JavaScript errors
   - Redirect logs (if any)
   - Auth state logs

### TypeScript Compilation
```bash
npm run build
```
Should complete without errors.

### Permission Verification
For each protected page:
1. Verify correct permission string matches `navigation.ts`
2. Test with user who HAS permission → Page loads
3. Test with user who LACKS permission → Redirects
4. Test with logged-out user → Redirects to login

---

## PRIORITY ORDER FOR APPLICATION

### Phase 1: Critical (Apply Immediately)
1. ✅ Yarn Receipt List - DONE
2. ✅ Yarn Receipt Create - DONE
3. All Settings pages (Admin-only)
4. Warping/Sizing Job Card Create pages

### Phase 2: High Priority (Next)
1. All Masters create/edit pages
2. Remaining Sizing pages
3. Tax Invoice pages

### Phase 3: Standard (Final)
1. All Reports pages
2. Remaining list views
3. Detail/view pages

---

## COMMON MISTAKES TO AVOID

### ❌ Wrong: Permission Format Mismatch
```typescript
<RouteGuard requiredPermission="Party.View"> // ← lowercase
```

### ✅ Correct: Uppercase, Matches navigation.ts
```typescript
<RouteGuard requiredPermission="PARTY.VIEW">
```

---

### ❌ Wrong: Forgetting to Rename Component
```typescript
export default function PartyListPage() {
  return (
    <RouteGuard requiredPermission="PARTY.VIEW">
      <PartyListPage /> {/* ← Infinite recursion! */}
    </RouteGuard>
  );
}
```

### ✅ Correct: Renamed Internal Component
```typescript
export default function PartyListPage() {
  return (
    <RouteGuard requiredPermission="PARTY.VIEW">
      <PartyListContent />
    </RouteGuard>
  );
}

function PartyListContent() { ... }
```

---

### ❌ Wrong: Admin Check with Permission
```typescript
<RouteGuard requireAdmin requiredPermission="USER.VIEW">
```

### ✅ Correct: Use Only One
```typescript
<RouteGuard requireAdmin> {/* Admin implies all permissions */}
```

---

## VERIFICATION COMMAND

After applying all route guards:

```bash
# Count protected pages
grep -r "RouteGuard" frontend/src/app/(dashboard) --include="page.tsx" | wc -l

# Should be ~35+ files
```

---

## COMPLETION CHECKLIST

- [ ] All Masters pages protected (8 list + 8 create = 16)
- [ ] All Sizing pages protected (9 total)
- [ ] All Reports pages protected (6 total)
- [ ] All Settings pages protected (9 total)
- [ ] Browser testing completed
- [ ] Build succeeds without errors
- [ ] Permission strings verified against navigation.ts
- [ ] Role-based testing completed (Admin, Operator, Viewer)

**Total Pages to Protect**: ~40 pages  
**Currently Protected**: 2 pages (Yarn Receipt)  
**Remaining**: 38 pages

---

**Estimated Time**: 2-3 hours for bulk application + testing  
**Priority**: HIGH - Critical for production security
