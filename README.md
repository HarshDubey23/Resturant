# OrderWorder

A contactless restaurant ordering system with AI-powered dining assistance. Customers scan QR codes, browse menus, chat with an AI assistant, and place orders — all from their phone, no app download required.

## Features

- **QR Code Ordering** — Each table has a unique QR code. Scan to view menu and order.
- **AI Assistant** — Built-in AI (Jarvis) helps customers with menu recommendations and questions.
- **Real-time Order Management** — Dashboard for managing incoming orders across tables.
- **Kitchen Display** — Separate view for kitchen staff to track and fulfill orders.
- **Admin Panel** — Manage menu items, tables, orders, and restaurant settings.
- **Customer Login** — Phone-based authentication for returning customers.
- **Responsive Design** — Works on mobile, tablet, and desktop.

## Tech Stack

- **Framework:** Next.js 16 (Turbopack)
- **Language:** TypeScript
- **Database:** MongoDB with Mongoose
- **Authentication:** NextAuth.js
- **UI:** Tailwind CSS, shadcn/ui, XtremeUI
- **Animation:** Motion
- **PDF Generation:** React-PDF
- **QR Codes:** qrcode
- **AI SDK:** Vercel AI SDK

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- MongoDB Atlas URI

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your MongoDB URI and other config

# Start development server
npm run play
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

```env
MONGODB_URI=mongodb+srv://...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

See `.env.example` for all available options.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── [restaurant]/       # Restaurant menu pages (dynamic route)
│   ├── api/                # API routes
│   │   ├── auth/           # Authentication & setup
│   │   ├── admin/          # Admin dashboard APIs
│   │   ├── order/          # Order management APIs
│   │   ├── menu/           # Menu management APIs
│   │   ├── baseProfile/    # Profile lookup
│   │   └── chat/           # AI chat API
│   ├── dashboard/          # Admin dashboard
│   ├── kitchen/            # Kitchen display
│   ├── setup/              # Restaurant setup flow
│   ├── signup/             # Account creation
│   └── scan/               # QR scanner page
├── components/             # Shared components
│   ├── ui/                 # shadcn/ui primitives
│   ├── layout/             # Layout components
│   ├── sections/           # Landing page sections
│   └── context/            # React context providers
└── utils/
    ├── database/           # MongoDB models & connection
    │   ├── models/         # Mongoose schemas
    │   └── helper/         # Database helpers
    ├── constants/          # Shared constants
    └── helper/             # Utility functions
```

## Usage

### For Restaurant Owners

1. Sign up at `/signup` to create your restaurant account
2. Follow the setup flow to create tables, add menu items, and generate QR codes
3. Print QR codes and place them on tables
4. Manage orders from the dashboard at `/dashboard`
5. Kitchen staff can view orders at `/kitchen`

### For Customers

1. Scan the QR code on your table
2. Browse the menu and chat with the AI assistant
3. Add items to cart and place your order
4. The kitchen receives your order in real-time

## License

MIT
