# ERP Manual Testing Guide
**Sudhan Textile ERP System - Final QA Verification**  
**Date:** December 26, 2025  
**Build Status:** ✅ PASSING (0 errors)  
**Dev Server:** http://localhost:3000

---

## 🎯 Testing Objectives

This guide provides a comprehensive 10-step framework to verify:
- ✅ Backend connectivity for all modules
- ✅ Data persistence and validation
- ✅ Permission-based access control
- ✅ Audit logging for all operations
- ✅ Report accuracy and completeness
- ✅ UI/UX enhancements (empty states, keyboard shortcuts)

---

## 📋 10-Step Verification Framework

### STEP 1: Authentication & Role Verification

**Objective:** Verify login, session management, and role-based access

**Test Cases:**

1. **Valid Login**
   - Navigate to http://localhost:3000
   - Login with valid credentials
   - ✅ Verify: Successful redirect to dashboard
   - ✅ Verify: User menu shows logged-in user details

2. **Invalid Login**
   - Attempt login with wrong password
   - ✅ Verify: Error message displayed
   - ✅ Verify: Failed login attempt logged in audit

3. **Role-Based Access**
   - Login as `Administrator` role
   - ✅ Verify: All menu items visible
   - Login as `Operator` role
   - ✅ Verify: Restricted menus hidden
   - Attempt to access restricted URL directly (e.g., `/settings/users`)
   - ✅ Verify: Redirected to unauthorized page

4. **Session Timeout**
   - Wait for session expiry (if configured)
   - ✅ Verify: Auto-logout and redirect to login

5. **Logout**
   - Click user menu → Logout
   - ✅ Verify: Redirected to login page
   - ✅ Verify: Session cleared (cannot access protected pages)

**Backend Verification:**
- Check `AuthController.cs` login endpoint logs
- Verify JWT token generation and validation
- Check `AuditLog` table for login/logout entries

---

### STEP 2: Master Data Validation

**Objective:** Verify CRUD operations for master data modules

#### 2.1 Parties Master

1. **Create Party**
   - Navigate to Masters → Parties
   - Click "Add Party" (or Ctrl+N)
   - Fill form: Party Name, GSTIN, Contact details
   - Click "Save"
   - ✅ Verify: Success toast displayed
   - ✅ Verify: New party appears in table
   - ✅ Verify: Database `Parties` table has new record
   - ✅ Verify: Audit log entry created

2. **Edit Party**
   - Click Edit on existing party
   - Modify fields (e.g., change contact number)
   - Click "Save"
   - ✅ Verify: Changes persisted
   - ✅ Verify: Audit log shows UPDATE operation

3. **Delete Party**
   - Click Delete on party (without transactions)
   - Confirm deletion
   - ✅ Verify: Party removed from table
   - ✅ Verify: Database record deleted
   - ✅ Verify: Audit log shows DELETE operation

4. **Validation**
   - Try creating party without required fields
   - ✅ Verify: Validation errors displayed
   - Try duplicate GSTIN
   - ✅ Verify: Error message about duplicate

#### 2.2 Yarn Counts Master

1. **Create Yarn Count**
   - Navigate to Masters → Yarn Counts
   - Add new yarn count (e.g., "40s 2/100")
   - ✅ Verify: Created successfully
   - ✅ Verify: Audit logged

2. **Edit & Delete**
   - Edit yarn count description
   - Delete unused yarn count
   - ✅ Verify: Both operations logged in audit

#### 2.3 Other Masters

Repeat similar tests for:
- **Vehicles:** Create, edit, delete vehicle records
- **Beams:** Create beam with specifications
- **Sets:** Create set with beam associations
- **Customers:** Add customer with credit terms

**Backend Verification:**
- Check respective Controller files (`PartiesController.cs`, etc.)
- Verify `ApiResponse<T>` wrapper structure
- Verify validation logic in DTOs
- Check database tables for data persistence

---

### STEP 3: Transaction Flow Validation

**Objective:** Verify end-to-end transaction workflows

#### 3.1 Yarn Receipt → Stock Update

1. **Create Yarn Receipt**
   - Navigate to Sizing ERP → Yarn Receipt
   - Click "New Receipt" (or Ctrl+N)
   - Fill header: Receipt Date, Party, Vehicle
   - Add detail row: Yarn Count, Bags, Gross/Tare Weight, Rate
   - Calculate net weight automatically
   - Click "Save" (or Ctrl+S)
   - ✅ Verify: Receipt created with unique number
   - ✅ Verify: Success toast displayed

2. **Verify Stock Update**
   - Navigate to Reports → Yarn Stock Report
   - Filter by Yarn Count from receipt
   - ✅ Verify: Stock quantity increased by net weight
   - ✅ Verify: Running balance shows correct value
   - ✅ Verify: Transaction reference shows receipt number

3. **Backend Verification**
   - Check `YarnReceiptsController.cs` POST endpoint
   - Verify `YarnReceiptService.cs` creates `YarnStock` record
   - Check database: `YarnReceipts`, `YarnReceiptDetails`, `YarnStock` tables
   - ✅ Verify: All related records created in single transaction

4. **Audit Verification**
   - Check `AuditLogs` table
   - ✅ Verify: Entry with Action = "CREATE", Entity = "YarnReceipt"
   - ✅ Verify: User, Timestamp, IP Address captured

#### 3.2 Baby Cone Production → Stock Reduction

1. **Create Baby Cone Entry**
   - Navigate to Sizing ERP → Baby Cone
   - Select Yarn Count, enter quantity consumed
   - Click "Save"
   - ✅ Verify: Baby cone record created

2. **Verify Stock Reduction**
   - Check Yarn Stock Report
   - ✅ Verify: Stock reduced by consumed quantity
   - ✅ Verify: Cannot create baby cone if insufficient stock

3. **Backend Verification**
   - Check `BabyConeService.cs` stock validation logic
   - Verify negative stock prevention
   - Check `YarnStock` table for debit entry

#### 3.3 Yarn Return → Stock Adjustment

1. **Create Yarn Return**
   - Navigate to Sizing ERP → Yarn Return
   - Select Type: "Return to Supplier" or "Scrap/Waste"
   - Enter quantity, reason
   - Click "Save"
   - ✅ Verify: Return created

2. **Verify Stock Adjustment**
   - For Return to Supplier: ✅ Stock increases (credit)
   - For Scrap/Waste: ✅ Stock remains same but tracked separately
   - Check Yarn Stock Report for transaction

3. **Backend Verification**
   - Check `YarnReturnService.cs` logic
   - Verify different handling for return types

---

### STEP 4: Approval Workflow Testing

**Objective:** Verify multi-stage approval process

#### 4.1 Sizing Job Card Approval

1. **Create Draft Job Card**
   - Navigate to Sizing ERP → Sizing Job Card
   - Create new job card
   - Status: "Draft"
   - ✅ Verify: Saved successfully

2. **Submit for Approval**
   - Click on job card
   - Click Actions → "Submit for Prepared"
   - Confirm in dialog
   - ✅ Verify: Status changes to "Prepared"
   - ✅ Verify: Approval button disabled for same user
   - ✅ Verify: Audit log entry for status change

3. **Multi-Stage Approval**
   - Login as different user with APPROVE permission
   - Navigate to same job card
   - Click Actions → "Approve to Checked"
   - ✅ Verify: Status → "Checked"
   - Continue: "Approve to GM Approved" → "Authorize"
   - ✅ Verify: Final status = "Authorized"

4. **Backend Verification**
   - Check `SizingController.cs` POST `/sizing-job-cards/{id}/approve` endpoint
   - Verify `ApprovalHistory` table has all stages:
     - Draft → Prepared (User 1, Timestamp 1)
     - Prepared → Checked (User 2, Timestamp 2)
     - Checked → Approved (User 3, Timestamp 3)
     - Approved → Authorized (User 4, Timestamp 4)
   - ✅ Verify: Each stage has correct approver, timestamp, comments

5. **Permission Check**
   - Login as user WITHOUT approve permission
   - ✅ Verify: Approval buttons not visible
   - Try API call directly
   - ✅ Verify: 403 Forbidden response

---

### STEP 5: Audit Log Verification

**Objective:** Verify all operations are logged

#### 5.1 Create Operation Audit

1. **Perform Create Operation**
   - Create any record (e.g., new party)
   - Navigate to Reports → Audit Logs (if available) or check database

2. **Verify Audit Entry**
   - Check `AuditLogs` table
   - ✅ Verify fields:
     - `Action` = "CREATE"
     - `Entity` = "Party"
     - `EntityId` = New party ID
     - `UserId` = Logged-in user ID
     - `Username` = Logged-in username
     - `Timestamp` = Operation time
     - `IpAddress` = Client IP
     - `Changes` = JSON with old/new values
     - `Endpoint` = API endpoint path

#### 5.2 Update Operation Audit

1. **Perform Update**
   - Edit existing party (e.g., change phone number)
   - Save changes

2. **Verify Audit Entry**
   - ✅ Verify: `Action` = "UPDATE"
   - ✅ Verify: `Changes` JSON shows old vs new values:
     ```json
     {
       "PhoneNumber": {
         "OldValue": "9876543210",
         "NewValue": "9876543211"
       }
     }
     ```

#### 5.3 Delete Operation Audit

1. **Perform Delete**
   - Delete record
   - ✅ Verify: Audit entry with `Action` = "DELETE"
   - ✅ Verify: `Changes` captures deleted record data

#### 5.4 Failed Operation Audit

1. **Trigger Validation Error**
   - Try creating record with invalid data
   - ✅ Verify: Audit log may capture failed attempt (depends on implementation)

**Backend Verification:**
- Check `AuditLoggingMiddleware.cs` captures all requests
- Verify `IAuditLogService.cs` implementation
- Confirm all Controllers use middleware

---

### STEP 6: Security Policy Testing

**Objective:** Verify password policy, account lockout, session management

#### 6.1 Password Policy

1. **Weak Password Rejection**
   - Create new user with weak password (e.g., "123")
   - ✅ Verify: Error message about password requirements
   - Requirements (check `SecuritySettings` table):
     - Minimum length
     - Uppercase, lowercase, digit, special char
     - Not common password

2. **Password Change**
   - Login as user
   - Navigate to Profile → Change Password
   - Enter old password, new password (meeting requirements)
   - ✅ Verify: Password updated successfully
   - Logout and login with new password
   - ✅ Verify: Login successful

#### 6.2 Account Lockout

1. **Failed Login Attempts**
   - Attempt login with wrong password (5 times)
   - ✅ Verify: Account locked after threshold
   - ✅ Verify: Error message: "Account locked due to multiple failed attempts"
   - ✅ Verify: `Users` table `IsLocked` = true

2. **Unlock Account**
   - Login as Administrator
   - Navigate to Settings → Users
   - Find locked user
   - Click "Unlock Account"
   - ✅ Verify: `IsLocked` = false
   - ✅ Verify: User can login again

#### 6.3 Session Management

1. **Concurrent Sessions**
   - Login on Browser 1
   - Login on Browser 2 with same user
   - ✅ Verify: Behavior (allow/deny based on settings)

2. **Session Expiry**
   - Login and stay idle (beyond session timeout)
   - Perform action
   - ✅ Verify: Redirected to login with "Session expired" message

**Backend Verification:**
- Check `SecuritySettingsService.cs`
- Verify `AuthController.cs` login logic
- Check JWT token expiry configuration

---

### STEP 7: System Settings Testing

**Objective:** Verify settings control system behavior

#### 7.1 Security Settings

1. **Update Settings**
   - Navigate to Settings → Security Settings
   - Change: Max Login Attempts = 3
   - Change: Password Expiry Days = 90
   - Click "Save"
   - ✅ Verify: Settings saved to database

2. **Verify Enforcement**
   - Test login with 3 wrong attempts
   - ✅ Verify: Account locked after 3 (not 5)

#### 7.2 Company Settings

1. **Update Company Info**
   - Navigate to Settings → Company Settings
   - Update: Company Name, Address, Logo
   - ✅ Verify: Changes reflected on reports
   - ✅ Verify: Logo appears in report header

#### 7.3 Email Settings

1. **Configure SMTP**
   - Enter SMTP server details
   - Test connection
   - ✅ Verify: Test email sent successfully

**Backend Verification:**
- Check `SettingsController.cs`
- Verify settings cached (if implemented)
- Check `SecuritySettings`, `CompanySettings` tables

---

### STEP 8: Reports Validation

**Objective:** Verify all reports generate accurate data

#### 8.1 Party Ledger Report

1. **Generate Report**
   - Navigate to Reports → Party Ledger
   - Select Party: "Krishna Yarn Mills"
   - Date Range: Last 30 days
   - Click "Generate Report"

2. **Verify Data Accuracy**
   - ✅ Verify: Opening balance correct
   - ✅ Verify: Yarn receipts show as Credits
   - ✅ Verify: Tax invoices show as Debits
   - ✅ Verify: Running balance calculated correctly
   - ✅ Verify: Closing balance = Opening + Credits - Debits

3. **Export Functions**
   - Click "Export CSV"
   - ✅ Verify: CSV file downloaded with correct data
   - Click "Export PDF"
   - ✅ Verify: PDF generated with company header
   - ✅ Verify: All columns formatted correctly

4. **Backend Verification**
   - Check `ReportsController.cs` GET `/reports/party-ledger`
   - Verify SQL query uses UNION for receipts + invoices
   - Verify OVER clause for running balance:
     ```sql
     SUM(Credit - Debit) OVER (ORDER BY Date, TransactionId) AS RunningBalance
     ```

#### 8.2 Yarn Stock Report

1. **Generate Report**
   - Navigate to Reports → Yarn Stock
   - Select Yarn Count or leave blank for all
   - Click "Generate"

2. **Verify Data**
   - ✅ Verify: Opening stock matches previous closing
   - ✅ Verify: All receipts (IN) shown with quantities
   - ✅ Verify: All issues (OUT) shown with quantities
   - ✅ Verify: Current stock = Opening + IN - OUT
   - ✅ Verify: Negative stock prevented (validation)

3. **Drill-Down**
   - Click on transaction reference
   - ✅ Verify: Navigates to source document (e.g., yarn receipt)

#### 8.3 Production Reports

1. **Set Production Report**
   - Navigate to Reports → Set Production
   - Date range: Last month
   - ✅ Verify: All completed sets listed
   - ✅ Verify: Quantities, dates correct

2. **Beam Utilization Report**
   - Generate Beam Utilization report
   - ✅ Verify: Shows beams with usage percentage
   - ✅ Verify: Formula: (Used beams / Total beams) * 100

3. **Dashboard Metrics**
   - Navigate to Dashboard
   - ✅ Verify: Cards show accurate counts:
     - Total Sizing Sets Completed
     - Pending Approvals
     - Active Users
   - ✅ Verify: Charts render with data

**Backend Verification:**
- Check `DashboardService.cs` calculation logic
- Verify all report queries use proper joins
- Verify date filters applied correctly

---

### STEP 9: UI/UX Enhancements Check

**Objective:** Verify new UX improvements work correctly

#### 9.1 Empty States

1. **Users Page Empty State**
   - Navigate to Settings → Users
   - If users exist: Delete all test users (or use fresh DB)
   - ✅ Verify: Empty state displays:
     - Icon: User icon
     - Title: "No users found"
     - Description: "Get started by creating your first user account"
     - Action Button: "Add User"
   - Click "Add User" button
   - ✅ Verify: Create user dialog opens

2. **Roles Page Empty State**
   - Navigate to Settings → Roles
   - Delete all non-system roles (if possible)
   - ✅ Verify: Empty state displays:
     - Icon: Shield icon
     - Title: "No roles found"
     - Description: "Get started by creating your first role"
     - Action Button: "Create Role"
   - Click button
   - ✅ Verify: Create role dialog opens

3. **Other Pages**
   - Check Parties, Yarn Counts, Vehicles pages
   - ✅ Verify: Consistent empty state pattern

#### 9.2 Keyboard Shortcuts

1. **Global Shortcuts**
   - **Ctrl+N:** Create new record
     - Test on: Parties, Users, Roles, Yarn Receipt pages
     - ✅ Verify: Create dialog/form opens
   
   - **Ctrl+R:** Refresh data
     - Test on: Parties, Users, Sizing Job Card pages
     - ✅ Verify: Table data reloads
   
   - **Ctrl+F:** Focus search input
     - Test on: Parties, Users, Sizing pages
     - ✅ Verify: Search input gets focus

   - **Ctrl+S:** Save form
     - Test on: Yarn Receipt form, User form
     - ✅ Verify: Form submitted (if valid)

   - **Ctrl+Shift+E:** Export data
     - Test on: Sizing Job Card page
     - ✅ Verify: Export menu/action triggered

   - **Escape:** Close dialog/cancel
     - Test on: Any open dialog
     - ✅ Verify: Dialog closes

2. **Shortcut Indicators**
   - Hover over buttons
   - ✅ Verify: Tooltips show keyboard shortcut (if implemented)

#### 9.3 Mobile Responsiveness

1. **Desktop View (1920x1080)**
   - Navigate to all pages
   - ✅ Verify: Layout uses full width
   - ✅ Verify: Tables show all columns
   - ✅ Verify: Cards arranged in grids

2. **Tablet View (768x1024)**
   - Resize browser to tablet width
   - ✅ Verify: Layout responsive
   - ✅ Verify: Tables scrollable horizontally
   - ✅ Verify: Cards stack vertically

3. **Mobile View (375x667)**
   - Resize to mobile width
   - ✅ Verify: Sidebar collapses to hamburger menu
   - ✅ Verify: Tables show simplified mobile view
   - ✅ Verify: Touch-friendly button sizes

#### 9.4 Loading States

1. **Data Loading**
   - Navigate to page with large dataset
   - ✅ Verify: Skeleton loaders or spinner displayed
   - ✅ Verify: Smooth transition to data

2. **Form Submission**
   - Submit form (e.g., create party)
   - ✅ Verify: Button shows loading spinner
   - ✅ Verify: Button disabled during submission
   - ✅ Verify: Loading text: "Saving..." or "Creating..."

3. **Error States**
   - Trigger API error (e.g., network offline)
   - ✅ Verify: Error message displayed
   - ✅ Verify: Retry button available

**Frontend Verification:**
- Check `EmptyState` component usage across pages
- Verify `useKeyboardShortcut` hook integrated
- Verify responsive Tailwind classes (`sm:`, `md:`, `lg:`)

---

### STEP 10: Final Assessment

**Objective:** Produce readiness verdict

#### 10.1 Completeness Checklist

Mark each module as ✅ PASS or ❌ FAIL:

| Module | Backend Connected | Data Persists | Permissions Work | Audit Logged | Reports Accurate |
|--------|------------------|---------------|------------------|--------------|------------------|
| Authentication | ☐ | ☐ | ☐ | ☐ | N/A |
| Parties Master | ☐ | ☐ | ☐ | ☐ | ☐ |
| Yarn Counts | ☐ | ☐ | ☐ | ☐ | N/A |
| Vehicles | ☐ | ☐ | ☐ | ☐ | N/A |
| Users | ☐ | ☐ | ☐ | ☐ | N/A |
| Roles | ☐ | ☐ | ☐ | ☐ | N/A |
| Yarn Receipt | ☐ | ☐ | ☐ | ☐ | ☐ |
| Baby Cone | ☐ | ☐ | ☐ | ☐ | ☐ |
| Yarn Return | ☐ | ☐ | ☐ | ☐ | ☐ |
| Sizing Job Card | ☐ | ☐ | ☐ | ☐ | ☐ |
| Approval Workflow | ☐ | ☐ | ☐ | ☐ | N/A |
| Party Ledger Report | N/A | N/A | ☐ | N/A | ☐ |
| Yarn Stock Report | N/A | N/A | ☐ | N/A | ☐ |
| Dashboard Metrics | N/A | N/A | ☐ | N/A | ☐ |

#### 10.2 Bug Tracking

Document any issues found:

| Issue # | Severity | Module | Description | Expected | Actual | Status |
|---------|----------|--------|-------------|----------|--------|--------|
| 1 | P1 | - | - | - | - | - |
| 2 | P2 | - | - | - | - | - |
| 3 | P3 | - | - | - | - | - |

**Severity Levels:**
- **P1 (Critical):** System crash, data loss, security breach
- **P2 (High):** Feature not working, incorrect data
- **P3 (Medium):** UI issue, minor inconsistency
- **P4 (Low):** Cosmetic, enhancement request

#### 10.3 Performance Assessment

1. **Page Load Time**
   - ✅ Verify: Dashboard loads < 2 seconds
   - ✅ Verify: Report generation < 5 seconds (for moderate data)

2. **API Response Time**
   - ✅ Verify: CRUD operations < 500ms
   - ✅ Verify: Complex reports < 3 seconds

3. **Concurrent Users**
   - Test with multiple users simultaneously
   - ✅ Verify: No conflicts, no data corruption

#### 10.4 Readiness Scoring

**Scoring Criteria (Out of 100):**

| Category | Weight | Score | Weighted |
|----------|--------|-------|----------|
| Backend Connectivity | 20% | __/100 | __/20 |
| Data Persistence | 15% | __/100 | __/15 |
| Permission Controls | 15% | __/100 | __/15 |
| Audit Logging | 10% | __/100 | __/10 |
| Report Accuracy | 15% | __/100 | __/15 |
| Security Features | 10% | __/100 | __/10 |
| UI/UX Quality | 10% | __/100 | __/10 |
| Performance | 5% | __/100 | __/5 |
| **TOTAL** | **100%** | - | **__/100** |

**Readiness Grading:**
- **90-100 (A):** ✅ **GO-LIVE APPROVED** - Production ready
- **80-89 (B):** ✅ **UAT APPROVED** - Minor fixes needed
- **70-79 (C):** ⚠️ **UAT with Caution** - Moderate issues
- **60-69 (D):** ❌ **Not Ready** - Significant gaps
- **Below 60 (F):** ❌ **Major Issues** - Substantial rework needed

#### 10.5 Final Verdict

**Current Status (Pre-Testing):** 52% (C grade)
- Build: ✅ 0 errors
- P1 Bugs: ✅ All fixed
- P2 Features: ✅ All exist and verified
- P3 Enhancements: ✅ Completed (empty states, keyboard shortcuts)

**Post-Testing Verdict:**
- [ ] **GO-LIVE APPROVED** - Deploy to production
- [ ] **UAT APPROVED** - Enter user acceptance testing
- [ ] **NOT READY** - Address issues and retest

**Signoff:**
- Tested by: ___________________
- Date: ___________________
- Next Steps: ___________________

---

## 🛠️ Testing Environment Setup

### Prerequisites

1. **Backend Running:**
   ```powershell
   cd d:\Sudhan_Textile\ERP\ERP\backend\SudhanTextileERP.API
   dotnet run
   ```
   - API should be running on: https://localhost:7001
   - Swagger UI: https://localhost:7001/swagger

2. **Frontend Running:**
   ```powershell
   cd d:\Sudhan_Textile\ERP\ERP\frontend
   npm run dev
   ```
   - App running on: http://localhost:3000

3. **Database:**
   - SQLite database at: `backend/SudhanTextileERP.API/textileerp.db`
   - Ensure migrations applied
   - Seed data loaded (run `SeedData.cs` if needed)

4. **Test Users:**
   - **Administrator:** username: `admin`, password: `Admin@123`
   - **Operator:** username: `operator`, password: `Oper@123`
   - **Viewer:** username: `viewer`, password: `View@123`

### Testing Tools

- **Browser:** Chrome/Edge (latest version)
- **Network Tab:** For API call monitoring
- **Database Browser:** DB Browser for SQLite (for direct DB checks)
- **Postman/Thunder Client:** For API testing (optional)

---

## 📊 Expected Test Duration

| Step | Estimated Time | Complexity |
|------|---------------|------------|
| Step 1: Auth & Roles | 30 minutes | Low |
| Step 2: Master Data | 1 hour | Medium |
| Step 3: Transactions | 1.5 hours | High |
| Step 4: Approvals | 45 minutes | Medium |
| Step 5: Audit Logs | 30 minutes | Low |
| Step 6: Security | 45 minutes | Medium |
| Step 7: Settings | 30 minutes | Low |
| Step 8: Reports | 1.5 hours | High |
| Step 9: UI/UX | 1 hour | Medium |
| Step 10: Assessment | 30 minutes | Low |
| **TOTAL** | **~8 hours** | - |

**Recommended Approach:**
- Day 1 (4 hours): Steps 1-5
- Day 2 (4 hours): Steps 6-10

---

## 🔍 Backend Verification Reference

### Key Files to Check

**Controllers:**
- `AuthController.cs` - Login, logout, JWT
- `PartiesController.cs` - Parties CRUD
- `YarnReceiptsController.cs` - Yarn receipt transactions
- `SizingController.cs` - Sizing job cards, approval workflow
- `ReportsController.cs` - All reports
- `SettingsController.cs` - System settings

**Services:**
- `YarnReceiptService.cs` - Stock update logic
- `BabyConeService.cs` - Stock consumption
- `YarnReturnService.cs` - Return processing
- `DashboardService.cs` - Metrics calculation
- `IAuditLogService.cs` - Audit logging

**Middleware:**
- `AuditLoggingMiddleware.cs` - Request/response logging
- JWT authentication middleware

**Database Tables:**
- `Users`, `Roles`, `Permissions`, `RolePermissions`
- `Parties`, `YarnCounts`, `Vehicles`, `Beams`, `Sets`
- `YarnReceipts`, `YarnReceiptDetails`, `YarnStock`
- `SizingJobCards`, `ApprovalHistory`
- `AuditLogs`
- `SecuritySettings`, `CompanySettings`

---

## 📝 Notes for Testers

1. **Database Backup:** Take backup before testing destructive operations
2. **Audit Log Review:** After each major operation, check audit logs
3. **Browser Console:** Monitor for JavaScript errors
4. **Network Tab:** Verify API calls return expected status codes (200, 201, 400, 403, etc.)
5. **Data Validation:** Cross-check UI data with database records
6. **Permission Testing:** Test with different user roles to verify access control
7. **Edge Cases:** Try boundary values, empty inputs, special characters
8. **Concurrency:** Have multiple users perform operations simultaneously
9. **Session Management:** Test logout, timeout, concurrent sessions
10. **Report Accuracy:** Manually calculate totals and verify against report output

---

## ✅ Quick Reference: Keyboard Shortcuts

| Shortcut | Action | Pages |
|----------|--------|-------|
| Ctrl+N | Create new record | Parties, Users, Roles, Yarn Receipt |
| Ctrl+R | Refresh data | All list pages |
| Ctrl+F | Focus search | All pages with search |
| Ctrl+S | Save form | All form pages |
| Ctrl+Shift+E | Export data | Sizing Job Card |
| Escape | Close dialog/Cancel | All dialogs |

---

## 🎯 Success Criteria

**System is ready for UAT/GO-LIVE when:**
1. ✅ All modules connect to backend and persist data
2. ✅ Permissions enforced on all protected routes and actions
3. ✅ Audit logs capture 100% of CREATE/UPDATE/DELETE operations
4. ✅ Reports generate accurate data matching manual calculations
5. ✅ No P1 (Critical) bugs found
6. ✅ P2 (High) bugs < 5 and have workarounds
7. ✅ UI/UX enhancements functional (empty states, shortcuts, responsive)
8. ✅ Performance meets acceptable thresholds (< 2s page load, < 500ms API)
9. ✅ Security policies enforced (password, lockout, session)
10. ✅ Overall readiness score ≥ 70% (C grade minimum)

---

**Good luck with testing! 🚀**

*For questions or issues, refer to:*
- *BREAKTHROUGH_VERIFICATION.md* - Recent progress report
- *ERP_QA_VERIFICATION_REPORT.md* - Original QA assessment
- *Backend API documentation: https://localhost:7001/swagger*
