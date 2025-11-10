# 🪟 Windows Setup Guide - LandParser App

Complete guide to set up and run the LandParser application on Windows.

---

## 📋 Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Choose LTS (Long Term Support) version
   - Verify installation:
     ```cmd
     node --version
     npm --version
     ```

2. **PostgreSQL** (v14 or higher)
   - Download from: https://www.postgresql.org/download/windows/
   - OR use the installer: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
   - **Important**: Remember the password you set for the `postgres` user during installation!

3. **Git** (Optional, for cloning)
   - Download from: https://git-scm.com/download/win

---

## 🚀 Step-by-Step Setup

### Step 1: Install PostgreSQL

1. **Download PostgreSQL Installer**
   - Go to https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
   - Download the latest version for Windows
   - Run the installer

2. **Installation Options**
   - ✅ PostgreSQL Server
   - ✅ pgAdmin 4 (GUI tool)
   - ✅ Command Line Tools
   - Port: `5432` (default)
   - **Set a password for postgres user** (remember this!)

3. **Verify Installation**
   ```cmd
   psql --version
   ```
   If the command is not found, add PostgreSQL to PATH:
   - Default location: `C:\Program Files\PostgreSQL\16\bin`
   - Add to System Environment Variables → Path

---

### Step 2: Create Database

#### Option A: Using pgAdmin (GUI)
1. Open **pgAdmin 4** from Start Menu
2. Connect to PostgreSQL server (use your postgres password)
3. Right-click **Databases** → **Create** → **Database**
4. Database name: `landparser_db`
5. Click **Save**

#### Option B: Using Command Line
1. Open **Command Prompt** or **PowerShell**
2. Run:
   ```cmd
   psql -U postgres
   ```
3. Enter your postgres password
4. Create database:
   ```sql
   CREATE DATABASE landparser_db;
   \q
   ```

---

### Step 3: Clone/Download Project

#### If using Git:
```cmd
git clone <repository-url>
cd LandParser-app
```

#### If downloaded as ZIP:
1. Extract the ZIP file
2. Open Command Prompt in the extracted folder

---

### Step 4: Install Dependencies

```cmd
npm install
```

This will install all required packages including:
- Next.js
- React
- Material-UI
- PostgreSQL driver (pg)
- TypeScript
- And all other dependencies

---

### Step 5: Configure Environment Variables

1. **Create `.env.local` file** in the root directory
2. Copy the contents from `.env.example`:
   ```cmd
   copy .env.example .env.local
   ```

3. **Edit `.env.local`** with your settings:
   ```env
   # Database Configuration
   DB_USER=postgres
   DB_HOST=localhost
   DB_NAME=landparser_db
   DB_PASSWORD=your_actual_postgres_password
   DB_PORT=5432

   # JWT Secret
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

   # Next.js
   NODE_ENV=development
   ```

   **Important**: Replace `your_actual_postgres_password` with the password you set during PostgreSQL installation!

---

### Step 6: Build the Project

```cmd
npm run build
```

This compiles the TypeScript code and prepares the application for running.

---

### Step 7: Start Development Server

```cmd
npm run dev
```

You should see:
```
   ▲ Next.js 15.5.4
   - Local:        http://localhost:3000
   - Network:      http://192.168.x.x:3000

 ✓ Ready in 2.5s
```

**Note**: If port 3000 is in use, the server will use the next available port (3001, 3002, etc.)

---

### Step 8: Initialize Database Tables

The database tables will be automatically created when the application starts. To verify:

1. **Keep the dev server running**
2. Open a **new Command Prompt/PowerShell window**
3. Navigate to project folder
4. Run:
   ```cmd
   curl -X POST http://localhost:3000/api/init-db
   ```

   **If `curl` is not available**, use PowerShell instead:
   ```powershell
   Invoke-WebRequest -Uri http://localhost:3000/api/init-db -Method POST
   ```

   **Or simply visit in browser**: 
   - The tables will auto-initialize on first request

---

### Step 9: Test Database Connection

#### Using Command Line:
```cmd
curl http://localhost:3000/api/test-db
```

Or in **PowerShell**:
```powershell
Invoke-WebRequest -Uri http://localhost:3000/api/test-db
```

#### Using Browser:
Simply open: http://localhost:3000/api/test-db

You should see:
```json
{
  "connected": true,
  "database": "landparser_db",
  "message": "Database connection successful"
}
```

---

### Step 10: Access the Application

1. **Open your browser**
2. Navigate to: http://localhost:3000

#### Demo Accounts:

**User Account:**
- Email: `user@example.com`
- Password: `password` (or any password)
- Features: Submit encroachment reports, view history

**Admin Account:**
- Email: `admin@example.com`
- Password: `password` (or any password)
- Features: View/approve/reject requests, view statistics

---

## 🛠️ Troubleshooting

### Problem: "psql is not recognized"
**Solution**: Add PostgreSQL to PATH
1. Find PostgreSQL bin folder (usually `C:\Program Files\PostgreSQL\16\bin`)
2. Add to System Environment Variables:
   - Right-click **This PC** → **Properties**
   - **Advanced system settings** → **Environment Variables**
   - Under **System variables**, select **Path** → **Edit**
   - Click **New** → Add PostgreSQL bin path
   - Click **OK** → Restart Command Prompt

### Problem: "cannot connect to database"
**Solution**: Check PostgreSQL service
1. Open **Services** (Win + R → type `services.msc`)
2. Find **postgresql-x64-16** (or similar)
3. Right-click → **Start** (if not running)
4. Set **Startup type** to **Automatic**

### Problem: "password authentication failed"
**Solution**: Verify credentials
1. Check `.env.local` has correct password
2. Test connection manually:
   ```cmd
   psql -U postgres -d landparser_db
   ```
3. If password is wrong, you can reset it:
   - Open pgAdmin → Right-click postgres user → Properties → Definition
   - Set new password

### Problem: Port 3000 already in use
**Solution**: The app will automatically use next available port (3001, 3002, etc.)
- Check the terminal output for the actual URL
- Or manually specify a port:
  ```cmd
  npm run dev -- -p 3001
  ```

### Problem: "Module not found" errors
**Solution**: Clean install
```cmd
rmdir /s /q node_modules
rmdir /s /q .next
npm install
npm run build
npm run dev
```

### Problem: Database tables not created
**Solution**: Manual table creation
1. Open **pgAdmin** or **psql**
2. Connect to `landparser_db`
3. Run the SQL from `database/schema.sql` or `database/supabase-schema.sql`

Or use the init endpoint:
```cmd
curl -X POST http://localhost:3000/api/init-db
```

---

## 📂 Project Structure

```
LandParser-app/
├── src/
│   ├── app/              # Next.js app router & API routes
│   ├── components/       # React components
│   ├── contexts/         # React contexts (Auth, Theme)
│   ├── lib/             # Database & utilities
│   └── types/           # TypeScript types
├── database/            # SQL schema files
├── public/             # Static assets
├── .env.local          # Environment variables (create this!)
├── package.json        # Dependencies
└── tsconfig.json       # TypeScript config
```

---

## 🔧 Useful Commands

```cmd
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Check for errors
npm run lint

# Clean build cache
rmdir /s /q .next
```

---

## 🗄️ Database Management

### View Database with pgAdmin
1. Open **pgAdmin 4**
2. Expand **Servers** → **PostgreSQL**
3. Expand **Databases** → **landparser_db**
4. Right-click **Tables** → **Refresh**
5. View `encroachment_submissions` table

### Query Database via Command Line
```cmd
psql -U postgres -d landparser_db
```

Useful queries:
```sql
-- View all submissions
SELECT * FROM encroachment_submissions;

-- Count submissions by status
SELECT status, COUNT(*) FROM encroachment_submissions GROUP BY status;

-- View recent submissions
SELECT id, user_email, status, submitted_at 
FROM encroachment_submissions 
ORDER BY submitted_at DESC 
LIMIT 10;

-- Clear all data (if needed)
DELETE FROM encroachment_submissions;
```

---

## 🚀 Production Deployment

### Build for Production
```cmd
npm run build
```

### Start Production Server
```cmd
npm start
```

### Environment Variables for Production
Update `.env.local` (or use `.env.production`):
```env
NODE_ENV=production
DB_HOST=your-production-db-host
DB_PASSWORD=strong-production-password
JWT_SECRET=very-strong-random-string-here
```

---

## 🔐 Security Notes

1. **Never commit `.env.local`** to Git (already in .gitignore)
2. **Change default passwords** before deployment
3. **Use strong JWT_SECRET** in production
4. **Enable PostgreSQL SSL** for production
5. **Set up proper firewall rules** for database access

---

## 📞 Need Help?

### Check Logs
- **Server logs**: Check the terminal where `npm run dev` is running
- **Database logs**: Check PostgreSQL logs in `C:\Program Files\PostgreSQL\16\data\log`

### Verify Everything is Working
```cmd
# Check Node.js
node --version

# Check npm
npm --version

# Check PostgreSQL
psql --version

# Check if server is running
curl http://localhost:3000

# Check database connection
curl http://localhost:3000/api/test-db
```

---

## ✅ Quick Start Checklist

- [ ] PostgreSQL installed and running
- [ ] Node.js installed (v18+)
- [ ] Project downloaded/cloned
- [ ] Dependencies installed (`npm install`)
- [ ] Database created (`landparser_db`)
- [ ] `.env.local` file created with correct password
- [ ] Project built (`npm run build`)
- [ ] Dev server started (`npm run dev`)
- [ ] Database connection tested (visit `/api/test-db`)
- [ ] Application accessible at http://localhost:3000

---

**🎉 You're all set! Start using the LandParser application.**

For Linux/Mac setup, see the `setup-database.sh` script in the root directory.
