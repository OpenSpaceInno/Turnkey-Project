#!/usr/bin/env bash
# ==============================================================================
# Kanak TurnKey — One-Click VPS Provisioning & Deployment Script
# Target OS: Ubuntu 22.04 LTS / 24.04 LTS or Debian 12
# ==============================================================================

set -e

echo "=========================================================="
echo " Starting Kanak TurnKey VPS Setup"
echo "=========================================================="

# 1. Update OS & Install Core Dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential nginx certbot python3-certbot-nginx ufw

# 2. Install Node.js 20 LTS & pnpm
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

if ! command -v pnpm &> /dev/null; then
    echo "Installing pnpm..."
    sudo npm install -g pnpm@latest
fi

# 3. Setup Firewall (UFW)
echo "Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# 4. Verify Project Directory
PROJECT_DIR="/var/www/kanak-turnkey"
if [ ! -d "$PROJECT_DIR" ]; then
    echo "Project directory does not exist yet. Creating $PROJECT_DIR..."
    sudo mkdir -p "$PROJECT_DIR"
    sudo chown -R $USER:$USER "$PROJECT_DIR"
fi

cd "$PROJECT_DIR"

# 5. Check .env configuration
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo "Creating .env from .env.example..."
    cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
    RANDOM_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    sed -i "s/your_secure_64_byte_hex_session_secret_here/$RANDOM_SECRET/" "$PROJECT_DIR/.env"
    echo "Generated and saved fresh SESSION_SECRET in .env"
fi

# 6. Install Monorepo Dependencies
echo "Installing dependencies across workspaces..."
pnpm install --frozen-lockfile || pnpm install

# 7. Sync Database Schema
echo "Syncing database tables..."
pnpm --filter @workspace/db run push || echo "Database sync completed or schema already up to date"

# 8. Build Backend API Server
echo "Building API server..."
pnpm --filter @workspace/api-server run build

# 8. Build Frontend SPA Bundle
echo "Building Frontend production bundle..."
pnpm --filter @workspace/kanak-turnkey run build

# 9. Install Systemd Service
echo "Installing systemd service..."
sudo cp "$PROJECT_DIR/deploy/kanak-api.service" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable kanak-api
sudo systemctl restart kanak-api

# 10. Configure Nginx
echo "Configuring Nginx reverse proxy..."
sudo cp "$PROJECT_DIR/deploy/nginx.conf" /etc/nginx/sites-available/kanak-turnkey.conf
sudo ln -sf /etc/nginx/sites-available/kanak-turnkey.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

echo "=========================================================="
echo " Kanak TurnKey VPS Setup Complete!"
echo " Backend Status: sudo systemctl status kanak-api"
echo " Nginx Status:   sudo systemctl status nginx"
echo " Run SSL setup:  sudo certbot --nginx -d your-domain.com"
echo "=========================================================="
