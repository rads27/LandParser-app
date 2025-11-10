@echo off
REM LandParser Database Setup Script for Windows
REM ============================================

echo.
echo ========================================
echo    LandParser Database Setup (Windows)
echo ========================================
echo.

REM Check if PostgreSQL is installed
echo Step 1: Checking PostgreSQL installation...
where psql >nul 2>&1
if %errorlevel% equ 0 (
    echo [32m[OK] PostgreSQL is installed[0m
    psql --version
) else (
    echo [33m[WARNING] PostgreSQL not found![0m
    echo.
    echo Please install PostgreSQL:
    echo 1. Download from: https://www.postgresql.org/download/windows/
    echo 2. Run the installer
    echo 3. Remember the postgres user password
    echo 4. Add PostgreSQL bin folder to PATH
    echo    Default: C:\Program Files\PostgreSQL\16\bin
    echo.
    pause
    exit /b 1
)

echo.
echo Step 2: Checking PostgreSQL service status...
sc query postgresql-x64-16 | find "RUNNING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [32m[OK] PostgreSQL service is running[0m
) else (
    echo [33m[WARNING] PostgreSQL service not running. Starting...[0m
    sc start postgresql-x64-16 >nul 2>&1
    if %errorlevel% equ 0 (
        echo [32m[OK] PostgreSQL service started[0m
    ) else (
        echo [33m[INFO] Please start PostgreSQL service manually:[0m
        echo        Services (Win+R -^> services.msc) -^> postgresql-x64-16 -^> Start
        pause
    )
)

echo.
echo Step 3: Checking environment configuration...
if exist ".env.local" (
    echo [32m[OK] .env.local file exists[0m
    echo.
    echo Configuration:
    findstr /v "^#" .env.local | findstr /v "^$"
) else (
    echo [31m[ERROR] .env.local not found![0m
    echo.
    echo Creating .env.local from .env.example...
    if exist ".env.example" (
        copy .env.example .env.local >nul
        echo [32m[OK] .env.local created[0m
        echo [33m[ACTION REQUIRED] Please edit .env.local and set your PostgreSQL password[0m
        echo.
        pause
    ) else (
        echo [31m[ERROR] .env.example not found either![0m
        exit /b 1
    )
)

echo.
echo Step 4: Creating database...
echo Please enter your PostgreSQL postgres user password when prompted:
echo.

REM Create database (will prompt for password)
psql -U postgres -c "DROP DATABASE IF EXISTS landparser_db;" 2>nul
psql -U postgres -c "CREATE DATABASE landparser_db;"

if %errorlevel% equ 0 (
    echo [32m[OK] Database 'landparser_db' created successfully[0m
) else (
    echo [31m[ERROR] Failed to create database[0m
    echo.
    echo Troubleshooting:
    echo 1. Make sure PostgreSQL is running
    echo 2. Check your postgres user password
    echo 3. Try creating database manually in pgAdmin
    echo.
    pause
    exit /b 1
)

echo.
echo Step 5: Checking Node.js and dependencies...
where node >nul 2>&1
if %errorlevel% equ 0 (
    echo [32m[OK] Node.js is installed[0m
    node --version
) else (
    echo [31m[ERROR] Node.js not found![0m
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

echo.
if not exist "node_modules" (
    echo Installing npm dependencies...
    call npm install
    if %errorlevel% equ 0 (
        echo [32m[OK] Dependencies installed[0m
    ) else (
        echo [31m[ERROR] Failed to install dependencies[0m
        pause
        exit /b 1
    )
) else (
    echo [32m[OK] Dependencies already installed[0m
)

echo.
echo Step 6: Building the project...
call npm run build
if %errorlevel% equ 0 (
    echo [32m[OK] Project built successfully[0m
) else (
    echo [31m[ERROR] Build failed[0m
    pause
    exit /b 1
)

echo.
echo Step 7: Database initialization...
echo.
echo The database tables will be initialized when you start the server.
echo After starting the server with 'npm run dev', the tables will be created automatically.
echo.
echo You can also manually initialize by visiting:
echo   http://localhost:3000/api/init-db
echo.
echo Or using curl/PowerShell:
echo   curl -X POST http://localhost:3000/api/init-db
echo   OR
echo   Invoke-WebRequest -Uri http://localhost:3000/api/init-db -Method POST
echo.

echo.
echo ============================================
echo [32m[SUCCESS] Database Setup Complete![0m
echo ============================================
echo.
echo Next steps:
echo.
echo 1. Start the development server:
echo    npm run dev
echo.
echo 2. Open your browser:
echo    http://localhost:3000
echo.
echo 3. Login with demo accounts:
echo    User:  user@example.com  (any password)
echo    Admin: admin@example.com (any password)
echo.
echo 4. Test database connection:
echo    Visit: http://localhost:3000/api/test-db
echo.
echo 5. Submit a test encroachment request and verify
echo    it persists after server restart!
echo.
echo [32mYour data will now persist in PostgreSQL! [0m
echo.
pause
