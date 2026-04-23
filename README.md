# CallAI - AI Call Handling SaaS Frontend

A modern, professional SaaS dashboard built with React, TypeScript, Tailwind CSS, and shadcn/ui components.

## 🎯 Overview

This is a complete frontend application for an AI Call Handling SaaS platform with role-based access control for Super Admin and Business Admin users.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (or npm/yarn)

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
src/
├── components/
│   └── layout/
│       ├── Sidebar.tsx          # Navigation sidebar
│       ├── Topbar.tsx           # Top navigation bar
│       └── MainLayout.tsx       # Main layout wrapper
│
├── pages/
│   ├── LandingPage.tsx          # Public landing page
│   ├── LoginPage.tsx            # Login page
│   ├── DashboardPage.tsx        # Main dashboard
│   ├── BusinessesPage.tsx       # Business management
│   ├── ProductsPage.tsx         # Product catalog
│   ├── CallLeadsPage.tsx        # Call leads view
│   ├── OrdersPage.tsx           # Orders management
│   ├── CallbackRequestsPage.tsx # Callback requests
│   └── ProfilePage.tsx          # User profile
│
├── store/
│   ├── authStore.ts            # Authentication state (Zustand)
│   └── themeStore.ts           # Theme state (Zustand)
│
├── data/
│   └── dummy.ts                # Dummy data for demo
│
├── types/
│   └── index.ts                # TypeScript types
│
├── lib/
│   └── cn.ts                   # Utility functions
│
├── App.tsx                     # Main app component with routing
├── main.tsx                    # Entry point
└── index.css                   # Global styles
```

## 🎨 Design System

### Colors
- **Primary**: #4F46E5 (Indigo-600)
- **Success**: #10B981 (Green)
- **Danger**: #EF4444 (Red)
- **Warning**: #F59E0B (Amber)

### Theme Support
- Light mode (default)
- Dark mode (toggle in topbar)

## 🔐 Authentication & Authorization

### Super Admin
- Access to: Dashboard, Businesses, Products, Call Leads, Orders, Callback Requests
- Can manage all businesses and view all data
- Read-only access to orders and callbacks

### Business Admin
- Access to: Dashboard, Products, Call Leads, Orders, Callback Requests, Profile
- Limited to their own business data
- Can manage orders and callbacks for their business

### Demo Credentials
```
Email: admin@example.com
Password: (any password)
```

## 📊 Features

### Dashboard
- Statistics cards with key metrics
- Weekly trends chart
- Call status distribution chart
- Role-based content display

### Businesses
- List all businesses with filters
- Add new business
- Pause/resume subscription
- Delete business

### Products
- Product catalog with cards view
- Add products with dynamic features
- Image upload support
- Delete products

### Call Leads
- View incoming call leads
- Mark as read/unread (admin only)
- View call summary and transcript
- Track call duration

### Orders
- Order management with status tracking
- Accept/reject orders (admin only)
- View customer details
- Rejection reason tracking

### Callback Requests
- Manage callback requests
- Mark as called/not called (admin only)
- View callback details

### Profile
- Edit user information
- Change password
- View plan information (admin)
- Upgrade plan link

## 🛠️ Tech Stack

- **Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router v6
- **Charts**: Recharts
- **Icons**: Lucide React
- **UI Components**: shadcn/ui (Radix UI)

## 📦 Dummy Data

The application comes with pre-populated dummy data:
- 3 businesses
- 3 products
- 3 call leads
- 3 orders
- 3 callback requests

All data is stored in memory using Zustand and will reset on page refresh.

## 🔄 State Management

### Auth Store (Zustand)
```typescript
useAuthStore() // Get current user
useAuthStore((state) => state.login()) // Login
useAuthStore((state) => state.logout()) // Logout
```

### Theme Store (Zustand)
```typescript
useThemeStore((state) => state.isDark) // Get theme
useThemeStore((state) => state.toggleTheme()) // Toggle
```

## 📱 Responsive Design

- **Mobile**: Full-width layout with drawer navigation
- **Tablet**: Collapsible sidebar
- **Desktop**: Fixed sidebar layout

## 🚀 Production Build

```bash
# Build for production
pnpm build

# Output will be in dist/
```

## 🔜 Next Steps

To connect to a backend API:

1. Replace dummy data with API calls
2. Update Zustand stores with API integration
3. Add proper error handling
4. Implement real authentication
5. Add form validation with Zod
6. Set up React Query for data fetching

## 📝 Notes

- All data is currently dummy/mock data
- Forms are functional but don't persist data beyond session
- No real authentication is implemented
- Backend integration required for production use

## 📞 Support

For issues or questions about the frontend, refer to the PRD or contact the development team.
