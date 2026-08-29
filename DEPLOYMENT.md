# 🚀 DEPLOYMENT GUIDE - Expense Tracker

Complete step-by-step deployment guide for production.

---

## 📋 Pre-Deployment Checklist

- [ ] All features tested locally
- [ ] Environment variables configured
- [ ] Database backups created
- [ ] API endpoints verified
- [ ] Frontend builds without errors
- [ ] Mobile responsiveness tested
- [ ] PWA installability verified
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Error logging setup

---

## 🔧 Production Environment Setup

### 1. MongoDB Atlas Setup

```bash
# 1. Go to mongodb.com/atlas
# 2. Create a cluster (shared tier is free)
# 3. Create database user
# 4. Get connection string
# 5. Add IP whitelist (0.0.0.0/0 for development, specific IPs for production)

# Connection string format:
mongodb+srv://username:password@cluster.mongodb.net/expense_tracker?retryWrites=true
```

### 2. Backend Deployment (Render)

```bash
# 1. Push code to GitHub
git push origin main

# 2. Go to render.com and sign up
# 3. Create new Web Service
# 4. Connect your GitHub repository
# 5. Configure:
#    - Build Command: npm install && npm run build
#    - Start Command: npm run start
#    - Environment Variables:
#      * NODE_ENV=production
#      * MONGODB_URI=your_mongodb_connection_string
#      * JWT_SECRET=generate_long_random_string
#      * FRONTEND_URL=https://your-app.vercel.app

# 6. Deploy!
# Your API will be available at: https://your-app.onrender.com
```

### 3. Frontend Deployment (Vercel)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy
cd frontend
vercel deploy --prod

# 4. Set environment variables in Vercel dashboard:
# Settings > Environment Variables
# - VITE_API_URL = https://your-app.onrender.com/api

# Your app will be available at: https://your-app.vercel.app
```

---

## 🔐 Security Configuration

### Backend Security

```bash
# 1. HTTPS Enforcement
# Add to render.yaml or configure in Render dashboard
# Auto-enabled on Render

# 2. CORS Configuration
# Update FRONTEND_URL in environment

# 3. Rate Limiting
# Implement in backend:
npm install express-rate-limit

# 4. Environment Variables
# Never commit .env file
# Keep JWT_SECRET secret (minimum 32 characters)

# 5. Database Security
# - Enable authentication
# - Use strong passwords
# - Whitelist IPs
# - Regular backups
```

### Frontend Security

```bash
# 1. CSP Headers
# Configured via Vercel Edge Middleware

# 2. Remove Debug Endpoints
# Delete /debug routes from production

# 3. API Secrets
# Store API URL in environment, not hardcoded
```

---

## 📊 Monitoring & Logging

### Backend Monitoring

```bash
# 1. Render Dashboard
# - Monitor CPU, Memory, Requests
# - View logs in real-time

# 2. MongoDB Atlas Monitoring
# - Check connection stats
# - Monitor storage usage
# - Set up alerts

# 3. Error Tracking (Optional)
# npm install sentry-node
# Add Sentry integration for error tracking
```

### Frontend Monitoring

```bash
# 1. Vercel Analytics
# Built-in performance monitoring

# 2. PWA Install Tracking
# Monitor app installations

# 3. Error Boundary Logs
# Catch React errors
```

---

## 🚀 Deployment Steps (Quick Reference)

### Step 1: Prepare Code

```bash
# From project root
git add -A
git commit -m "Production release v1.0.0"
git push origin main
```

### Step 2: Deploy Backend

```bash
# Render will auto-detect changes and deploy
# Monitor at: render.com/dashboard

# Get your API URL from Render
# Example: https://expense-tracker-api.onrender.com
```

### Step 3: Deploy Frontend

```bash
# In frontend directory
cd frontend
vercel deploy --prod

# Set VITE_API_URL environment variable
# Go to Vercel Dashboard > Settings > Environment Variables
# Add: VITE_API_URL = https://expense-tracker-api.onrender.com/api

# Redeploy after env change
vercel deploy --prod
```

### Step 4: Test Production

```bash
# 1. Visit your app
https://your-app.vercel.app

# 2. Test all features
# - Signup/Login
# - Add expense
# - View dashboard
# - Check analytics

# 3. Verify API calls
# - Open DevTools Console
# - Check Network tab for API calls
# - Ensure no CORS errors

# 4. Test mobile responsiveness
# - Use DevTools mobile view
# - Test on actual mobile device

# 5. Verify PWA
# - Chrome: Settings > Install app
# - Should be installable
```

---

## ⚠️ Common Issues & Solutions

### Issue: CORS Error

```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**
- Check FRONTEND_URL in backend .env
- Ensure frontend URL matches exactly
- Verify CORS middleware is enabled

### Issue: 404 API Not Found

```
Cannot POST /api/auth/login
```

**Solution:**
- Check API URL in frontend config
- Verify backend is running
- Check route definitions

### Issue: Database Connection Failed

```
connect ECONNREFUSED
```

**Solution:**
- Verify MongoDB URI is correct
- Check IP whitelist in MongoDB Atlas
- Ensure database user has correct permissions

### Issue: Tokens Not Persisting

```
Logout on page refresh
```

**Solution:**
- Check localStorage permissions
- Verify browser privacy mode doesn't block storage
- Check token refresh logic

---

## 🔄 Continuous Deployment

### Auto-Deploy on Git Push

Both Render and Vercel support auto-deployment:

```bash
# Just push to main/master
git push origin main

# Render will auto-deploy backend
# Vercel will auto-deploy frontend

# Monitor deployment status in dashboards
```

### Manual Deployment (If Needed)

```bash
# Backend
# Log into Render dashboard > Select service > Click "Deploy"

# Frontend
# Log into Vercel dashboard > Select project > Click "Deploy"
```

---

## 📱 Mobile PWA Deployment

### Testing PWA in Production

```
1. Visit your app in Chrome/Edge
2. Look for install prompt
3. Install to home screen
4. Open from home screen
5. Test offline functionality
6. Check manifest.json loads
```

### PWA Manifest Verification

```bash
# Visit: https://your-app.vercel.app/manifest.json
# Verify all icons and metadata are present
```

---

## 🔧 Backend Configuration Reference

### Environment Variables (Production)

```bash
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/expense_tracker
JWT_SECRET=long-random-string-minimum-32-characters
FRONTEND_URL=https://your-app.vercel.app
MAX_FILE_SIZE=5242880
UPLOAD_DIR=uploads
```

### Scaling Recommendations

```bash
# Single Instance (Current Setup)
# Supports ~1000 concurrent users

# For larger scale:
# 1. Enable database replication
# 2. Add caching layer (Redis)
# 3. Implement load balancer
# 4. Add CDN for static files
```

---

## 📞 Support & Troubleshooting

### Quick Logs Access

**Backend (Render):**
```
1. Go to render.com/dashboard
2. Select your service
3. Click "Logs" tab
4. View real-time logs
```

**Frontend (Vercel):**
```
1. Go to vercel.com/dashboard
2. Select your project
3. Click "Deployments" tab
4. View build & runtime logs
```

### Database Access

```bash
# MongoDB Atlas Console:
# 1. Go to mongodb.com/atlas
# 2. Select cluster
# 3. Click "Connect" > "Connect with MongoDB Compass"
# 4. Use connection string to connect locally

# Query database:
# mongosh <connection_string>
# use expense_tracker
# db.users.find()
```

---

## 🎉 Post-Deployment Checklist

- [ ] App loads without errors
- [ ] User can signup/login
- [ ] Can add and view expenses
- [ ] Charts display correctly
- [ ] Family features work
- [ ] Mobile responsive works
- [ ] PWA installs successfully
- [ ] All API calls working
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Monitoring configured
- [ ] Backup routine setup

---

**Congratulations! 🎊 Your Expense Tracker is now live!**

For updates and maintenance, repeat the deployment steps. For scaling or issues, refer to the troubleshooting section.
