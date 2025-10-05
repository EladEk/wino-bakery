# Bread Bakery - Project Summary

## Overview
**Bread Bakery** is a React-based web application for managing bread sales and orders. It's a bilingual (Hebrew/English) system that allows customers to place orders for bread and administrators to manage inventory, sales, and customer orders.

## Technology Stack

### Frontend
- **React 19.1.0** - Main framework
- **React Router DOM 7.6.3** - Client-side routing
- **Firebase 12.0.0** - Backend services (Authentication, Firestore, Storage)
- **i18next 25.3.2** - Internationalization (Hebrew/English)
- **React i18next 15.6.0** - React integration for i18n

### Development Tools
- **Create React App** - Build tooling
- **ESLint** - Code linting
- **Testing Library** - Unit testing framework

## Project Structure

### Current Structure (`src/`)
```
src/
├── components/           # Reusable UI components
│   ├── AdminPage/       # Admin-specific components
│   ├── HomePage/        # Customer-facing components
│   ├── Header.js        # Navigation header
│   ├── BackgroundSlider.js # Background image carousel
│   └── ProtectedRoute.js   # Route protection
├── contexts/            # React Context providers
│   └── AuthContext.js   # Authentication state management
├── pages/               # Main application pages
│   ├── HomePage.js      # Customer order interface
│   ├── AdminPage.js     # Admin dashboard
│   ├── AuthPage.js      # Login/authentication
│   └── OrderHistoryPage.js # Sales history
├── i18n/                # Internationalization
│   ├── config.js        # i18n configuration
│   └── locales/         # Translation files
│       ├── en.json      # English translations
│       └── he.json      # Hebrew translations
├── img/                 # Static images
├── firebase.js          # Firebase configuration
└── App.js              # Main application component
```

### Refactored Structure (`src.new/`)
The project appears to be undergoing refactoring with a more organized structure:
```
src.new/
├── services/            # Business logic services
│   ├── breads.js       # Bread management operations
│   ├── users.js        # User management
│   └── orderHistory.js # Order history operations
├── hooks/              # Custom React hooks
│   ├── useBreads.js    # Bread data management
│   └── useSaleConfig.js # Sale configuration
├── contexts/           # Enhanced context providers
│   ├── ToastContext.js # Toast notifications
│   └── DirectionProvider.js # RTL/LTR support
├── utils/              # Utility functions
│   ├── dates.js        # Date formatting
│   └── numbers.js      # Number formatting
└── components/common/  # Reusable UI components
    ├── Button.js       # Standardized button
    ├── Table.js        # Data table component
    └── PopupToast.js   # Toast notifications
```

## Core Features

### Customer Features
1. **Authentication** - Google OAuth login
2. **Profile Management** - Name and phone number setup
3. **Bread Ordering** - Browse available breads and place orders
4. **Order Management** - Update, modify, or cancel existing orders
5. **Order History** - View past orders
6. **Bilingual Support** - Hebrew (RTL) and English (LTR)

### Admin Features
1. **Bread Management** - Add, edit, delete bread items
2. **Inventory Control** - Manage available quantities
3. **Order Management** - View and manage customer orders
4. **Customer Search** - Find and manage customer orders
5. **Sales Configuration** - Set sale dates, pickup locations, payment info
6. **End Sale Process** - Archive orders and reset inventory
7. **User Management** - Block/unblock users, manage admin privileges
8. **Revenue Tracking** - Real-time sales calculations

## Database Schema (Firestore)

### Collections
1. **`breads`** - Bread inventory
   ```javascript
   {
     name: string,
     description: string,
     availablePieces: number,
     price: number,
     show: boolean,
     isFocaccia: boolean,
     claimedBy: [{
       userId: string,
       name: string,
       phone: string,
       quantity: number,
       timestamp: Date,
       supplied: boolean,
       paid: boolean
     }]
   }
   ```

2. **`users`** - User profiles
   ```javascript
   {
     email: string,
     name: string,
     phone: string,
     isAdmin: boolean,
     isBlocked: boolean,
     createdAt: Date
   }
   ```

3. **`config`** - Application configuration
   ```javascript
   {
     saleDate: string,
     startHour: string,
     endHour: string,
     address: string,
     bitNumber: string
   }
   ```

4. **`ordersHistory`** - Archived sales
   ```javascript
   {
     saleDate: Date,
     breads: [{
       breadId: string,
       breadName: string,
       breadDescription: string,
       breadPrice: number,
       orders: [/* order details */]
     }]
   }
   ```

## Key Components

### Authentication System
- **Google OAuth** integration
- **User blocking** functionality
- **Admin role** management
- **Profile completion** enforcement

### Order Management
- **Real-time updates** using Firestore listeners
- **Quantity validation** and availability checking
- **Order state tracking** (supplied, paid)
- **Batch operations** for performance

### Internationalization
- **Hebrew (RTL)** and **English (LTR)** support
- **Dynamic direction** switching
- **Comprehensive translations** for all UI elements
- **Date formatting** in Hebrew

### UI/UX Features
- **Responsive design** for mobile and desktop
- **Background image slider** for visual appeal
- **Modal dialogs** for forms and confirmations
- **Toast notifications** for user feedback
- **Loading states** and error handling

## Recent Development

Based on git status, recent changes include:
- **AdminAddBreadForm.js** - Enhanced bread addition functionality
- **AdminPage.js** - Admin dashboard improvements
- **AdminPage.css** - Styling updates
- **Translation files** - Updated Hebrew and English translations

## Architecture Patterns

### State Management
- **React Context** for global state (auth, toasts)
- **Local state** with useState for component-specific data
- **Firestore listeners** for real-time data synchronization

### Code Organization
- **Service layer** abstraction (in src.new)
- **Custom hooks** for data fetching
- **Component composition** for reusability
- **Separation of concerns** between UI and business logic

### Performance Optimizations
- **Firestore batch operations** for multiple updates
- **Real-time listeners** with proper cleanup
- **Memoized calculations** for expensive operations
- **Conditional rendering** to avoid unnecessary updates

## Deployment & Configuration

### Firebase Configuration
- **Project ID**: wino-fb03d
- **Authentication**: Google provider enabled
- **Firestore**: Real-time database
- **Storage**: File uploads (if needed)

### Environment Setup
```bash
npm install          # Install dependencies
npm start           # Development server
npm run build       # Production build
npm test           # Run tests
```

## Security Features
- **Route protection** for admin areas
- **User blocking** system
- **Input validation** and sanitization
- **Firebase security rules** (implied)

## Future Considerations

The `src.new/` directory suggests ongoing refactoring to:
- **Improve code organization** with service layers
- **Enhance reusability** with common components
- **Better state management** with custom hooks
- **Improved error handling** with toast notifications
- **Utility functions** for common operations

This project demonstrates a well-structured React application with proper separation of concerns, internationalization support, and real-time data management using Firebase.
