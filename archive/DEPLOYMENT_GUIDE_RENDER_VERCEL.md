# Deploy Sudhan Textile ERP to Render + Vercel

## 🎯 Architecture

```
Frontend (Vercel) → Backend API (Render) → MySQL (Hostinger)
     React              .NET Core           Database
```

## 📊 Database Setup (Do This First!)

### Step 1: Create Tables in Hostinger MySQL

1. Open phpMyAdmin: https://auth-db1993.hstgr.io
2. Login with your credentials
3. Select database: `u244866688_ERP`
4. Click **SQL** tab
5. Open file: `CreateERPDatabase_MySQL.sql`
6. Copy all content and paste into SQL editor
7. Click **Go** button
8. Wait for success message

✅ This creates all 40+ tables for your ERP system!

---

## 🚀 Part 1: Deploy Backend API to Render

### Step 1: Prepare Your Code

Already done! Your backend is configured to use Hostinger MySQL.

### Step 2: Create Render Account

1. Go to https://render.com
2. Sign up with GitHub (recommended)
3. Verify your email

### Step 3: Push Code to GitHub

```powershell
cd d:\Sudhan_Textile\ERP\ERP

# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit - Sudhan Textile ERP"

# Create GitHub repo and push
# Go to github.com → New Repository → "sudhan-textile-erp"
git remote add origin https://github.com/YOUR_USERNAME/sudhan-textile-erp.git
git branch -M main
git push -u origin main
```

### Step 4: Deploy to Render

1. Go to Render Dashboard → **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:

**Basic Settings:**
- **Name**: `sudhan-textile-api`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: `backend/SudhanTextileERP.API`
- **Runtime**: `.NET`
- **Build Command**: `dotnet publish -c Release -o out`
- **Start Command**: `dotnet out/SudhanTextileERP.API.dll`

**Environment Variables** (Click "Advanced"):
```
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://0.0.0.0:$PORT
```

**Instance Type**: Free (or Starter for better performance)

4. Click **Create Web Service**
5. Wait 5-10 minutes for build
6. Note your API URL: `https://sudhan-textile-api.onrender.com`

### Step 5: Update CORS in Backend

Add your frontend URL to allowed origins in `appsettings.Production.json`:

```json
"CorsSettings": {
  "AllowedOrigins": [
    "https://your-app.vercel.app",
    "https://sudhan-textile.vercel.app"
  ]
}
```

Commit and push changes.

---

## 🌐 Part 2: Deploy Frontend to Vercel

### Step 1: Update Frontend API URL

Edit `frontend/.env.production`:

```env
VITE_API_URL=https://sudhan-textile-api.onrender.com/api
```

### Step 2: Install Vercel CLI (Optional)

```powershell
npm install -g vercel
```

### Step 3: Deploy to Vercel

**Option A - Using Vercel Dashboard:**

1. Go to https://vercel.com
2. Sign up with GitHub
3. Click **Add New** → **Project**
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

6. **Environment Variables**:
   ```
   VITE_API_URL=https://sudhan-textile-api.onrender.com/api
   ```

7. Click **Deploy**
8. Wait 2-3 minutes
9. Your app URL: `https://sudhan-textile-erp.vercel.app`

**Option B - Using CLI:**

```powershell
cd frontend
vercel --prod
```

---

## 🔧 Configuration Checklist

### Backend (Render)
- [x] MySQL connection string configured
- [ ] Environment variables set
- [ ] CORS origins include Vercel URL
- [ ] JWT secret key secured
- [ ] Health check endpoint working

### Frontend (Vercel)
- [ ] API URL points to Render backend
- [ ] Build succeeds
- [ ] Environment variables set
- [ ] Login works

### Database (Hostinger)
- [ ] Tables created via SQL script
- [ ] Connection working from Render
- [ ] Data accessible

---

## 🧪 Testing Deployment

### 1. Test Backend API

```powershell
# Health check
curl https://sudhan-textile-api.onrender.com/health

# Test login endpoint
curl -X POST https://sudhan-textile-api.onrender.com/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"admin","password":"Admin@123"}'
```

### 2. Test Frontend

1. Open: https://sudhan-textile-erp.vercel.app
2. Login with: `admin` / `Admin@123`
3. Check all modules work
4. Test creating a party/yarn count
5. Verify data saves to MySQL

---

## 🔒 Security Best Practices

### 1. Update Production Secrets

In Render, add these environment variables:

```
ConnectionStrings__DefaultConnection=Server=auth-db1993.hstgr.io;Port=3306;Database=u244866688_ERP;Uid=u244866688_ERP;Pwd=@ERP@Duolink12345678;SslMode=Required;

JwtSettings__SecretKey=YOUR_SUPER_SECURE_RANDOM_KEY_AT_LEAST_32_CHARS_LONG_123456789

CorsSettings__AllowedOrigins__0=https://your-app.vercel.app
```

Generate secure JWT key:
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})
```

### 2. Change Default Admin Password

After first login, immediately change the default admin password!

### 3. Enable HTTPS Only

Already configured in `appsettings.Production.json`

---

## 📈 Monitoring & Logs

### Render Logs
- Dashboard → Your Service → Logs
- Real-time logging
- Debug connection issues

### Vercel Logs
- Dashboard → Your Project → Deployments → View Function Logs
- Build logs
- Runtime logs

---

## 💰 Cost Estimate

| Service | Free Tier | Paid |
|---------|-----------|------|
| **Hostinger MySQL** | Your current plan | ~$3-10/month |
| **Render Backend** | 750 hrs/month (sleeps after 15min) | $7/month (always on) |
| **Vercel Frontend** | Unlimited hobby projects | Free for personal |

**Total**: $0-10/month to start!

---

## 🚨 Common Issues & Solutions

### Issue 1: Render Build Fails

**Error**: "SDK not found"

**Solution**: Add `global.json` in backend root:
```json
{
  "sdk": {
    "version": "8.0.0",
    "rollForward": "latestMinor"
  }
}
```

### Issue 2: Database Connection Timeout

**Error**: "Unable to connect to MySQL"

**Solution**: 
1. Check Hostinger MySQL is running
2. Verify connection string in Render env vars
3. Check firewall/IP whitelist in Hostinger

### Issue 3: CORS Error in Browser

**Error**: "blocked by CORS policy"

**Solution**: Add Vercel URL to CORS origins in backend, redeploy

### Issue 4: Render Service Sleeps

**Problem**: Free tier sleeps after 15min inactivity (first request takes 30s)

**Solutions**:
- Upgrade to paid plan ($7/month)
- Use cron job to ping every 10 minutes
- Add loading message in frontend

---

## 🔄 Deployment Workflow

### For Future Updates:

1. **Make changes locally**
2. **Test locally**: `dotnet run` and `npm run dev`
3. **Commit changes**: `git add . && git commit -m "Description"`
4. **Push to GitHub**: `git push`
5. **Auto-deploy**: Render and Vercel deploy automatically!

---

## 📞 Support Resources

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Hostinger Support**: https://support.hostinger.com
- **.NET Deployment**: https://docs.microsoft.com/aspnet/core/host-and-deploy

---

## ✅ Go-Live Checklist

- [ ] Database tables created in Hostinger
- [ ] Backend deployed to Render
- [ ] Frontend deployed to Vercel
- [ ] Login works end-to-end
- [ ] All CRUD operations tested
- [ ] Default admin password changed
- [ ] JWT secret key updated
- [ ] CORS configured correctly
- [ ] SSL/HTTPS enabled
- [ ] Monitoring set up
- [ ] Backup strategy in place
- [ ] Team trained on system

---

## 🎉 You're Ready!

Your ERP system will be accessible worldwide:
- **Frontend**: `https://sudhan-textile-erp.vercel.app`
- **Backend API**: `https://sudhan-textile-api.onrender.com`
- **Database**: Hostinger MySQL (centralized)

All data stored securely in Hostinger, accessible from anywhere! 🚀
