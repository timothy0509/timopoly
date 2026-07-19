import { mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { PROPERTIES, RAILWAYS, UTILITIES } from "../src/lib/constants";
import { canBuildHouse, canBuildHotel, ownsColorGroup } from "../src/lib/gameLogic";
import type { Id } from "./_generated/dataModel";

async function getBoardSpaces(ctx: MutationCtx, gameId: Id<"games">) {
  const spaces = await ctx.db.query("boardSpaces").withIndex("by_game", q => q.eq("gameId", gameId)).collect();
  spaces.sort((a, b) => a.position - b.position);
  return spaces;
}

async function getSpaceByPosition(ctx: MutationCtx, gameId: Id<"games">, position: number) {
  return await ctx.db.query("boardSpaces").withIndex("by_game_and_position", q => q.eq("gameId", gameId).eq("position", position)).unique();
}

export const buildHouse = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    position: v.number(),
  },
  handler: async (ctx, { gameId, playerId, position }) => {
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    if (game.turnPhase !== "building" && game.turnPhase !== "post_roll") throw new Error("Wrong phase");
    const player = await ctx.db.get(playerId);
    if (!player) throw new Error("Player not found");

    const prop = PROPERTIES.find(p => p.position === position);
    if (!prop) throw new Error("Not a property");
    if (game.houseSupply <= 0) throw new Error("No houses left");
    if (player.money < prop.houseCost) throw new Error("Not enough money");

    const allSpaces = await getBoardSpaces(ctx, gameId);
    if (!canBuildHouse(position, allSpaces, player)) throw new Error("Cannot build");

    const space = await getSpaceByPosition(ctx, gameId, position);
    if (!space) throw new Error("Space not found");

    await ctx.db.patch(playerId, { money: player.money - prop.houseCost });
    await ctx.db.patch(space._id, { houses: (space.houses ?? 0) + 1 });
    await ctx.db.patch(gameId, { houseSupply: game.houseSupply - 1 });
    return { success: true, houses: (space.houses ?? 0) + 1 };
  },
});

export const buildHotel = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    position: v.number(),
  },
  handler: async (ctx, { gameId, playerId, position }) => {
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    if (game.turnPhase !== "building" && game.turnPhase !== "post_roll") throw new Error("Wrong phase");
    const player = await ctx.db.get(playerId);
    if (!player) throw new Error("Player not found");

    const prop = PROPERTIES.find(p => p.position === position);
    if (!prop) throw new Error("Not a property");
    if (game.hotelSupply <= 0) throw new Error("No hotels left");
    if (player.money < prop.houseCost) throw new Error("Not enough money");

    const allSpaces = await getBoardSpaces(ctx, gameId);
    if (!canBuildHotel(position, allSpaces, player)) throw new Error("Cannot build hotel");

    const space = await getSpaceByPosition(ctx, gameId, position);
    if (!space) throw new Error("Space not found");

    await ctx.db.patch(playerId, { money: player.money - prop.houseCost });
    await ctx.db.patch(space._id, { hasHotel: true, houses: 0 });
    await ctx.db.patch(gameId, {
      houseSupply: game.houseSupply + 4,
      hotelSupply: game.hotelSupply - 1,
    });
    return { success: true };
  },
});

export const sellHouse = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    position: v.number(),
  },
  handler: async (ctx, { gameId, playerId, position }) => {
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    const player = await ctx.db.get(playerId);
    if (!player) throw new Error("Player not found");

    const prop = PROPERTIES.find(p => p.position === position);
    if (!prop) throw new Error("Not a property");

    const space = await getSpaceByPosition(ctx, gameId, position);
    if (!space || space.ownerId !== playerId) throw new Error("Not your property");
    if ((space.houses ?? 0) <= 0 && !space.hasHotel) throw new Error("No buildings");

    const sellPrice = prop.houseCost / 2;

    if (space.hasHotel) {
      await ctx.db.patch(space._id, { hasHotel: false, houses: 4 });
      await ctx.db.patch(gameId, {
        hotelSupply: game.hotelSupply + 1,
        houseSupply: game.houseSupply + 4,
      });
    } else {
      const allSpaces = await getBoardSpaces(ctx, gameId);
      const groupPositions = PROPERTIES.filter(p => p.color === prop.color).map(p => p.position);
      const groupSpaces = allSpaces.filter(s => groupPositions.includes(s.position));
      const maxHouses = Math.max(...groupSpaces.map(s => s.houses ?? 0));
      if ((space.houses ?? 0) !== maxHouses) {
        throw new Error("Must sell from most developed property first");
      }
      await ctx.db.patch(space._id, { houses: (space.houses ?? 1) - 1 });
      await ctx.db.patch(gameId, { houseSupply: game.houseSupply + 1 });
    }

    await ctx.db.patch(playerId, { money: player.money + sellPrice });
    return { success: true, sellPrice };
  },
});

export const mortgageProperty = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    position: v.number(),
  },
  handler: async (ctx, { gameId, playerId, position }) => {
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    const player = await ctx.db.get(playerId);
    if (!player) throw new Error("Player not found");

    const prop = PROPERTIES.find(p => p.position === position);
    const rail = RAILWAYS.find(r => r.position === position);
    const util = UTILITIES.find(u => u.position === position);
    const mortgageValue = prop?.mortgageValue ?? rail?.mortgageValue ?? util?.mortgageValue;
    if (mortgageValue === undefined) throw new Error("Not mortgageable");

    const space = await getSpaceByPosition(ctx, gameId, position);
    if (!space || space.ownerId !== playerId) throw new Error("Not yours");
    if (space.isMortgaged) throw new Error("Already mortgaged");
    if ((space.houses ?? 0) > 0 || space.hasHotel) throw new Error("Remove buildings first");

    await ctx.db.patch(space._id, { isMortgaged: true });
    await ctx.db.patch(playerId, { money: player.money + mortgageValue });
    return { success: true, mortgageValue };
  },
});

export const unmortgageProperty = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    position: v.number(),
  },
  handler: async (ctx, { gameId, playerId, position }) => {
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    const player = await ctx.db.get(playerId);
    if (!player) throw new Error("Player not found");

    const prop = PROPERTIES.find(p => p.position === position);
    const rail = RAILWAYS.find(r => r.position === position);
    const util = UTILITIES.find(u => u.position === position);
    const mortgageValue = prop?.mortgageValue ?? rail?.mortgageValue ?? util?.mortgageValue;
    if (mortgageValue === undefined) throw new Error("Not mortgageable");
    const unmortgageCost = Math.floor(mortgageValue * 1.1);

    const space = await getSpaceByPosition(ctx, gameId, position);
    if (!space || space.ownerId !== playerId || !space.isMortgaged) throw new Error("Cannot unmortgage");
    if (player.money < unmortgageCost) throw new Error("Not enough money");

    await ctx.db.patch(space._id, { isMortgaged: false });
    await ctx.db.patch(playerId, { money: player.money - unmortgageCost });
    return { success: true, cost: unmortgageCost };
  },
});
