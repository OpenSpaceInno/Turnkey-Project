@echo off
setlocal EnableDelayedExpansion

echo ============================================
echo TurnKey Project - Complete Setup and Launch
echo ============================================
echo.

REM Prompt for MySQL password
set /p MYSQL_PASSWORD="Enter your MySQL root password: "

echo.
echo Creating database...
echo.

REM Create database
mysql -u root -p%MYSQL_PASSWORD% -e "CREATE DATABASE IF NOT EXISTS turnkey_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to create database. Please check your password.
    echo.
    pause
    exit /b 1
)

echo.
echo Database created successfully!
echo.

REM Update environment variable
set DATABASE_URL=mysql://root:%MYSQL_PASSWORD%@localhost:3306/turnkey_db

echo Pushing database schema...
echo.

REM Navigate to project directory
cd /d "c:\Users\Hari\Downloads\Turnkey Project\TurnKey Project"

REM Push schema
pnpm --filter @workspace/db run push

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to push schema.
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo Schema pushed successfully!
echo ============================================
echo.
echo Starting API Server...
echo.
echo The API server will start in a new window.
echo Keep this window open.
echo.

REM Start API server in new window
start "TurnKey API Server" cmd /k "cd /d c:\Users\Hari\Downloads\Turnkey Project\TurnKey Project && set DATABASE_URL=mysql://root:%MYSQL_PASSWORD%@localhost:3306/turnkey_db && pnpm --filter @workspace/api-server run start"

echo.
echo ============================================
echo Setup Complete!
echo ============================================
echo.
echo Frontend is running at: http://localhost:5173
echo API Server is starting in a separate window...
echo.
echo Press any key to exit this setup window.
pause
