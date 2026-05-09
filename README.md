# Employee Management System

A full-stack employee management system with authentication, department management, and attendance tracking.

## Tech Stack

**Frontend:**
- React 18 + Vite
- Tailwind CSS
- Axios
- React Router

**Backend:**
- Node.js + Express
- MySQL
- JWT Authentication
- bcrypt

## Features

- 🔐 JWT-based authentication with role-based access control (Admin, Manager, Employee)
- 👥 Employee CRUD operations
- 🏢 Department management
- ⏰ Attendance tracking (check-in/check-out)
- 📊 Dashboard with statistics
- 🔍 Search and filtering
- 📱 Responsive UI

## Project Structure

```
employee_db/
├── backend/
│   ├── config/          # Database and environment config
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Auth, error handling, validation
│   ├── migrations/      # Database schema and indexes
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── utils/           # Helper functions (JWT, password)
│   └── app.js           # Express app entry point
├── frontend/
│   └── src/
│       ├── components/  # Reusable UI components
│       ├── context/     # React context (Auth)
│       ├── hooks/       # Custom React hooks
│       ├── layouts/     # Layout components
│       ├── pages/       # Page components
│       └── services/    # API service layer
└── README.md
```

## Setup

### Prerequisites

- Node.js 16+
- MySQL 8.0+
- npm or yarn

### Database Setup

1. Create MySQL database:
```bash
mysql -u root -p
CREATE DATABASE employee_db;
exit
```

2. Run migrations:
```bash
mysql -u root -p employee_db < backend/migrations/001_schema.sql
mysql -u root -p employee_db < backend/migrations/002_indexes.sql
```

### Backend Setup

1. Navigate to backend:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Start server:
```bash
npm run dev
```

Backend runs on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env if backend URL is different
```

4. Start dev server:
```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

## Environment Variables

**Backend (.env):**
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=employee_db
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
```

**Frontend (.env):**
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## API Overview

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Employees
- `GET /api/employees` - List all employees
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Departments
- `GET /api/departments` - List all departments
- `POST /api/departments` - Create department
- `PUT /api/departments/:id` - Update department
- `DELETE /api/departments/:id` - Delete department

### Attendance
- `GET /api/attendance` - List attendance records
- `POST /api/attendance/check-in` - Check in
- `POST /api/attendance/check-out` - Check out
- `GET /api/attendance/report` - Attendance report

### Dashboard
- `GET /api/dashboard/overview` - Dashboard statistics
- `GET /api/dashboard/recent-activity` - Recent activity

## Default Login

After setting up, register a user or create one directly in the database:

```sql
INSERT INTO users (username, email, password_hash, role) 
VALUES ('admin', 'admin@example.com', '$2b$10$...', 'admin');
```

Use `POST /api/auth/register` to create the first admin user.

## Development

**Backend:**
```bash
cd backend
npm run dev  # Runs with nodemon
```

**Frontend:**
```bash
cd frontend
npm run dev  # Runs Vite dev server
```

**Build for production:**
```bash
cd frontend
npm run build  # Creates dist/ folder
```

## Deployment

1. Set production environment variables
2. Build frontend: `npm run build`
3. Serve frontend static files from `frontend/dist/`
4. Run backend with `NODE_ENV=production`
5. Use a process manager (PM2) for backend
6. Configure reverse proxy (nginx) for both services

## License

MIT
