import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function usePlayers(gameId: Id<"games"> | undefined) {
  return useQuery(api.players.getByGame, gameId ? { gameId } : "skip");
}

export function usePlayer(playerId: Id<"players"> | undefined) {
  return useQuery(api.players.getById, playerId ? { id: playerId } : "skip");
}
