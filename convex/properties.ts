import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { PROPERTIES, COLOR_GROUPS } from "../src/lib/constants";
import { canBuildHouse, canBuildHotel, ownsColorGroup } from "../src/lib/gameLogic";

export const buildHouse = mutation({
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
    if (game.houseSupply <= 0) throw new Error("No houses left");
    if (player.money < prop.houseCost) throw new Error("Not enough money");

    const allSpaces = game.boardSpaces;
    if (!canBuildHouse(position, allSpaces, player)) throw new Error("Cannot build");

    const spaceIdx = allSpaces.findIndex(s => s.position === position);
    const newSpaces = [...allSpaces];
    newSpaces[spaceIdx] = { ...newSpaces[spaceIdx], houses: (newSpaces[spaceIdx].houses ?? 0) + 1 };

    await ctx.db.patch(playerId, { money: player.money - prop.houseCost });
    await ctx.db.patch(gameId, {
      boardSpaces: newSpaces,
      houseSupply: game.houseSupply - 1,
    });
    return { success: true, houses: newSpaces[spaceIdx].houses };
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
    const player = await ctx.db.get(playerId);
    if (!player) throw new Error("Player not found");

    const prop = PROPERTIES.find(p => p.position === position);
    if (!prop) throw new Error("Not a property");
    if (game.hotelSupply <= 0) throw new Error("No hotels left");
    if (player.money < prop.houseCost) throw new Error("Not enough money");

    const allSpaces = game.boardSpaces;
    if (!canBuildHotel(position, allSpaces, player)) throw new Error("Cannot build hotel");

    const spaceIdx = allSpaces.findIndex(s => s.position === position);
    const newSpaces = [...allSpaces];
    newSpaces[spaceIdx] = { ...newSpaces[spaceIdx], hasHotel: true, houses: 0 };

    // Return 4 houses to supply
    await ctx.db.patch(playerId, { money: player.money - prop.houseCost });
    await ctx.db.patch(gameId, {
      boardSpaces: newSpaces,
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

    const spaceIdx = game.boardSpaces.findIndex(s => s.position === position);
    const space = game.boardSpaces[spaceIdx];
    if (!space || space.ownerId !== playerId) throw new Error("Not your property");
    if ((space.houses ?? 0) <= 0 && !space.hasHotel) throw new Error("No buildings");

    const newSpaces = [...game.boardSpaces];
    let returnHouses = 0;
    if (space.hasHotel) {
      newSpaces[spaceIdx] = { ...space, hasHotel: false, houses: 4 };
      returnHouses = 4;
      await ctx.db.patch(gameId, { hotelSupply: game.hotelSupply + 1, houseSupply: game.houseSupply - 4 });
    } else {
      newSpaces[spaceIdx] = { ...space, houses: (space.houses ?? 1) - 1 };
      returnHouses = -1;
      await ctx.db.patch(gameId, { houseSupply: game.houseSupply + 1 });
    }

    const sellPrice = prop.houseCost / 2;
    await ctx.db.patch(playerId, { money: player.money + sellPrice });
    await ctx.db.patch(gameId, { boardSpaces: newSpaces });
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
    const rail = (await import("../src/lib/constants")).RAILWAYS.find(r => r.position === position);
    const util = (await import("../src/lib/constants")).UTILITIES.find(u => u.position === position);
    const mortgageValue = prop?.mortgageValue ?? rail?.mortgageValue ?? util?.mortgageValue;
    if (mortgageValue === undefined) throw new Error("Not mortgageable");

    const spaceIdx = game.boardSpaces.findIndex(s => s.position === position);
    const space = game.boardSpaces[spaceIdx];
    if (!space || space.ownerId !== playerId) throw new Error("Not yours");
    if (space.isMortgaged) throw new Error("Already mortgaged");
    if ((space.houses ?? 0) > 0 || space.hasHotel) throw new Error("Remove buildings first");

    const newSpaces = [...game.boardSpaces];
    newSpaces[spaceIdx] = { ...space, isMortgaged: true };

    await ctx.db.patch(playerId, { money: player.money + mortgageValue });
    await ctx.db.patch(gameId, { boardSpaces: newSpaces });
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
    const rail = (await import("../src/lib/constants")).RAILWAYS.find(r => r.position === position);
    const util = (await import("../src/lib/constants")).UTILITIES.find(u => u.position === position);
    const mortgageValue = prop?.mortgageValue ?? rail?.mortgageValue ?? util?.mortgageValue;
    if (mortgageValue === undefined) throw new Error("Not mortgageable");
    const unmortgageCost = Math.floor(mortgageValue * 1.1);

    const spaceIdx = game.boardSpaces.findIndex(s => s.position === position);
    const space = game.boardSpaces[spaceIdx];
    if (!space || space.ownerId !== playerId || !space.isMortgaged) throw new Error("Cannot unmortgage");
    if (player.money < unmortgageCost) throw new Error("Not enough money");

    const newSpaces = [...game.boardSpaces];
    newSpaces[spaceIdx] = { ...space, isMortgaged: false };

    await ctx.db.patch(playerId, { money: player.money - unmortgageCost });
    await ctx.db.patch(gameId, { boardSpaces: newSpaces });
    return { success: true, cost: unmortgageCost };
  },
});
