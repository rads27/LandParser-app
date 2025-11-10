# LandParser Database Setup Script for Windows (PowerShell)
# ===========================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   LandParser Database Setup (Windows)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to write colored output
function Write-Success {
    param([string]$message)
    Write-Host "[OK] $message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$message)
    Write-Host "[WARNING] $message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$message)
    Write-Host "[ERROR] $message" -ForegroundColor Red
}

function Write-Info {
    param([string]$message)
    Write-Host "[INFO] $message" -ForegroundColor Cyan
}

# Step 1: Check PostgreSQL installation
Write-Host "Step 1: Checking PostgreSQL installation..." -ForegroundColor White
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if ($psqlPath) {
    Write-Success "PostgreSQL is installed"
    & psql --version
} else {
    Write-Warning "PostgreSQL not found!"
    Write-Host ""
    Write-Host "Please install PostgreSQL:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host "2. Run the installer and set a password for postgres user" -ForegroundColor Yellow
    Write-Host "3. Add PostgreSQL bin folder to PATH" -ForegroundColor Yellow
    Write-Host "   Default: C:\Program Files\PostgreSQL\16\bin" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Step 2: Check PostgreSQL service
Write-Host "Step 2: Checking PostgreSQL service..." -ForegroundColor White
$pgService = Get-Service | Where-Object { $_.Name -like "postgresql*" } | Select-Object -First 1

if ($pgService) {
    if ($pgService.Status -eq "Running") {
        Write-Success "PostgreSQL service is running ($($pgService.Name))"
    } else {
        Write-Warning "PostgreSQL service is not running. Starting..."
        try {
            Start-Service $pgService.Name -ErrorAction Stop
            Write-Success "PostgreSQL service started"
        } catch {
            Write-Warning "Could not start service automatically"
            Write-Info "Please start it manually: Services (Win+R -> services.msc)"
            Read-Host "Press Enter after starting the service"
        }
    }
} else {
    Write-Warning "PostgreSQL service not found"
    Write-Info "Please ensure PostgreSQL is properly installed"
}

Write-Host ""

# Step 3: Check environment configuration
Write-Host "Step 3: Checking environment configuration..." -ForegroundColor White
if (Test-Path ".env.local") {
    Write-Success ".env.local file exists"
    Write-Host ""
    Write-Host "Configuration:" -ForegroundColor Cyan
    Get-Content ".env.local" | Where-Object { $_ -notmatch "^#" -and $_ -ne "" }
} else {
    Write-Error-Custom ".env.local not found!"
    Write-Host ""
    if (Test-Path ".env.example") {
        Write-Host "Creating .env.local from .env.example..." -ForegroundColor Yellow
        Copy-Item ".env.example" ".env.local"
        Write-Success ".env.local created"
        Write-Host ""
        Write-Warning "ACTION REQUIRED: Edit .env.local and set your PostgreSQL password"
        Write-Host ""
        $openFile = Read-Host "Open .env.local in notepad now? (y/n)"
        if ($openFile -eq "y" -or $openFile -eq "Y") {
            notepad .env.local
        }
        Read-Host "Press Enter after saving your changes"
    } else {
        Write-Error-Custom ".env.example not found!"
        exit 1
    }
}

Write-Host ""

# Step 4: Get PostgreSQL password
Write-Host "Step 4: Creating database..." -ForegroundColor White
Write-Host ""
Write-Host "Please enter your PostgreSQL postgres user password:" -ForegroundColor Cyan
$pgPassword = Read-Host -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($pgPassword)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Set password environment variable for psql
$env:PGPASSWORD = $plainPassword

Write-Host ""
Write-Host "Dropping existing database (if any)..." -ForegroundColor Gray
& psql -U postgres -c "DROP DATABASE IF EXISTS landparser_db;" 2>$null

Write-Host "Creating database 'landparser_db'..." -ForegroundColor Gray
& psql -U postgres -c "CREATE DATABASE landparser_db;"

if ($LASTEXITCODE -eq 0) {
    Write-Success "Database 'landparser_db' created successfully"
} else {
    Write-Error-Custom "Failed to create database"
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Verify PostgreSQL is running" -ForegroundColor Yellow
    Write-Host "2. Check your postgres user password" -ForegroundColor Yellow
    Write-Host "3. Try creating database manually in pgAdmin" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    $env:PGPASSWORD = $null
    exit 1
}

# Clear password from environment
$env:PGPASSWORD = $null

Write-Host ""

# Step 5: Check Node.js and dependencies
Write-Host "Step 5: Checking Node.js and dependencies..." -ForegroundColor White
$nodePath = Get-Command node -ErrorAction SilentlyContinue
if ($nodePath) {
    Write-Success "Node.js is installed"
    & node --version
    & npm --version
} else {
    Write-Error-Custom "Node.js not found!"
    Write-Host "Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Step 6: Install dependencies
if (!(Test-Path "node_modules")) {
    Write-Host "Installing npm dependencies..." -ForegroundColor White
    & npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Dependencies installed"
    } else {
        Write-Error-Custom "Failed to install dependencies"
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Success "Dependencies already installed"
}

Write-Host ""

# Step 7: Build project
Write-Host "Step 6: Building the project..." -ForegroundColor White
& npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Success "Project built successfully"
} else {
    Write-Error-Custom "Build failed"
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Step 8: Instructions for database initialization
Write-Host "Step 7: Database initialization..." -ForegroundColor White
Write-Host ""
Write-Info "The database tables will be initialized when you start the server."
Write-Host "After starting the server with 'npm run dev', tables will be created automatically." -ForegroundColor Gray
Write-Host ""
Write-Host "You can also manually initialize by:" -ForegroundColor Gray
Write-Host "  1. Visiting: http://localhost:3000/api/init-db" -ForegroundColor Gray
Write-Host "  2. Or running: Invoke-WebRequest -Uri http://localhost:3000/api/init-db -Method POST" -ForegroundColor Gray
Write-Host ""

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Success "Database Setup Complete!"
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start the development server:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Open your browser:" -ForegroundColor White
Write-Host "   http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Login with demo accounts:" -ForegroundColor White
Write-Host "   User:  user@example.com  (any password)" -ForegroundColor Yellow
Write-Host "   Admin: admin@example.com (any password)" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Test database connection:" -ForegroundColor White
Write-Host "   Visit: http://localhost:3000/api/test-db" -ForegroundColor Yellow
Write-Host ""
Write-Host "5. Submit a test encroachment request and verify" -ForegroundColor White
Write-Host "   it persists after server restart!" -ForegroundColor Yellow
Write-Host ""
Write-Success "Your data will now persist in PostgreSQL!"
Write-Host ""
Read-Host "Press Enter to exit"
