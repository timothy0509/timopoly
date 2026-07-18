# Timopoly

A Timo-themed Monopoly clone set in the world of **Timotopia**. Play online multiplayer or against bots with a real-time Convex backend.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS v4
- **Backend:** Convex (real-time database + server functions)
- **Icons:** Lucide React

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the local dev servers (Convex + Vite):
   ```bash
   npm run dev
   ```

   Vite serves the frontend on its default port and connects to the Convex dev server at `http://localhost:3210` (configured in `.env.local`).

3. Open the app in your browser and create or join a game with a lobby code.

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
