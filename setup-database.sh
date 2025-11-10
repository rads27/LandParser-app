#!/bin/bash

echo "🚀 LandParser Database Setup Script"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if PostgreSQL is installed
echo "Step 1: Checking PostgreSQL installation..."
if command -v psql &> /dev/null; then
    echo -e "${GREEN}✓ PostgreSQL is installed${NC}"
    psql --version
else
    echo -e "${YELLOW}⚠ PostgreSQL not found. Installing...${NC}"
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
    echo -e "${GREEN}✓ PostgreSQL installed${NC}"
fi

echo ""

# Step 2: Start PostgreSQL service
echo "Step 2: Starting PostgreSQL service..."
sudo systemctl start postgresql
sudo systemctl enable postgresql
echo -e "${GREEN}✓ PostgreSQL service started${NC}"

echo ""

# Step 3: Create database
echo "Step 3: Creating database..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS landparser_db;" 2>/dev/null
sudo -u postgres psql -c "CREATE DATABASE landparser_db;"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database 'landparser_db' created${NC}"
else
    echo -e "${RED}✗ Failed to create database${NC}"
    exit 1
fi

echo ""

# Step 4: Set postgres user password
echo "Step 4: Setting postgres user password..."
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
echo -e "${GREEN}✓ Password set for postgres user${NC}"

echo ""

# Step 5: Verify .env.local exists
echo "Step 5: Checking environment configuration..."
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓ .env.local file exists${NC}"
    echo ""
    echo "Configuration:"
    cat .env.local | grep -v "^#" | grep -v "^$"
else
    echo -e "${RED}✗ .env.local not found${NC}"
    exit 1
fi

echo ""
echo ""

# Step 6: Initialize database tables
echo "Step 6: Initializing database tables..."
echo "Waiting for Next.js server to be ready..."
sleep 3

# Check if server is running
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✓ Server is running${NC}"
    
    echo "Creating tables..."
    RESPONSE=$(curl -s -X POST http://localhost:3000/api/init-db)
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ Database tables initialized successfully${NC}"
    else
        echo -e "${YELLOW}⚠ Server response: $RESPONSE${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Server not running. Please start it with 'npm run dev' and then run:${NC}"
    echo "   curl -X POST http://localhost:3000/api/init-db"
fi

echo ""
echo ""

# Step 7: Test database connection
echo "Step 7: Testing database connection..."
sleep 2
TEST_RESPONSE=$(curl -s http://localhost:3000/api/test-db)

if echo "$TEST_RESPONSE" | grep -q '"connected":true'; then
    echo -e "${GREEN}✓ Database connection successful!${NC}"
else
    echo -e "${YELLOW}⚠ Connection test response: $TEST_RESPONSE${NC}"
fi

echo ""
echo ""
echo "============================================"
echo -e "${GREEN}✅ Database Setup Complete!${NC}"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Restart your Next.js server:"
echo "   - Press Ctrl+C to stop the current server"
echo "   - Run: npm run dev"
echo ""
echo "2. Test the application:"
echo "   - Login as user: user@example.com"
echo "   - Submit an encroachment request"
echo "   - Login as admin: admin@example.com"
echo "   - View and process the request"
echo ""
echo "3. The data will now persist across server restarts! 🎉"
echo ""
