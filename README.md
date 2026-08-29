# 💰 Expense Tracker - Family Expense Management System

A full-stack, production-ready expense tracking application built with **React + Vite** (Frontend), **Node.js + Express** (Backend), and **MongoDB** (Database).

## ✨ Features

### ✅ Authentication & User Management
- Sign up / Login with email
- JWT-based authentication (15m access, 7d refresh tokens)
- Secure password hashing (bcrypt)
- Profile management
- User preferences (currency, language, timezone)

### ✅ Expense Tracking
- Create/Edit/Delete expenses
- Categorized expenses (Food, Travel, Shopping, Bills, Entertainment, etc.)
- Tags for better organization
- Date filtering and search
- Receipt uploads
- Recurring expenses (Daily, Weekly, Monthly, Yearly)
- Payment method tracking (Cash, Card, UPI, etc.)

### ✅ Family & Sharing
- Create family groups
- Invite family members with different roles (Owner, Member, Viewer)
- Smart expense splitting (equal, percentage, custom)
- Track "Who owes whom"
- Settlement system for clearing balances
- Real-time sync across devices

### ✅ Analytics & Reports
- Dashboard with spending summary
- Monthly trends and comparisons
- Category-wise breakdown (pie charts)
- Spender comparison
- Budget tracking with alerts
- Export to CSV/PDF

### ✅ Mobile Responsive & PWA
- Fully responsive design (mobile, tablet, desktop)
- Installable as PWA app
- Offline support
- Dark mode support

---

## 🛠️ Tech Stack

### Frontend
- **React 18** + TypeScript
- **Vite** - Ultra-fast build tool
- **TailwindCSS** - Utility-first CSS
- **Zustand** - State management
- **TanStack Query** - Data fetching
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **Socket.io** - Real-time sync
- **PWA Plugin** - Installable web app

### Backend
- **Node.js** + Express.js + TypeScript
- **MongoDB** + Mongoose ODM
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Zod** - Input validation
- **Jest + Supertest** - Testing
- **Helmet** - Security headers
- **CORS** - Cross-origin protection

### Deployment
- **Frontend**: Vercel
- **Backend**: Render
- **Database**: MongoDB Atlas

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone repository**
```bash
git clone <repo-url>
cd expense-tracker
```

2. **Backend Setup**
```bash
cd backend
cp .env.example .env
npm install
npm run dev  # Runs on http://localhost:5000
```

3. **Frontend Setup**
```bash
cd frontend
npm install
npm run dev  # Runs on http://localhost:5173
```

### Environment Variables

**Backend (.env)**
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/expense-tracker
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173
```

**Frontend (.env)**
```
VITE_API_URL=http://localhost:5000/api
```

---

## 📁 Project Structure

```
expense-tracker/
├── backend/
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── controllers/   # Business logic
│   │   ├── services/      # Core services
│   │   ├── models/        # MongoDB schemas
│   │   ├── middleware/    # Auth, error handling
│   │   └── utils/         # Helpers
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API calls
│   │   ├── stores/        # Zustand stores
│   │   └── types/         # TypeScript types
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## 📊 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/profile` - Get profile
- `PUT /api/auth/profile` - Update profile

### Expenses
- `POST /api/expenses/:familyId` - Create expense
- `GET /api/expenses/:familyId` - List expenses
- `GET /api/expenses/:familyId/:expenseId` - Get expense
- `PUT /api/expenses/:familyId/:expenseId` - Update expense
- `DELETE /api/expenses/:familyId/:expenseId` - Delete expense

### Family
- `GET /api/families/:familyId` - Get family details
- `POST /api/families/:familyId/members` - Add member
- `DELETE /api/families/:familyId/members/:userId` - Remove member
- `GET /api/families/:familyId/settlements` - Get settlements

### Analytics
- `GET /api/analytics/:familyId/summary` - Dashboard summary
- `GET /api/analytics/:familyId/trends` - Monthly trends
- `GET /api/analytics/:familyId/budgets/status` - Budget status

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test              # Run tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

# Frontend tests (coming soon)
```

---

## 📦 Build & Deploy

### Build
```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build
```

### Deploy to Vercel (Frontend)
```bash
cd frontend
vercel deploy
```

### Deploy to Render (Backend)
```bash
# Connect GitHub repo to Render
# Set environment variables
# Auto-deploy on push
```

---

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ Bcrypt password hashing (10 rounds)
- ✅ Zod input validation
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Rate limiting (planned)
- ✅ 2FA support (planned)
- ✅ Data encryption (planned)

---

## 📱 Features by Device

### Desktop
- Full-featured dashboard
- Charts and reports
- Bulk operations
- Settings

### Mobile
- Responsive design
- Touch-friendly buttons
- Quick expense entry
- Offline support via PWA

### Tablet
- Optimized layout
- Landscape support
- Touch gestures

---

## 🎯 Roadmap

- [ ] 2FA authentication
- [ ] Bill reminders via email
- [ ] Bank sync integration
- [ ] AI-powered insights
- [ ] Mobile app (React Native)
- [ ] Offline mode enhancement
- [ ] Budget forecasting
- [ ] Cryptocurrency support

---

## 📄 License

MIT License - feel free to use this project!

---

## 👨‍💻 Author

**yogitakeswani26**

- GitHub: [@yogitakeswani26](https://github.com/yogitakeswani26)
- Email: yogitakeswani26@gmail.com

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📞 Support

For support, email yogitakeswani26@gmail.com or create an issue in the repository.
