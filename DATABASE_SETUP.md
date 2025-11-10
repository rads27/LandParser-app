# Database Integration Setup Guide

## ✅ Database Integration Complete

The LandParser app now supports **PostgreSQL database persistence** with automatic fallback to in-memory storage.

---

## 🎯 How It Works

### Automatic Storage Selection:

**With Database Configured:**
- ✅ All data persists in PostgreSQL
- ✅ Survives server restarts
- ✅ Production-ready

**Without Database Configured:**
- ⚠️ Falls back to in-memory storage
- ⚠️ Data lost on restart
- ⚠️ Demo/development only

---

## 📋 Quick Setup (3 Steps)

### Step 1: Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Windows:**
Download from: https://www.postgresql.org/download/windows/

### Step 2: Create Database

```bash
# Access PostgreSQL
sudo -u postgres psql

# Create database
CREATE DATABASE landparser_db;

# Create user (optional, or use postgres user)
CREATE USER landparser WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE landparser_db TO landparser;

# Exit
\q
```

### Step 3: Configure Environment

Create `.env.local` file:

```env
# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=landparser_db
DB_PASSWORD=your_secure_password
DB_PORT=5432

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this
```

---

## 🚀 Initialize Database

### Option A: API Route (Recommended)

```bash
# Start the app
npm run dev

# Initialize tables (one-time setup)
curl -X POST http://localhost:3000/api/init-db
```

**Response:**
```json
{
  "success": true,
  "message": "Database tables initialized successfully"
}
```

### Option B: SQL Script

```bash
psql -U postgres -d landparser_db -f database/schema.sql
```

---

## 🧪 Test Connection

```bash
# Test database connectivity
curl http://localhost:3000/api/test-db
```

**Success Response:**
```json
{
  "success": true,
  "configured": true,
  "connected": true,
  "message": "Database connection successful"
}
```

**Not Configured Response:**
```json
{
  "success": false,
  "configured": false,
  "message": "Database not configured",
  "hint": "Set DB_USER, DB_HOST, DB_NAME, and DB_PASSWORD in .env.local"
}
```

---

## 🔍 How to Verify

### 1. Check Storage Mode

Look for this in API responses:
```json
{
  "success": true,
  "data": [...],
  "storage": "database"  // ← "database" or "memory"
}
```

### 2. Check Console Logs

```
Encroachment API: Submission saved to database: 1
Admin API: Storage: database
```

### 3. Test Persistence

```bash
# Submit a request
# Restart server: Ctrl+C then npm run dev
# Check if request still exists
curl "http://localhost:3000/api/encroachment?userEmail=user@example.com"
```

**With Database:** Data persists ✅  
**Without Database:** Data lost ❌

---

## 📊 Database Schema

### Table: `encroachment_submissions`

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Auto-increment ID |
| user_email | VARCHAR(255) | User's email |
| file_name | VARCHAR(255) | Uploaded filename |
| file_data | TEXT | Base64 encoded image |
| file_type | VARCHAR(100) | MIME type |
| status | VARCHAR(20) | pending/approved/rejected |
| submitted_at | TIMESTAMP | Submission time |
| processed_at | TIMESTAMP | Admin action time |
| admin_notes | TEXT | Admin comments |
| complaint_details | JSONB | Form data (11 fields) |

### Indexes:
- `idx_submissions_user_email` - Fast user lookups
- `idx_submissions_status` - Fast status filtering
- `idx_submissions_submitted_at` - Fast date filtering

---

## 🔄 Migration from In-Memory

**No migration needed!** The app automatically:
1. Detects if database is configured
2. Uses database if available
3. Falls back to memory if not
4. Logs which storage is being used

**To switch from memory to database:**
1. Configure `.env.local` with DB credentials
2. Run `POST /api/init-db`
3. Restart the app
4. New submissions go to database ✅

**Note:** Existing in-memory data is NOT migrated (fresh start)

---

## 🛠️ Troubleshooting

### Issue: "Database connection failed"

**Check:**
1. PostgreSQL is running: `sudo systemctl status postgresql`
2. Database exists: `psql -U postgres -l | grep landparser`
3. Credentials in `.env.local` are correct
4. Port 5432 is not blocked by firewall

**Fix:**
```bash
# Restart PostgreSQL
sudo systemctl restart postgresql

# Test connection manually
psql -U postgres -d landparser_db -c "SELECT NOW();"
```

### Issue: "Table does not exist"

**Fix:**
```bash
curl -X POST http://localhost:3000/api/init-db
```

### Issue: "Still using memory storage"

**Check:**
1. `.env.local` exists in project root
2. `DB_PASSWORD` is set (this triggers database mode)
3. Restart server after creating `.env.local`

### Issue: "Permission denied for database"

**Fix:**
```sql
-- Grant permissions
sudo -u postgres psql
GRANT ALL PRIVILEGES ON DATABASE landparser_db TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
\q
```

---

## 🔐 Security Notes

### Production Checklist:

- [ ] Use strong database password
- [ ] Use strong JWT_SECRET (32+ random characters)
- [ ] Don't commit `.env.local` to git (already in .gitignore)
- [ ] Use SSL for database connections in production
- [ ] Restrict database access to application server only
- [ ] Regular backups configured

### Generate Secure Secrets:

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate database password
openssl rand -base64 32
```

---

## 📈 Performance

### Current Implementation:
- **Connection Pooling:** ✅ Enabled (pg pool)
- **Indexes:** ✅ On email, status, date
- **Query Optimization:** ✅ SELECT only needed columns
- **Connection Reuse:** ✅ Pool manages connections

### Recommended for Production:
- Enable connection pooling (already done)
- Set `max` pool size based on load (default: 10)
- Monitor slow queries
- Consider read replicas for scaling

---

## 🔄 Backup & Restore

### Backup:
```bash
# Full database backup
pg_dump -U postgres landparser_db > backup.sql

# Data only
pg_dump -U postgres --data-only landparser_db > data_backup.sql
```

### Restore:
```bash
# Restore full backup
psql -U postgres landparser_db < backup.sql

# Restore data only
psql -U postgres landparser_db < data_backup.sql
```

### Automated Backups:
```bash
# Add to crontab (daily at 2 AM)
0 2 * * * pg_dump -U postgres landparser_db > /backups/landparser_$(date +\%Y\%m\%d).sql
```

---

## 🚀 What Changed

### Files Modified:

1. **`src/lib/database.ts`** (NEW)
   - Complete database operations
   - Connection pooling
   - Error handling
   - Type mapping

2. **`src/lib/config.ts`** (NEW)
   - Environment configuration
   - Auto-detection logic
   - Validation helpers

3. **`src/app/api/encroachment/route.ts`**
   - Database integration with fallback
   - Storage mode logging

4. **`src/app/api/admin/requests/route.ts`**
   - Database queries
   - Error handling with fallback

5. **`src/app/api/admin/stats/route.ts`**
   - Database statistics queries
   - Performance optimizations

6. **`src/app/api/init-db/route.ts`** (NEW)
   - One-click table creation
   - Connection validation

7. **`src/app/api/test-db/route.ts`** (NEW)
   - Connection testing
   - Configuration checks

8. **`.env.example`** (NEW)
   - Environment template
   - Documentation

---

## ✅ Benefits

### Before (In-Memory Only):
- ❌ Data lost on restart
- ❌ Not scalable
- ❌ Demo only

### After (Database):
- ✅ **Persistent storage**
- ✅ **Production-ready**
- ✅ **Scalable** (can handle thousands of requests)
- ✅ **Reliable** (ACID guarantees)
- ✅ **Backup-able**
- ✅ **Queryable** (complex filters, reports)
- ✅ **Multi-instance** (multiple servers can share DB)
- ✅ **Automatic fallback** (works without DB for demos)

---

## 📝 Next Steps

### For Development:
```bash
# 1. No setup needed - works with in-memory storage
npm run dev

# App runs in memory mode (data resets on restart)
```

### For Production:
```bash
# 1. Install PostgreSQL
# 2. Create database
# 3. Configure .env.local
# 4. Initialize tables
curl -X POST http://localhost:3000/api/init-db

# 5. Test connection
curl http://localhost:3000/api/test-db

# 6. Deploy
npm run build
npm start
```

---

## 🎉 Summary

**Database integration is COMPLETE and PRODUCTION-READY!**

- ✅ PostgreSQL support with automatic table creation
- ✅ Smart fallback to in-memory for demos
- ✅ No code changes needed - automatic detection
- ✅ Full CRUD operations for submissions
- ✅ Statistics and analytics queries
- ✅ Connection pooling and error handling
- ✅ Easy setup with environment variables
- ✅ Testing and initialization APIs

**The app now works in two modes:**
1. **Database Mode** (when configured) - Production-ready ✅
2. **Memory Mode** (fallback) - Demo/development ⚠️

Configure `.env.local` to enable database mode!
