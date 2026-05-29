# VPS Deployment Guide — khatema.nitg-eg.com

Ubuntu server, same machine for frontend + backend, existing remote MySQL.

---

## 1. First-time server setup (run once as root)

```bash
# Update system
apt update && apt upgrade -y

# Install Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2, Redis, Nginx, Certbot
npm install -g pm2
apt install -y redis-server nginx certbot python3-certbot-nginx

# Start Redis and enable on boot
systemctl enable --now redis-server

# Create app directory
mkdir -p /var/www/khatema
```

---

## 2. Point DNS

In your DNS panel, add an **A record**:
```
khatema.nitg-eg.com  →  <your VPS IP>
```
Wait for propagation (usually 5–30 min) before running Certbot.

---

## 3. Clone the repo

```bash
cd /var/www
git clone -b main https://github.com/nitgNITG/khatema.git
```

---

## 4. Create environment files

### Backend — `/var/www/khatema/backend/.env`
```env
NODE_ENV=production
BACKEND_PORT=3001

DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/khatema"

REDIS_URL="redis://127.0.0.1:6379"

JWT_SECRET="change-this-to-a-long-random-string"

FRONTEND_URL="https://khatema.nitg-eg.com"

GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="https://khatema.nitg-eg.com/api/v1/auth/google/callback"

SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="nit.eg.co@gmail.com"
SMTP_PASS="your-gmail-app-password"
SMTP_FROM="ختمة <nit.eg.co@gmail.com>"
```

### Frontend — `/var/www/khatema/frontend/.env.local`
```env
NEXT_PUBLIC_API_URL=https://khatema.nitg-eg.com/api/v1
```

---

## 5. Update Google OAuth redirect URI

Go to [console.cloud.google.com](https://console.cloud.google.com) → your OAuth app → Authorized redirect URIs → add:
```
https://khatema.nitg-eg.com/api/v1/auth/google/callback
```

---

## 6. Nginx config

```bash
cp /var/www/khatema/nginx/khatema.nitg-eg.com.conf /etc/nginx/sites-available/khatema
ln -s /etc/nginx/sites-available/khatema /etc/nginx/sites-enabled/khatema
rm -f /etc/nginx/sites-enabled/default

# Test config (will warn about missing SSL certs — that's OK before Certbot)
nginx -t
```

---

## 7. SSL with Certbot

```bash
# Temporarily serve HTTP only to get the certificate
# Edit the nginx config: comment out the 443 block and the redirect,
# add a plain listen 80 block, then:
systemctl start nginx

# Run Certbot
certbot --nginx -d khatema.nitg-eg.com

# Certbot auto-edits the config. Restore the full config:
cp /var/www/khatema/nginx/khatema.nitg-eg.com.conf /etc/nginx/sites-available/khatema
nginx -t && systemctl reload nginx
```

---

## 8. First deploy

```bash
chmod +x /var/www/khatema/deploy.sh
/var/www/khatema/deploy.sh main
```

PM2 will start both `khatema-backend` and `khatema-frontend`.

---

## 9. PM2 startup (survive reboots)

```bash
pm2 startup   # Copy and run the printed command
pm2 save
```

---

## Subsequent deploys

Every time you push to `main` and want to deploy:
```bash
/var/www/khatema/deploy.sh main
```

Or from your local machine (add to Makefile or CI):
```bash
ssh root@<VPS_IP> "/var/www/khatema/deploy.sh main"
```

---

## Useful commands

```bash
pm2 status                      # App status
pm2 logs khatema-backend        # Backend logs
pm2 logs khatema-frontend       # Frontend logs
pm2 restart khatema-backend     # Restart backend only
systemctl status nginx          # Nginx status
systemctl status redis-server   # Redis status
```

---

## Checklist

- [ ] DNS A record points to VPS IP
- [ ] `/var/www/khatema/backend/.env` created with real values
- [ ] `/var/www/khatema/frontend/.env.local` created
- [ ] Google OAuth redirect URI updated to production URL
- [ ] Google OAuth secret regenerated (was exposed in git history)
- [ ] Gmail App Password rotated
- [ ] SSL certificate issued via Certbot
- [ ] `pm2 startup` + `pm2 save` run
- [ ] `deploy.sh main` executed successfully
