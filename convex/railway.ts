import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { RAILWAY_POSITIONS, GO_SALARY } from "../src/lib/constants";

export const railwayTravel = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    destination: v.number(),
  },
  handler: async (ctx, { gameId, playerId, destination }) => {
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    const player = await ctx.db.get(playerId);
    if (!player) throw new Error("Player not found");
    if (player.hasUsedRailwayTravel) throw new Error("Already used this turn");

    // Verify current position is a railway
    if (!RAILWAY_POSITIONS.includes(player.position)) throw new Error("Not on a railway");
    // Verify destination is a railway
    if (!RAILWAY_POSITIONS.includes(destination)) throw new Error("Not a railway destination");
    // Verify player owns the destination railway
    const destSpace = game.boardSpaces.find(s => s.position === destination);
    if (!destSpace || destSpace.ownerId !== playerId) throw new Error("Don't own destination");

    // Move player (no GO salary for railway travel)
    await ctx.db.patch(playerId, {
      position: destination,
      hasUsedRailwayTravel: true,
    });

    return { newPosition: destination };
  },
});
