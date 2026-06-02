# Hostinger MySQL Remote Access Setup

## Finding Your Remote MySQL Host

1. In your Hostinger panel, go to **Databases** → **Remote MySQL**
2. Look for the **MySQL hostname** (it will be something like `mysqlXXX.hostname.com` or similar)
3. Add your current IP address to the allowed hosts

## Option 1: Direct Database Deployment (When Deployed to Hostinger)

When your application is deployed on the same Hostinger server as your MySQL database:
- The connection string with `Server=localhost` will work fine
- Run the application and it will automatically create tables and seed data

## Option 2: Remote Access for Development (From Your Local Machine)

### Step 1: Get Remote MySQL Credentials from Hostinger

In Hostinger panel → Databases → Remote MySQL:
- Enable remote MySQL access
- Add your public IP address (Google "what is my ip")
- Note the remote hostname (usually different from "localhost")

### Step 2: Update Development Connection String

Edit `appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_REMOTE_HOST;Port=3306;Database=u244866688_ERP;Uid=u244866688_ERP;Pwd=@ERP@Duolink12345678;SslMode=Required;",
    "DatabaseProvider": "MySQL"
  }
}
```

Replace `YOUR_REMOTE_HOST` with the actual remote hostname from Hostinger.

### Step 3: Test Connection

```powershell
cd backend\SudhanTextileERP.API
dotnet ef migrations add InitialMySQLMigration
dotnet ef database update
```

## Option 3: Manual SQL Script (Easiest for Initial Setup)

If remote access is difficult, I can generate a complete SQL script that you can:
1. Copy and paste into Hostinger's phpMyAdmin
2. Execute to create all tables
3. Then deploy your application to Hostinger

Would you like me to generate the SQL script?

## Option 4: Deploy Application First (Recommended)

**This is the EASIEST approach:**

1. Build your application for production:
   ```powershell
   cd backend\SudhanTextileERP.API
   dotnet publish -c Release -o ./publish
   ```

2. Upload the `publish` folder to Hostinger (via FTP or File Manager)

3. Configure Hostinger to run the ASP.NET Core application

4. On first run, the application will:
   - Automatically create all database tables
   - Seed initial data (roles, admin user, modules)
   - Be ready to use!

The connection string with `Server=localhost` will work perfectly when the app runs on Hostinger.

## Next Steps - Choose Your Path:

**Path A - Deploy to Hostinger Now (Recommended):**
1. Build: `dotnet publish -c Release -o ./publish`
2. Upload to Hostinger
3. Application auto-creates database on first run
4. Done! ✅

**Path B - Setup Remote Access:**
1. Get remote MySQL hostname from Hostinger
2. Update appsettings.Development.json
3. Add your IP to allowed hosts
4. Run migrations from local machine

**Path C - Use SQL Script:**
1. I'll generate complete SQL script
2. Run it in Hostinger's phpMyAdmin
3. Deploy application

Which path would you like to take?
