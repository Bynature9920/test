# Fintech Super App - Web Application

Modern React web application for the Fintech Super App platform.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Routing
- **Zustand** - State management
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Backend API running on `http://localhost:8000`

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your API URL if needed
```

### Development

```bash
# Start dev server
npm run dev

# The app will be available at http://localhost:3000
```

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
web/
├── src/
│   ├── components/      # Reusable components
│   │   └── layout/      # Layout components (Header, Sidebar)
│   ├── contexts/        # React contexts (Auth)
│   ├── pages/           # Page components
│   │   ├── auth/        # Login, Register
│   │   ├── dashboard/   # Dashboard
│   │   ├── wallet/      # Wallet management
│   │   ├── payments/    # Payment pages
│   │   ├── crypto/      # Crypto management
│   │   ├── cards/       # Card management
│   │   ├── loans/       # Loan pages
│   │   └── travel/      # Travel booking
│   ├── routes/          # Routing configuration
│   ├── services/       # API services
│   │   └── api/         # API client and services
│   └── utils/           # Utility functions
├── public/              # Static assets
└── index.html           # HTML template
```

## Features

- ✅ User authentication (Login/Register)
- ✅ Dashboard with balance overview
- ✅ Wallet management
- ✅ P2P and Bank transfers
- ✅ Crypto balance viewing and conversion
- ✅ Responsive design
- ✅ Form validation
- ✅ Error handling
- ✅ Toast notifications

## Coming Soon

- Virtual card creation and management
- Loan application
- Travel booking
- Rewards system
- Transaction history
- KYC verification flow

## Environment Variables

- `VITE_API_BASE_URL` - Backend API base URL (default: http://localhost:8000)

## Development Notes

- The app uses React Router for navigation
- Authentication state is managed via Context API
- API calls are centralized in the `services/api` directory
- All forms use React Hook Form with Zod validation
- Tailwind CSS is used for styling

