import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import GameLobby from "./components/GameLobby";
import GameBoard from "./components/Board";

export default function App() {
  const [gameId, setGameId] = useState<Id<"games"> | null>(null);
  const [playerId, setPlayerId] = useState<Id<"players"> | null>(null);

  if (!gameId || !playerId) {
    return (
      <GameLobby
        onJoin={(gId, pId) => {
          setGameId(gId);
          setPlayerId(pId);
        }}
      />
    );
  }

  return <GameBoard gameId={gameId} playerId={playerId} />;
}
