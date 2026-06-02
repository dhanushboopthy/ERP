# Hostinger MySQL Database Setup Guide

## Step 1: Create MySQL Database on Hostinger

### On the Hostinger Management Panel:

1. **Fill in the Create Database Form:**
   - **MySQL database name**: `u244866688_sudhan_erp` (or your preferred name)
   - **MySQL username**: `u244866688_erpuser` (or your preferred username)
   - **Password**: Create a strong password (save it securely!)

2. **Click "Create"** button

3. **Note down these credentials:**
   - Database Host: `localhost` (when running on the same server)
   - Database Host (remote): Check your Hostinger MySQL remote access settings
   - Database Name: `u244866688_sudhan_erp`
   - Username: `u244866688_erpuser`
   - Password: [Your Password]
   - Port: `3306` (default MySQL port)

## Step 2: Get MySQL Remote Access Information

1. In Hostinger panel, go to **Databases** → **Remote MySQL**
2. Add your IP address to allowed hosts
3. Note the remote MySQL hostname (usually different from localhost)

## Connection String Format

For production deployment on Hostinger:
```
Server=localhost;Port=3306;Database=u244866688_sudhan_erp;Uid=u244866688_erpuser;Pwd=YOUR_PASSWORD;SslMode=Preferred;
```

For remote access during development:
```
Server=YOUR_REMOTE_HOST;Port=3306;Database=u244866688_sudhan_erp;Uid=u244866688_erpuser;Pwd=YOUR_PASSWORD;SslMode=Preferred;
```

## Step 3: Security Best Practices

1. **Never commit passwords to source control**
2. Use environment variables for production:
   - `MYSQL_HOST`
   - `MYSQL_DATABASE`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`

3. **Update appsettings.Production.json** to use environment variables
4. **Enable SSL/TLS** for remote connections

## Step 4: Database Migration

After setting up MySQL connection:
1. Run Entity Framework migrations to create tables
2. Run SeedData to populate initial data
3. Test all CRUD operations

## Next Steps

1. Complete the MySQL database creation in Hostinger
2. Update the connection strings in your project (already configured in this setup)
3. Run database migrations
4. Deploy your application to Hostinger
