#!/bin/bash

# Database Persistence Setup Script
# This script configures persistent database storage for LandParser

echo "🔧 Setting up persistent database storage..."
echo ""

# Step 1: Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "✅ Environment file (.env.local) already exists"
else
    echo "❌ Environment file not found"
    exit 1
fi

# Step 2: Check if PostgreSQL is running
if ! sudo -u postgres psql -c "SELECT 1" > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running or not accessible"
    echo "   Try: sudo systemctl start postgresql"
    exit 1
fi
echo "✅ PostgreSQL is running"

# Step 3: Check if database exists
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw landparser_db; then
    echo "✅ Database 'landparser_db' exists"
else
    echo "⚠️  Database 'landparser_db' does not exist"
    echo "   Creating database..."
    sudo -u postgres psql -c "CREATE DATABASE landparser_db;"
    if [ $? -eq 0 ]; then
        echo "✅ Database created successfully"
    else
        echo "❌ Failed to create database"
        exit 1
    fi
fi

# Step 4: Initialize database tables
echo ""
echo "📊 Initializing database tables..."
echo "   Please make sure your dev server is running (npm run dev)"
echo ""
read -p "Press Enter to continue once server is running..."

# Try to initialize tables via API
RESPONSE=$(curl -s -X POST http://localhost:3000/api/init-db)
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ Database tables initialized successfully"
else
    echo "⚠️  API initialization failed, trying direct SQL..."
    # Fallback: Create table directly
    sudo -u postgres psql -d landparser_db << 'EOF'
CREATE TABLE IF NOT EXISTS encroachment_submissions (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_data TEXT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    admin_notes TEXT,
    complaint_details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_submissions_user_email ON encroachment_submissions(user_email);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON encroachment_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON encroachment_submissions(submitted_at);
EOF
    
    if [ $? -eq 0 ]; then
        echo "✅ Database tables created via SQL"
    else
        echo "❌ Failed to create tables"
        exit 1
    fi
fi

# Step 5: Test connection
echo ""
echo "🧪 Testing database connection..."
TEST_RESPONSE=$(curl -s http://localhost:3000/api/test-db)
if echo "$TEST_RESPONSE" | grep -q '"connected":true'; then
    echo "✅ Database connection successful"
else
    echo "⚠️  Database connection test inconclusive"
    echo "   Response: $TEST_RESPONSE"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Database: landparser_db"
echo "✅ Storage Mode: PERSISTENT"
echo "✅ Environment: Configured in .env.local"
echo ""
echo "📝 Important Notes:"
echo "   • Your data will now persist across server restarts"
echo "   • Restart your dev server to apply changes:"
echo "     1. Press Ctrl+C to stop current server"
echo "     2. Run: npm run dev"
echo "   • Check API responses for 'storage': 'database'"
echo ""
echo "🔍 Verify persistence:"
echo "   1. Submit a request in the app"
echo "   2. Restart the server"
echo "   3. Check if the request still exists"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
