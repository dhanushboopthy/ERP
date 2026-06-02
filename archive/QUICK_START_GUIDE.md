# Sudhan Textile ERP - Quick Start Guide

**Last Updated:** February 3, 2026

---

## Prerequisites

- Node.js (Latest LTS)
- .NET SDK 10.0
- Windows Operating System

---

## Starting the Application

### 1. Start Backend API

```powershell
cd D:\Sudhan_Textile\ERP\ERP\backend\SudhanTextileERP.API
$env:ASPNETCORE_ENVIRONMENT="Development"
dotnet run --project .
```

**Expected Output:**
```
Now listening on: http://localhost:5000
Application started. Press Ctrl+C to shut down.
```

### 2. Start Frontend

```powershell
cd D:\Sudhan_Textile\ERP\ERP\frontend
npm run dev
```

**Expected Output:**
```
Ready on http://localhost:3000
```

### 3. Access Application

Open your browser and navigate to: **http://localhost:3000**

---

## Default Login Credentials

| Field | Value |
|-------|-------|
| Username | `Admin` |
| Password | `Admin@123` |

---

## Quick Verification Commands

### Check if services are running:

```powershell
netstat -an | Select-String ":5000.*LISTEN"  # Backend
netstat -an | Select-String ":3000.*LISTEN"  # Frontend
```

### Test API directly:

```powershell
# Login and get token
$loginBody = '{"username":"Admin","password":"Admin@123"}'
$result = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $result.data.token

# Test an API endpoint
$headers = @{ "Authorization" = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:5000/api/dashboard/stats" -Method GET -Headers $headers
```

---

## Common Operations

### Creating a New Party

1. Login to the application
2. Navigate to **Masters > Parties**
3. Click **"Add New Party"**
4. Fill in the required fields:
   - Party Code
   - Party Name
   - Address, City, State, PIN
   - GSTIN
   - Contact Details
5. Click **"Save"**

### Creating a Yarn Receipt

1. Navigate to **Sizing > Yarn Receipt**
2. Click **"New Receipt"**
3. Select Party
4. Enter Receipt Details
5. Add Items
6. Click **"Save"**

### Viewing Dashboard

1. After login, you'll see the main dashboard
2. Key metrics displayed:
   - Today's Production
   - Pending Approvals
   - Yarn Stock
   - Active Sets

---

## Database Information

### Development Mode
- **Type:** SQLite
- **Location:** `backend/SudhanTextileERP.API/Database/SudhanTextileERP.db`
- **Environment Variable:** `ASPNETCORE_ENVIRONMENT=Development`

### Production Mode
- **Type:** MySQL
- **Connection String:** Configure in `appsettings.Production.json`
- **Environment Variable:** `ASPNETCORE_ENVIRONMENT=Production`

---

## API Endpoints Reference

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh-token` - Refresh JWT token
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/executive` - Executive dashboard
- `GET /api/dashboard/yarn-stock` - Yarn stock summary

### Master Data
- `GET /api/parties` - List all parties
- `POST /api/parties` - Create party
- `PUT /api/parties/{id}` - Update party
- `DELETE /api/parties/{id}` - Delete party

- `GET /api/yarncounts` - List yarn counts
- `GET /api/companies` - List companies
- `GET /api/beams` - List beams
- `GET /api/loomtypes` - List loom types

### Sizing Operations
- `GET /api/yarnreceipts` - List yarn receipts
- `GET /api/sizingjobcards` - List sizing job cards
- `GET /api/warpingjobcards` - List warping job cards
- `GET /api/babycones` - List baby cones
- `GET /api/taxinvoices` - List tax invoices

### Reports
- `GET /api/reports/yarn-stock-register` - Yarn stock register
- `GET /api/reports/sizing-job-cards` - Sizing job cards report
- `GET /api/reports/beam-utilization` - Beam utilization report
- `GET /api/reports/invoice-register` - Invoice register
- `GET /api/reports/daily-production` - Daily production report
- `GET /api/reports/party-ledger?partyId={id}` - Party ledger

### System
- `GET /api/health` - Health check
- `GET /api/health/alerts` - System alerts
- `GET /api/backup/history` - Backup history
- `GET /api/backup/configuration` - Backup configuration

---

## Troubleshooting

### Backend won't start

1. Check if port 5000 is already in use:
   ```powershell
   Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess
   ```

2. Kill the process if needed:
   ```powershell
   Stop-Process -Id <ProcessId> -Force
   ```

3. Ensure environment variable is set:
   ```powershell
   $env:ASPNETCORE_ENVIRONMENT="Development"
   ```

### Frontend won't start

1. Check if port 3000 is already in use
2. Clear node_modules and reinstall:
   ```powershell
   Remove-Item -Recurse -Force node_modules
   npm install
   ```

3. Clear Next.js cache:
   ```powershell
   Remove-Item -Recurse -Force .next
   npm run dev
   ```

### Login fails

1. Verify backend is running on port 5000
2. Check browser console for errors
3. Verify credentials: `Admin` / `Admin@123`
4. Try clearing browser cache/cookies

### Database errors

1. Check if database file exists:
   ```powershell
   Test-Path "D:\Sudhan_Textile\ERP\ERP\backend\SudhanTextileERP.API\Database\SudhanTextileERP.db"
   ```

2. If missing, the application will create it automatically on first run

3. To reset database (CAUTION - data loss):
   ```powershell
   Remove-Item "D:\Sudhan_Textile\ERP\ERP\backend\SudhanTextileERP.API\Database\SudhanTextileERP.db"
   # Restart backend - database will be recreated
   ```

---

## Performance Optimization Tips

1. **Development Mode:**
   - Average API response: ~15ms
   - Keep Chrome DevTools open for debugging
   - Use React DevTools extension

2. **Production Mode:**
   - Use MySQL instead of SQLite
   - Enable production optimizations in Next.js
   - Configure CDN for static assets
   - Enable API response caching

---

## Security Best Practices

1. **Change default password** immediately after first login
2. **Use HTTPS** in production environment
3. **Configure CORS** appropriately for production
4. **Rotate JWT secrets** regularly
5. **Keep packages updated** to address vulnerabilities
6. **Review user permissions** regularly
7. **Enable backup scheduling** for production

---

## Backup & Recovery

### Manual Backup

```powershell
# Backup SQLite database
Copy-Item "backend\SudhanTextileERP.API\Database\SudhanTextileERP.db" `
          "Backups\SudhanTextileERP_$(Get-Date -Format 'yyyyMMdd_HHmmss').db"
```

### Restore Backup

```powershell
# Stop backend first, then restore
Copy-Item "Backups\SudhanTextileERP_20260203_120000.db" `
          "backend\SudhanTextileERP.API\Database\SudhanTextileERP.db" -Force
# Restart backend
```

---

## Support & Documentation

### Test Report
See: `TEST_REPORT_2026-02-03.md`

### Known Issues
- 4 ESLint warnings (non-blocking)
- Package vulnerabilities in Azure.Identity and Microsoft.Identity.Client

### Contact
For technical support, contact your system administrator.

---

## Useful Links

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Swagger API Docs:** http://localhost:5000/swagger (if enabled)
- **Health Check:** http://localhost:5000/api/health

---

**Version:** 1.0  
**Last Tested:** February 3, 2026  
**Status:** Production Ready (Development Mode)
