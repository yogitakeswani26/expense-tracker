# 🚀 Setup Guide - Expense Tracker

## Option 1: Local Development (Recommended)

### Prerequisites
- Node.js 18+
- MongoDB (local) OR MongoDB Atlas account
- Git

### Quick Start (5 minutes)

```bash
# 1. Clone and install backend
git clone <repo-url>
cd expense-tracker/backend
npm install
cp .env.example .env

# 2. Update .env with your MongoDB URI
nano .env
# MONGODB_URI=mongodb://localhost:27017/expense-tracker

# 3. Start backend
npm run dev
# Backend running on http://localhost:5000

# 4. In another terminal, install frontend
cd ../frontend
npm install

# 5. Start frontend
npm run dev
# Frontend running on http://localhost:5173

# 6. Open browser and go to http://localhost:5173
```

---

## Option 2: Docker Development

### Prerequisites
- Docker & Docker Compose installed

### Quick Start

```bash
# Start MongoDB + Backend + Frontend
docker-compose up

# Or just MongoDB
docker-compose up mongodb

# Backend: http://localhost:5000
# Frontend: http://localhost:5173
```

---

## Option 3: Production Deployment

### Deploy Frontend to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd frontend
vercel deploy --prod

# Set environment variable
vercel env add VITE_API_URL https://your-api.onrender.com/api
```

### Deploy Backend to Render

1. Push code to GitHub
2. Go to [Render.com](https://render.com)
3. Create New > Web Service
4. Connect GitHub repo
5. Set build command: `npm install && npm run build`
6. Set start command: `npm run start`
7. Add environment variables:
   - `MONGODB_URI` - MongoDB Atlas connection string
   - `JWT_SECRET` - Random secret key
   - `FRONTEND_URL` - https://your-app.vercel.app

---

## Environment Variables

### Backend (.env)

```
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/expense-tracker

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Frontend
FRONTEND_URL=http://localhost:5173

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=uploads
```

### Frontend (.env or vercel env)

```
VITE_API_URL=http://localhost:5000/api
```

---

## MongoDB Setup

### Option A: Local MongoDB

```bash
# Install MongoDB (macOS)
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Connect
mongosh mongodb://localhost:27017/expense-tracker
```

### Option B: MongoDB Atlas (Cloud)

1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create free cluster
3. Get connection string
4. Use in `.env`:
   ```
   MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/expense-tracker
   ```

---

## API Testing

### Using Postman or Insomnia

**Base URL**: `http://localhost:5000/api`

**1. Sign Up**
```bash
POST /auth/signup
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**2. Login**
```bash
POST /auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

**3. Create Expense**
```bash
POST /expenses/:familyId
Authorization: Bearer <accessToken>
{
  "description": "Coffee",
  "amount": 250,
  "category": "Food",
  "date": "2024-08-07"
}
```

---

## Database Seeding (Optional)

```bash
cd backend
node scripts/seed.js
```

---

## Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Make sure MongoDB is running
```bash
# macOS
brew services start mongodb-community

# Or use MongoDB Atlas
```

### CORS Error
```
Access to XMLHttpRequest blocked by CORS
```
**Solution**: Check FRONTEND_URL in backend .env

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use different port
PORT=5001 npm run dev
```

---

## Development Scripts

### Backend
```bash
npm run dev           # Start dev server with hot reload
npm run build         # Build TypeScript to JavaScript
npm run start         # Start production server
npm run test          # Run tests
npm run test:watch   # Tests in watch mode
npm run test:coverage # Coverage report
```

### Frontend
```bash
npm run dev           # Start dev server with Vite
npm run build         # Build for production
npm run preview       # Preview production build
npm run lint          # Run ESLint
```

---

## Next Steps

1. ✅ Setup locally
2. ✅ Test API endpoints
3. ✅ Build UI components (Dashboard, Expenses, Analytics)
4. ✅ Integrate authentication
5. ✅ Add PWA features
6. ✅ Deploy to Vercel + Render

---

## Support

For issues, check logs:

```bash
# Backend logs
cat backend/.logs

# MongoDB logs
brew log mongodb-community

# Frontend console
# Press F12 in browser
```

---

**Happy coding! 🚀**
