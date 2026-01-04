# Restaurant Management System

A production-ready restaurant management web application built with React, TypeScript, Firebase, and Tailwind CSS.

## Features

### Admin Panel
- Dashboard with real-time analytics and charts
- Menu item management (CRUD operations)
- Order tracking and management
- Staff management system
- Restaurant settings configuration
- Daily revenue tracking and reporting

### Waiter Panel
- Order creation interface
- Real-time order status tracking
- Order history and billing
- Print receipts for completed orders

### Kitchen Panel
- Real-time order display with visual hierarchy
- Order status management (pending → cooking → ready)
- Order history and preparation time tracking
- Sound notifications for new orders

## Tech Stack

- **Frontend**: React 19 + TypeScript + Next.js 16
- **UI Framework**: Tailwind CSS v4 + shadcn/ui
- **Backend**: Firebase (Firestore, Authentication)
- **Charts**: Recharts
- **Icons**: Lucide React
- **State Management**: React Context API + Custom Hooks

## Project Structure

\`\`\`
src/
├── app/
│   ├── admin/
│   │   ├── dashboard/
│   │   ├── menu/
│   │   ├── orders/
│   │   ├── users/
│   │   └── settings/
│   ├── waiter/
│   │   ├── dashboard/
│   │   ├── order/
│   │   ├── status/
│   │   └── billing/
│   ├── kitchen/
│   │   ├── dashboard/
│   │   ├── orders/
│   │   └── history/
│   ├── login/
│   └── register/
├── components/
│   ├── admin/
│   ├── waiter/
│   └── kitchen/
├── context/
│   └── auth-context.tsx
├── hooks/
│   ├── use-menu.ts
│   ├── use-orders.ts
│   └── use-users.ts
├── types/
│   └── index.ts
└── utils/
    └── firebase-utils.ts
\`\`\`

## Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Set up Firestore database with the following collections:
   - `users` - Store user profiles with roles
   - `menu` - Store menu items
   - `orders` - Store order data

3. Enable Firebase Authentication (Email/Password)

4. Add your Firebase config to environment variables:
\`\`\`env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
\`\`\`

## Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Set up environment variables in `.env.local`

3. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

4. Open http://localhost:3000 in your browser

## Default Demo Credentials

- **Admin**: admin@restaurant.com / password123
- **Waiter**: waiter@restaurant.com / password123
- **Kitchen**: kitchen@restaurant.com / password123

## Features in Detail

### Real-time Updates
- Uses Firestore `onSnapshot` listeners for real-time data sync
- Automatic UI updates when orders change status
- Live menu availability updates

### Role-based Access Control
- Automatic routing based on user role after login
- Protected routes that redirect unauthorized users
- Role-specific dashboards and features

### Analytics
- Daily revenue tracking
- Weekly order statistics
- Top-selling menu items
- Order completion time tracking
- Staff performance insights

## Deployment

Deploy to Vercel or Firebase Hosting:

\`\`\`bash
npm run build
npm run start
\`\`\`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
