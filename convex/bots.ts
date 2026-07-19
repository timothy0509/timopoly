import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { PROPERTIES, JAIL_FINE } from "../src/lib/constants";
import { ownsColorGroup, canBuildHouse } from "../src/lib/gameLogic";

export const executeBotTurn = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
  },
  handler: async (ctx, { gameId, playerId }) => {
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    if (game.turnPhase !== "pre_roll") throw new Error("Wrong phase");
    const players = await ctx.db.query("players").withIndex("by_game", q => q.eq("gameId", gameId)).collect();
    players.sort((a, b) => a.order - b.order);
    const player = players.find(p => p._id === playerId);
    if (!player) throw new Error("Player not found");
    if (!player.isBot) throw new Error("Not a bot");
    const currentPlayer = players[game.currentPlayerIndex];
    if (!currentPlayer || currentPlayer._id !== playerId) throw new Error("Not bot's turn");

    const difficulty = player.botDifficulty ?? "easy";

    if (player.isInJail) {
      if (difficulty === "hard" || difficulty === "medium") {
        if (player.getOutOfJailCards > 0) {
          await ctx.db.patch(playerId, { getOutOfJailCards: player.getOutOfJailCards - 1, isInJail: false, jailTurns: 0 });
        } else if (player.money >= JAIL_FINE) {
          await ctx.db.patch(playerId, { money: player.money - JAIL_FINE, isInJail: false, jailTurns: 0 });
        }
      }
    }

    if (difficulty === "medium" || difficulty === "hard") {
      const threshold = difficulty === "hard" ? 300 : 500;
      if (player.money > threshold) {
        const boardSpaces = await ctx.db.query("boardSpaces").withIndex("by_game", q => q.eq("gameId", gameId)).collect();
        for (const pos of player.properties) {
          const prop = PROPERTIES.find(p => p.position === pos);
          if (!prop) continue;
          if (ownsColorGroup(player, prop.color, boardSpaces)) {
            const space = boardSpaces.find(s => s.position === pos);
            if (game.houseSupply <= 0) break;
            if (space && canBuildHouse(pos, boardSpaces, player) && player.money >= prop.houseCost + 100) {
              await ctx.db.patch(playerId, { money: player.money - prop.houseCost });
              await ctx.db.patch(space._id, { houses: (space.houses ?? 0) + 1 });
              await ctx.db.patch(gameId, { houseSupply: game.houseSupply - 1 });
              break;
            }
          }
        }
      }
    }

    return { botAction: "completed" };
  },
});
