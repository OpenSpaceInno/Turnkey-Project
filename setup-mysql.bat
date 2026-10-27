@echo off
echo ========================================
echo TurnKey Project - MySQL Database Setup
echo ========================================
echo.
echo Please enter your MySQL root password when prompted.
echo.

REM Create the database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS turnkey_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to create database. Please check your MySQL credentials.
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Database created successfully!
echo ========================================
echo.
echo Next, update your .env file with the correct MySQL password:
echo DATABASE_URL=mysql://root:YOUR_PASSWORD@localhost:3306/turnkey_db
echo.
echo Then run: pnpm run setup
echo.
pause
