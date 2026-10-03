

# Climate Hackathon — Climate Solutions Marketplace

A full-stack TypeScript application for a climate-focused marketplace connecting buyers, sellers, and administrators, with messaging and AI-powered features.

## Features

- Authentication (buyer / seller / admin)
- Listings: create, browse, and manage climate-related products or services
- Messaging / Inbox between users
- Admin dashboard for moderation and management
- AI-powered utilities (see `server/services/ai.service.ts`) for assistance and content generation

## Tech Stack

- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express + TypeScript
- Database: MongoDB (via `server/db.ts`)
- Dev tooling: Vite, TypeScript

## Quick Start

Prerequisites: Node.js (v16+), npm or yarn, and a running MongoDB instance.

1. Install dependencies

```bash
npm install
```

2. Create a copy of your environment file and set required variables

Recommended environment variables:

- `MONGO_URI` — MongoDB connection string
- `PORT` — server port (default 3000)
- `JWT_SECRET` — secret for signing JWTs
- `OPENAI_API_KEY` — (optional) API key for AI features

3. Run in development

```bash
npm run dev
```

4. Build for production

```bash
npm run build
npm run start
```

## API Overview

The server routes are defined under `server/routes/` and controllers are in `server/controllers/`.
Key route groups include:

- Authentication: [server/routes/auth.routes.ts](server/routes/auth.routes.ts)
- Listings: [server/routes/listing.routes.ts](server/routes/listing.routes.ts)
- Messages: [server/routes/message.routes.ts](server/routes/message.routes.ts)
- Admin: [server/routes/admin.routes.ts](server/routes/admin.routes.ts)

Inspect the controller implementations for request/response shapes.

## Project Structure

- `server/` — backend source (db, controllers, routes, services)
- `src/` — frontend React app (`src/main.tsx`, `src/App.tsx`, components)
- `assets/` — static assets
- `index.html`, `vite.config.ts`, `tsconfig.json` — build tooling

Relevant files:

- [server.ts](server.ts)
- [server/services/ai.service.ts](server/services/ai.service.ts)
- [src/main.tsx](src/main.tsx)

## Development Notes

- Admin, auth, listing and message logic is implemented server-side in `server/controllers/`.
- Frontend views live in `src/components/` (e.g., `AdminView`, `SellerView`, `BuyerView`).

## Contributing

Contributions are welcome. Please open issues for bugs or feature requests and submit pull requests for fixes. Keep changes focused and add tests where applicable.

## License

Specify your license here (e.g., MIT). If unsure, add a `LICENSE` file to the repository.

