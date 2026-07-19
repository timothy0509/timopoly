# Timopoly

A Timo-themed Monopoly clone set in the world of **Timotopia**. Play online multiplayer or against bots with a real-time Convex backend.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS v4
- **Backend:** Convex (real-time database + server functions)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the environment file and fill in your Convex URL:
   ```bash
   cp .env.example .env.local
   ```

3. Start the local dev servers (Convex + Vite):
   ```bash
   npm run dev
   ```

   This runs `convex dev` and `vite` concurrently (via `concurrently`). Vite serves the frontend on its default port and connects to the Convex deployment specified in `.env.local`.

3. Open the app in your browser and create or join a game with a lobby code.

## Environment Variables

The frontend expects a Convex URL at build time.

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_CONVEX_URL` | URL of the Convex deployment the app connects to | `https://your-deployment.convex.cloud` |

Copy `.env.example` to `.env.local` and fill in your Convex URL (from `npx convex dev` or the Convex dashboard). For production, set this to your deployed Convex URL.

## Deployment

### 1. Deploy the Convex backend

From the project root, run the Convex deploy command:

```bash
npx convex deploy
```

This pushes the schema and functions in `convex/` to a production Convex deployment. Note the deployment URL provided at the end of the process.

### 2. Configure the production frontend URL

Create a production environment file (for example, `.env.production`) or set the variable in your hosting platform:

```bash
VITE_CONVEX_URL=https://<your-production-convex-url>
```

### 3. Build the frontend

```bash
npm run build
```

Vite bundles the app into the `dist/` directory. The built frontend is static and can be served by any static host (e.g. Vercel, Netlify, Cloudflare Pages, or an S3 bucket).

### 4. Deploy the static build

Upload the contents of the `dist/` folder to your chosen static host. Make sure the production environment variable `VITE_CONVEX_URL` is set at build time so the client connects to the deployed Convex backend.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Convex dev server and Vite in parallel |
| `npm run build` | Type-check with `tsc -b` and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run convex` | Start only the Convex dev server |

## Project Structure

```
convex/          # Convex schema and server functions
  schema.ts      # Database schema
  games.ts       # Game lifecycle
  players.ts     # Player management
  turns.ts       # Turn logic and dice rolls
  properties.ts  # Property, rent, and building logic
  cards.ts       # Timo Fortune / Timo Treasury cards
  trades.ts      # Player-to-player trading
  railway.ts     # Railway travel mechanic
  bots.ts        # Bot AI decision engine
src/
  components/    # React UI components (board, lobby, modals, panels)
  hooks/         # Convex subscription hooks
  lib/           # Constants, game logic, and helpers
  types/         # Shared TypeScript types
  main.tsx       # App entry point
  App.tsx        # Top-level routing (lobby ↔ board)
```

## Game Features

- Create or join games with a 6-character lobby code
- Turn-based movement around a 40-space Timotopia board
- Property buying, rent collection, and auctions
- Color-group monopolies with even house/hotel building
- Timo Fortune (Chance) and Timo Treasury (Community Chest) cards
- Jail mechanics, trading, mortgages, and railway travel
- Easy, medium, and hard bot opponents
- In-game chat

## License

MIT
