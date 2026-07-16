import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { PROPERTIES, RAILWAYS, UTILITIES, CHANCE_CARDS, TREASURY_CARDS, COLOR_GROUPS } from "../src/lib/constants";
import { ownsColorGroup, countBuildings, canBuildHouse } from "../src/lib/gameLogic";

export const executeBotTurn = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
  },
  handler: async (ctx, { gameId, playerId }) => {
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    const player = await ctx.db.get(playerId);
    if (!player) throw new Error("Player not found");
    if (!player.isBot) throw new Error("Not a bot");

    const difficulty = player.botDifficulty ?? "easy";

    // If in jail, decide what to do
    if (player.isInJail) {
      if (difficulty === "hard" || difficulty === "medium") {
        if (player.getOutOfJailCards > 0) {
          await ctx.db.patch(playerId, { getOutOfJailCards: player.getOutOfJailCards - 1, isInJail: false, jailTurns: 0 });
        } else if (player.money >= 50) {
          await ctx.db.patch(playerId, { money: player.money - 50, isInJail: false, jailTurns: 0 });
        }
      }
      // Easy bots just try to roll doubles (handled by rollDice)
    }

    // Build houses if we have monopolies and cash
    if (difficulty === "medium" || difficulty === "hard") {
      const threshold = difficulty === "hard" ? 300 : 500;
      if (player.money > threshold) {
        for (const pos of player.properties) {
          const prop = PROPERTIES.find(p => p.position === pos);
          if (!prop) continue;
          if (ownsColorGroup(player, prop.color, game.boardSpaces)) {
            const space = game.boardSpaces.find(s => s.position === pos);
            if (space && canBuildHouse(pos, game.boardSpaces, player) && player.money >= prop.houseCost + 100) {
              const spaceIdx = game.boardSpaces.findIndex(s => s.position === pos);
              const newSpaces = [...game.boardSpaces];
              newSpaces[spaceIdx] = { ...newSpaces[spaceIdx], houses: (newSpaces[spaceIdx].houses ?? 0) + 1 };
              await ctx.db.patch(playerId, { money: player.money - prop.houseCost });
              await ctx.db.patch(gameId, { boardSpaces: newSpaces, houseSupply: game.houseSupply - 1 });
              break; // One build per turn for bots
            }
          }
        }
      }
    }

    return { botAction: "completed" };
  },
});
