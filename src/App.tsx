import { useState, useCallback } from "react";
import type { Id } from "../convex/_generated/dataModel";
import GameLobby from "./components/GameLobby";
import GameBoard from "./components/Board";

export default function App() {
  const [gameId, setGameId] = useState<Id<"games"> | null>(null);
  const [playerId, setPlayerId] = useState<Id<"players"> | null>(null);

  const handleJoin = useCallback((gId: Id<"games">, pId: Id<"players">) => {
    setGameId(gId);
    setPlayerId(pId);
  }, []);

  if (!gameId || !playerId) {
    return <GameLobby onJoin={handleJoin} />;
  }

  return <GameBoard gameId={gameId} playerId={playerId} />;
}
