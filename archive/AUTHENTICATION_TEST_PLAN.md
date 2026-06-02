# Authentication & Route Protection Test Plan

**Test Date:** December 25, 2025  
**System:** Sudhan Textile ERP  
**Test Environment:** Development (localhost)

---

## ✅ Pre-Test Checklist

- [x] Backend running on http://localhost:5000
- [x] Frontend running on http://localhost:3000
- [x] RouteGuard applied to 38 pages
- [x] Database seeded with test users

---

## 🔐 Test Scenarios

### **1. Login & Authentication Flow**

#### Test 1.1: Admin Login
- **User:** admin / Admin@123
- **Expected:** 
  - ✅ Loading screen appears during /auth/me call
  - ✅ Successful login
  - ✅ Token stored in localStorage
  - ✅ Redirect to dashboard
  - ✅ All modules visible in sidebar

#### Test 1.2: Operator Login
- **User:** operator / Operator@123
- **Expected:**
  - ✅ Loading screen appears
  - ✅ Successful login
  - ✅ Limited modules in sidebar (only assigned permissions)
  - ✅ "Coming Soon" items hidden (not admin)

#### Test 1.3: Invalid Credentials
- **User:** invalid / wrongpassword
- **Expected:**
  - ❌ Login fails with error message
  - ❌ No token stored
  - ❌ Stays on login page

---

### **2. Route Protection Tests**

#### Test 2.1: Unauthorized Direct URL Access (Not Logged In)
**Test URLs:**
```
http://localhost:3000/sizing/yarn-receipt
http://localhost:3000/reports/party-ledger
http://localhost:3000/settings/users
```

**Expected:**
- ✅ RouteGuard detects no auth
- ✅ Redirects to /login
- ✅ Shows "Unauthorized access" or redirects silently

#### Test 2.2: Unauthorized Direct URL Access (Logged In - Insufficient Permission)
**Scenario:** Login as Operator (limited permissions)  
**Test URLs:**
```
http://localhost:3000/settings/users (admin-only)
http://localhost:3000/settings/audit-logs (admin-only)
http://localhost:3000/masters/company (admin-only)
```

**Expected:**
- ✅ RouteGuard detects insufficient permission
- ✅ Redirects to /dashboard
- ✅ Shows toast: "You don't have permission to access this page"

#### Test 2.3: Authorized Access
**Scenario:** Login as Admin  
**Test URLs:**
```
http://localhost:3000/settings/users
http://localhost:3000/sizing/yarn-receipt
http://localhost:3000/reports/invoice-register
```

**Expected:**
- ✅ RouteGuard allows access
- ✅ Page loads successfully
- ✅ No redirect

---

### **3. Sidebar Permission Filtering**

#### Test 3.1: Admin Sidebar
**Expected:**
- ✅ All modules visible
- ✅ "Coming Soon" items visible with badge
- ✅ All implemented modules enabled
- ✅ No items hidden

#### Test 3.2: Operator Sidebar
**Expected:**
- ✅ Only permitted modules visible
- ✅ "Coming Soon" items HIDDEN (not admin)
- ✅ Unpermitted modules HIDDEN (not just disabled)
- ✅ No access to Settings module

---

### **4. Session Management**

#### Test 4.1: Token Expiry
**Steps:**
1. Login successfully
2. Clear localStorage token manually (simulate expiry)
3. Navigate to protected page

**Expected:**
- ✅ RouteGuard detects invalid/missing token
- ✅ Auto-redirects to /login
- ✅ Shows session expired message

#### Test 4.2: Logout
**Steps:**
1. Login successfully
2. Click logout button

**Expected:**
- ✅ Token cleared from localStorage
- ✅ Redirect to /login
- ✅ Cannot access protected pages

---

### **5. API Integration Tests**

#### Test 5.1: Yarn Stock Report (No Mock Data)
**URL:** http://localhost:3000/sizing/yarn-stock

**Expected:**
- ✅ Calls API: `/dashboard/yarn-stock`
- ✅ NO fallback to mock data
- ✅ Displays real data from backend
- ✅ Shows loading state
- ✅ Shows error state if API fails (no silent fallback)

#### Test 5.2: Create Yarn Receipt
**URL:** http://localhost:3000/sizing/yarn-receipt/new

**Steps:**
1. Fill form with valid data
2. Submit

**Expected:**
- ✅ Calls API: `POST /yarnreceipts`
- ✅ Query invalidation triggers
- ✅ List page refreshes with new data
- ✅ Success toast appears

---

### **6. Performance & UX Tests**

#### Test 6.1: Loading States
**Expected:**
- ✅ Loading screen appears during auth check (prevent flicker)
- ✅ Skeleton loaders on data fetch
- ✅ No race conditions (single /auth/me call)

#### Test 6.2: Navigation Between Protected Pages
**Steps:**
1. Navigate from Dashboard → Yarn Receipt
2. Navigate to Party Ledger
3. Navigate to Users (if admin)

**Expected:**
- ✅ No re-authentication on every navigation
- ✅ Smooth transitions
- ✅ Auth state preserved

---

## 🐛 Bug Tracking

### Critical Issues
- [ ] 

### Medium Issues
- [ ] 

### Low Priority
- [ ] 

---

## ✅ Test Results Summary

| Test Category | Pass | Fail | Blocked | Notes |
|--------------|------|------|---------|-------|
| Login Flow | | | | |
| Route Protection | | | | |
| Sidebar Filtering | | | | |
| Session Management | | | | |
| API Integration | | | | |
| Performance | | | | |

---

## 📋 Manual Testing Commands

### Quick Auth Test (Browser Console)
```javascript
// Check if logged in
localStorage.getItem('token')

// Check user data
localStorage.getItem('user')

// Clear session (test logout)
localStorage.clear()

// Check auth context
// (Open React DevTools → Components → AuthProvider)
```

### Test User Credentials
```
Admin:
  Username: admin
  Password: Admin@123
  Access: Full system

Operator:
  Username: operator
  Password: Operator@123
  Access: Limited (Sizing, some Masters)

Manager:
  Username: manager
  Password: Manager@123
  Access: Reports + most modules
```

---

## 🎯 Acceptance Criteria

### ✅ PASS if:
1. No unauthorized access to any protected page
2. Proper redirects on insufficient permissions
3. Sidebar correctly filters based on user role
4. No mock data fallbacks in production reports
5. Loading screens prevent race conditions
6. Token expiry handled gracefully
7. All 38 RouteGuard-protected pages function correctly

### ❌ FAIL if:
1. Any protected page accessible without auth
2. Direct URL bypasses RouteGuard
3. Mock data appears in production
4. Race conditions in auth check
5. Flicker/flash of unauthorized content
6. Sidebar shows inaccessible modules

---

## 🚀 Next Steps After Testing

1. Fix any identified bugs
2. Add missing route guards (if any found)
3. Implement skeleton loaders for better UX
4. Add comprehensive error boundaries
5. Production deployment preparation
6. UAT with actual users

---

**Tester Signature:** _________________  
**Date Completed:** _________________  
**Status:** ⏳ In Progress
