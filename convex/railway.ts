import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { RAILWAY_POSITIONS } from "../src/lib/constants";

export const railwayTravel = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    destination: v.number(),
  },
  handler: async (ctx, { gameId, playerId, destination }) => {
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    if (game.turnPhase !== "resolving" && game.turnPhase !== "post_roll") throw new Error("Wrong phase");
    const players = await ctx.db.query("players").withIndex("by_game", q => q.eq("gameId", gameId)).collect();
    players.sort((a, b) => a.order - b.order);
    const player = players.find(p => p._id === playerId);
    if (!player) throw new Error("Player not found");
    const currentPlayer = players[game.currentPlayerIndex];
    if (!currentPlayer || currentPlayer._id !== playerId) throw new Error("Not your turn");
    if (player.hasUsedRailwayTravel) throw new Error("Already used this turn");

    if (!RAILWAY_POSITIONS.includes(player.position)) throw new Error("Not on a railway");
    if (!RAILWAY_POSITIONS.includes(destination)) throw new Error("Not a railway destination");

    const currentSpace = await ctx.db.query("boardSpaces").withIndex("by_game_and_position", q => q.eq("gameId", gameId).eq("position", player.position)).unique();
    if (!currentSpace || currentSpace.ownerId !== playerId) throw new Error("Don't own current railway");

    const destSpace = await ctx.db.query("boardSpaces").withIndex("by_game_and_position", q => q.eq("gameId", gameId).eq("position", destination)).unique();
    if (!destSpace || destSpace.ownerId !== playerId) throw new Error("Don't own destination");

    await ctx.db.patch(playerId, {
      position: destination,
      hasUsedRailwayTravel: true,
    });

    await ctx.db.patch(gameId, { turnPhase: "resolving" });

    return { newPosition: destination };
  },
});
