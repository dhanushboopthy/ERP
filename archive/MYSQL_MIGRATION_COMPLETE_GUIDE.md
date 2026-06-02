# Hostinger MySQL Migration Guide

## Complete Setup Instructions

### 1. Create MySQL Database on Hostinger

#### In the Hostinger Panel (shown in your screenshot):

1. **MySQL database name**: Enter `u244866688_sudhan_erp`
2. **MySQL username**: Enter `u244866688_erpuser`
3. **Password**: Create a strong password (minimum 12 characters, mix of letters, numbers, symbols)
   - Example: `MyERP@2026#Secure!`
4. Click the **Create** button

#### Save These Credentials Securely:
```
Host: localhost (or check remote access settings)
Port: 3306
Database: u244866688_sudhan_erp
Username: u244866688_erpuser
Password: [Your Created Password]
```

### 2. Update Connection String in Your Project

**Important**: Replace `YOUR_PASSWORD_HERE` in these files with your actual password:

- `backend/SudhanTextileERP.API/appsettings.json`
- `backend/SudhanTextileERP.API/appsettings.Production.json`

The connection string format is:
```
Server=localhost;Port=3306;Database=u244866688_sudhan_erp;Uid=u244866688_erpuser;Pwd=YOUR_ACTUAL_PASSWORD;SslMode=Preferred;
```

### 3. Install MySQL Packages

Run this command in the backend project directory:
```powershell
cd backend\SudhanTextileERP.API
dotnet restore
```

The following packages have been added:
- `Pomelo.EntityFrameworkCore.MySql` (v8.0.2)
- `MySql.Data` (v9.1.0)

### 4. Create Database Schema

Run the following commands to create the database tables:

```powershell
# Navigate to the API project directory
cd backend\SudhanTextileERP.API

# Create a new migration for MySQL
dotnet ef migrations add InitialMySQLMigration --context ApplicationDbContext

# Apply the migration to create tables
dotnet ef database update --context ApplicationDbContext
```

### 5. Seed Initial Data

The application will automatically seed data on first run. You can also manually run:

```powershell
dotnet run --environment Production
```

The SeedData.cs will create:
- Default roles (Admin, Manager, User)
- Default admin user
- Module permissions
- Master data

### 6. Remote Access Configuration (Optional)

If you need to access the database remotely for development:

1. In Hostinger panel, go to **Databases** → **Remote MySQL**
2. Add your development machine's IP address
3. Update connection string in `appsettings.Development.json`:
   ```json
   "DefaultConnection": "Server=YOUR_REMOTE_HOST;Port=3306;Database=u244866688_sudhan_erp;Uid=u244866688_erpuser;Pwd=YOUR_PASSWORD;SslMode=Required;"
   ```

### 7. Test the Connection

Create a simple test:

```powershell
# Run the application
dotnet run

# Check the logs for successful database connection
# You should see: "Application started successfully"
```

### 8. Deploy to Hostinger

1. Build the project for production:
   ```powershell
   dotnet publish -c Release -o ./publish
   ```

2. Upload the `publish` folder to your Hostinger hosting
3. Configure the web server to run the ASP.NET Core application
4. Ensure the `appsettings.Production.json` has the correct connection string

### 9. Verify Deployment

Test these endpoints:
- `https://yourdomain.com/api/health` - Health check
- `https://yourdomain.com/api/auth/login` - Login endpoint
- `https://yourdomain.com/swagger` - API documentation

## Troubleshooting

### Connection Timeout
- Check if MySQL service is running in Hostinger
- Verify firewall settings allow port 3306
- Confirm connection string credentials are correct

### Migration Errors
- Ensure you have CREATE TABLE permissions
- Check MySQL version compatibility (requires MySQL 5.7+)
- Review error logs in `Logs` folder

### Authentication Issues
- Verify JWT settings in appsettings.json
- Check that seeded admin user exists
- Confirm password hashing is working

## Security Checklist

- [ ] Changed default admin password after first login
- [ ] Updated JWT SecretKey in production
- [ ] Enabled HTTPS/SSL for all connections
- [ ] Set strong database password
- [ ] Configured CORS for production domain only
- [ ] Enabled rate limiting
- [ ] Regular database backups configured
- [ ] Monitoring and alerting set up

## Environment Variables (Recommended for Production)

Instead of hardcoding passwords, use environment variables:

```bash
# Set these in Hostinger hosting panel
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=u244866688_sudhan_erp
MYSQL_USER=u244866688_erpuser
MYSQL_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_key
```

Then update your code to read from environment variables.

## Backup Strategy

1. Enable Hostinger's automatic backups
2. Configure application-level backups in `appsettings.Production.json`
3. Test restore procedures regularly
4. Keep backups for at least 30 days

## Next Steps

1. ✅ Complete MySQL database creation in Hostinger
2. ✅ Update connection strings with actual password
3. ⏳ Run database migrations
4. ⏳ Deploy application to Hostinger
5. ⏳ Test all functionality
6. ⏳ Configure domain and SSL certificate
7. ⏳ Set up monitoring and alerts
8. ⏳ Train users and go live!

## Support

For Hostinger-specific issues:
- Hostinger Knowledge Base: https://support.hostinger.com
- Submit a ticket through Hostinger panel

For application issues:
- Check application logs
- Review error messages
- Contact development team
