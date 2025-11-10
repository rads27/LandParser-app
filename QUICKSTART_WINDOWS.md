# 🚀 Quick Start - Windows

**Choose your preferred method:**

---

## Method 1: Automated Setup (Easiest) ⭐

### Using PowerShell (Recommended)
```powershell
# Right-click setup-database.ps1 -> Run with PowerShell
# OR open PowerShell in project folder:
.\setup-database.ps1
```

### Using Command Prompt
```cmd
# Double-click setup-database.bat
# OR open CMD in project folder:
setup-database.bat
```

**The script will:**
- ✅ Check PostgreSQL installation
- ✅ Create database
- ✅ Install dependencies
- ✅ Build project
- ✅ Guide you through configuration

---

## Method 2: Manual Setup

### 1️⃣ Install PostgreSQL
- Download: https://www.postgresql.org/download/windows/
- Install and **remember the password!**

### 2️⃣ Create Database
```cmd
psql -U postgres
CREATE DATABASE landparser_db;
\q
```

### 3️⃣ Configure Environment
```cmd
copy .env.example .env.local
notepad .env.local
```
Update `DB_PASSWORD` with your postgres password

### 4️⃣ Install & Run
```cmd
npm install
npm run build
npm run dev
```

### 5️⃣ Open Browser
http://localhost:3000

---

## Need Detailed Instructions?

📖 **See: [WINDOWS_SETUP.md](WINDOWS_SETUP.md)** for complete guide with:
- Prerequisites
- Troubleshooting
- Step-by-step screenshots
- Common errors & solutions

---

## Quick Test

**After setup, verify everything works:**

```powershell
# Test database connection
Invoke-WebRequest -Uri http://localhost:3000/api/test-db

# Should show: "connected": true
```

**Or open in browser:** http://localhost:3000/api/test-db

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| User | user@example.com | any password |
| Admin | admin@example.com | any password |

---

## Common Issues

### "psql is not recognized"
➡️ Add PostgreSQL to PATH: `C:\Program Files\PostgreSQL\16\bin`

### "Cannot connect to database"
➡️ Check PostgreSQL service is running (services.msc)

### Port 3000 in use
➡️ App will auto-use next port (check terminal output)

### Need help?
➡️ See **WINDOWS_SETUP.md** for detailed troubleshooting

---

**🎉 Ready to go! Access the app at http://localhost:3000**
