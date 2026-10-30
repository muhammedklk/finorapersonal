# Finora — Personal Finance Dashboard

A full-stack personal finance tracker built with React + Vite, Bootstrap 5, Recharts, Framer Motion, Express, MongoDB and JWT authentication.

## Features
- Register/login with hashed passwords and JWT authentication
- Income and expense transactions: create, edit, delete, search and filter
- Automatic balance, income and expense totals
- Cash-flow and category charts
- Monthly budgets and savings goals
- CSV export and monthly reports
- Recurring transaction rules (create, list, pause/resume, delete); rules can be processed with the **Run recurring** button
- Responsive mobile layout and light/dark mode
- API-side validation and per-user data ownership

## Requirements
Node.js 20+ and a MongoDB database (local or MongoDB Atlas).

## Setup
1. In the project root, install the root tool:
   ```bash
   npm install
   ```
2. Install the client and server dependencies:
   ```bash
   npm install --prefix server
   npm install --prefix client
   ```
3. Copy `server/.env.example` to `server/.env` and set `MONGODB_URI` and a long random `JWT_SECRET`.
4. Start both apps from the root:
   ```bash
   npm run dev
   ```
5. Open the Vite URL shown in the terminal (normally http://localhost:5173).

The client proxies `/api` requests to the Express server on port 5000. Register a new account to start; data is isolated by user. This project does not connect to bank accounts or import live bank feeds. “Instant updates” means the dashboard recalculates immediately when you create/update/delete records. Cross-device updates occur after each device fetches the latest server data; WebSocket push is not included.

## Production notes
- Use HTTPS and a strong unique `JWT_SECRET`.
- Configure MongoDB Atlas network access and a least-privilege database user.
- Set `CLIENT_ORIGIN` to your deployed frontend URL.
- Deploy client and server separately or configure your hosting platform to serve the Vite build and proxy `/api` to Express.
- Consider refresh-token rotation, rate limiting, email verification, password reset, audit logs and automated backups before public production use.
