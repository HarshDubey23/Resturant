# Resturant

Contactless restaurant ordering system with AI-powered dining assistance.

Built with Next.js, MongoDB, and XtremeUI.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Demo Data

Visit `/api/refreshDemoData` to seed the database with demo restaurants.

### Admin Login (Homepage → Sign In)
- Use the credentials printed in your terminal/server logs after seeding, or check the seed data at `src/app/api/refreshDemoData/_data/`.

### Customer Login
Go to `/{restaurant}?table={id}` (e.g. `/empire?table=0`), enter name & phone.
