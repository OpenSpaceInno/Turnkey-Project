# TurnKey Project - Complete Setup Script
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "TurnKey Project - Complete Setup and Launch" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Get MySQL password securely
$mysqlPassword = Read-Host "Enter your MySQL root password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($mysqlPassword)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

Write-Host ""
Write-Host "Creating database..." -ForegroundColor Yellow
Write-Host ""

# Create database
$createDbQuery = "CREATE DATABASE IF NOT EXISTS turnkey_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
$mysqlCmd = "mysql -u root -p$plainPassword -e `"$createDbQuery`" 2>&1"

try {
    $result = Invoke-Expression $mysqlCmd
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to create database. Please check your password." -ForegroundColor Red
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "Database created successfully!" -ForegroundColor Green
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Set environment variable
$env:DATABASE_URL = "mysql://root:$plainPassword@localhost:3306/turnkey_db"

Write-Host "Pushing database schema..." -ForegroundColor Yellow
Write-Host ""

# Navigate to project directory
Set-Location "c:\Users\Hari\Downloads\Turnkey Project\TurnKey Project"

# Push schema
pnpm --filter @workspace/db run push

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Failed to push schema." -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "Schema pushed successfully!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

# Update .env file
$envContent = @"
# Database Configuration - MySQL
DATABASE_URL=mysql://root:$plainPassword@localhost:3306/turnkey_db
"@

Set-Content -Path ".env" -Value $envContent

Write-Host "Starting API Server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "The API server will start in a new window." -ForegroundColor Cyan
Write-Host ""

# Start API server in new PowerShell window
$apiScript = @"
`$env:DATABASE_URL='mysql://root:$plainPassword@localhost:3306/turnkey_db'
Set-Location 'c:\Users\Hari\Downloads\Turnkey Project\TurnKey Project'
Write-Host 'Starting API Server...' -ForegroundColor Green
pnpm --filter @workspace/api-server run start
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $apiScript

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "API Server: Starting in separate window..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit this setup window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
