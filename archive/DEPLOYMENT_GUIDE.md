# 🚀 DEPLOYMENT GUIDE - Sudhan Textile ERP

## Quick Start (Development)

### Prerequisites
- Node.js 18+ 
- .NET 10.0 SDK
- VS Code (recommended)

### Start Backend API
```powershell
cd D:\Sudhan_Textile\ERP\ERP\backend\SudhanTextileERP.API
dotnet run
```
✅ API running on: http://localhost:5000

### Start Frontend
```powershell
cd D:\Sudhan_Textile\ERP\ERP\frontend
npm run dev
```
✅ Web app running on: http://localhost:3000

---

## Production Deployment

### 1. Backend (.NET Core API)

**Build Release:**
```powershell
cd backend\SudhanTextileERP.API
dotnet publish -c Release -o publish
```

**Deploy to IIS:**
1. Create new site in IIS Manager
2. Point to `publish` folder
3. Set Application Pool to .NET CLR 10.0
4. Configure appsettings.json:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=ERP_Production.db"
  },
  "Jwt": {
    "SecretKey": "<CHANGE-IN-PRODUCTION>",
    "Issuer": "SudhanTextileERP",
    "Audience": "SudhanTextileClients",
    "ExpiryMinutes": 120
  },
  "CORS": {
    "AllowedOrigins": ["https://erp.sudhantextiles.com"]
  }
}
```

**Environment Variables:**
```
ASPNETCORE_ENVIRONMENT=Production
ENABLE_SAMPLE_DATA=false
```

### 2. Frontend (Next.js)

**Build Production:**
```powershell
cd frontend
npm run build
npm run start
```

**Deploy to Vercel/Azure:**
```powershell
# Vercel
vercel --prod

# Or Azure Static Web Apps
az staticwebapp deploy
```

**Environment Variables (.env.production):**
```
NEXT_PUBLIC_API_URL=https://api.erp.sudhantextiles.com
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_ENABLE_SAMPLE_DATA=false
```

---

## Database Migration

### Development → Production
```powershell
# Backup dev database
copy backend\SudhanTextileERP.API\ERP.db ERP_Backup_$(Get-Date -Format "yyyyMMdd_HHmmss").db

# Copy to production
copy ERP.db \\prod-server\ERP\ERP_Production.db
```

### Run Migrations
```powershell
cd backend\SudhanTextileERP.API
dotnet ef database update
```

---

## Health Checks

### API Health
```bash
curl http://localhost:5000/health
# Expected: {"status":"Healthy","checks":[...]}
```

### Database Check
```bash
curl http://localhost:5000/api/health/database
# Expected: 200 OK
```

### Frontend Check
```bash
curl http://localhost:3000/api/health
# Expected: {"ok":true}
```

---

## Monitoring Setup

### Application Insights (Azure)
```json
"ApplicationInsights": {
  "InstrumentationKey": "<YOUR-KEY>",
  "EnableLiveMetrics": true
}
```

### Logging Configuration
```json
"Serilog": {
  "MinimumLevel": {
    "Default": "Information",
    "Override": {
      "Microsoft": "Warning",
      "System": "Warning"
    }
  },
  "WriteTo": [
    {
      "Name": "File",
      "Args": {
        "path": "Logs/erp-.log",
        "rollingInterval": "Day",
        "retainedFileCountLimit": 30
      }
    }
  ]
}
```

---

## Backup Strategy

### Automated Daily Backup
Already configured in app! Runs daily at 11:00 PM IST.

**Manual Backup:**
```powershell
# Backup database
copy backend\SudhanTextileERP.API\ERP.db Backups\ERP_Manual_$(Get-Date -Format "yyyyMMdd_HHmmss").db

# Backup uploaded files
xcopy backend\SudhanTextileERP.API\Uploads Backups\Uploads_$(Get-Date -Format "yyyyMMdd_HHmmss") /E /I
```

**Restore:**
```powershell
# Stop API
Stop-Process -Name dotnet -Force

# Restore database
copy Backups\ERP_Backup_20251227.db backend\SudhanTextileERP.API\ERP.db

# Restart API
cd backend\SudhanTextileERP.API
dotnet run
```

---

## Performance Tuning

### IIS Settings
- Application Pool: .NET CLR v10.0
- Idle Timeout: 20 minutes
- Recycling: 1740 minutes (29 hours)
- Max Worker Processes: 4

### Database Optimization
```sql
-- Create indexes
CREATE INDEX idx_babycones_receiptid ON BabyCones(YarnReceiptId);
CREATE INDEX idx_babycones_date ON BabyCones(BabyConeDate);
CREATE INDEX idx_yarnreceipts_date ON YarnReceipts(ReceiptDate);

-- Vacuum database
VACUUM;
```

### Frontend (Next.js)
```javascript
// next.config.js
module.exports = {
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  images: {
    domains: ['erp.sudhantextiles.com'],
    formats: ['image/webp']
  }
}
```

---

## Security Checklist

- [ ] Change default JWT secret
- [ ] Enable HTTPS only
- [ ] Configure CORS properly
- [ ] Set strong admin password
- [ ] Enable rate limiting
- [ ] Configure firewall rules
- [ ] Setup SSL certificates
- [ ] Enable audit logging
- [ ] Configure backup encryption
- [ ] Review user permissions

---

## Troubleshooting

### Backend not starting
```powershell
# Check logs
cat backend\SudhanTextileERP.API\Logs\erp-*.log

# Check port
netstat -ano | findstr :5000

# Kill process if needed
taskkill /PID <PID> /F
```

### Frontend build failing
```powershell
# Clear cache
rm -r .next
rm -r node_modules
npm install
npm run build
```

### Database locked
```powershell
# Stop all connections
Stop-Process -Name dotnet -Force

# Restart
cd backend\SudhanTextileERP.API
dotnet run
```

---

## Support Contacts

**Technical Support:**
- Email: support@sudhantextiles.com
- Phone: +91-424-2223344
- WhatsApp: +91-9876543210

**Emergency Hotline:**
- 24/7 Support: +91-9988776655

**Remote Access:**
- TeamViewer: Ask support for ID
- AnyDesk: Ask support for ID

---

## Version Info

- **Backend:** ASP.NET Core 10.0
- **Frontend:** Next.js 14.2.0
- **Database:** SQLite 3
- **Current Version:** 1.0.0
- **Release Date:** December 27, 2025

---

## License

Proprietary Software - Sudhan Textile Mills Pvt Ltd
All Rights Reserved © 2025
