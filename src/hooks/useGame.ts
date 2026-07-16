import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function useGame(gameId: Id<"games"> | undefined) {
  return useQuery(api.games.getById, gameId ? { id: gameId } : "skip");
}

export function useGameByCode(code: string | undefined) {
  return useQuery(api.games.getByCode, code ? { code } : "skip");
}
