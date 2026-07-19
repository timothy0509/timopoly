import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { STARTING_MONEY } from "../src/lib/constants";

export const getByGame = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => {
    const players = await ctx.db.query("players").withIndex("by_game", q => q.eq("gameId", gameId)).collect();
    players.sort((a, b) => a.order - b.order);
    return players;
  },
});

export const getById = query({
  args: { id: v.id("players") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const joinGame = mutation({
  args: {
    gameId: v.id("games"),
    name: v.string(),
    token: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, { gameId, name, token, userId }) => {
    const game = await ctx.db.get(gameId);
    if (!game || game.status !== "lobby") throw new Error("Game not joinable");

    const existing = await ctx.db.query("players").withIndex("by_game", q => q.eq("gameId", gameId)).collect();
    if (existing.length >= 8) throw new Error("Game is full");
    const takenTokens = new Set(existing.map(p => p.token));
    if (takenTokens.has(token)) throw new Error("Token taken");

    const playerId = await ctx.db.insert("players", {
      gameId,
      userId,
      name,
      token,
      isBot: false,
      ready: true,
      order: existing.length,
      money: STARTING_MONEY,
      position: 0,
      properties: [],
      getOutOfJailCards: 0,
      isInJail: false,
      jailTurns: 0,
      isBankrupt: false,
      hasUsedRailwayTravel: false,
    });
    return playerId;
  },
});

export const addBot = mutation({
  args: {
    gameId: v.id("games"),
    name: v.string(),
    token: v.string(),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
  },
  handler: async (ctx, { gameId, name, token, difficulty }) => {
    const game = await ctx.db.get(gameId);
    if (!game || game.status !== "lobby") throw new Error("Game not in lobby");

    const existing = await ctx.db.query("players").withIndex("by_game", q => q.eq("gameId", gameId)).collect();
    if (existing.length >= 8) throw new Error("Game is full");
    const takenTokens = new Set(existing.map(p => p.token));
    if (takenTokens.has(token)) throw new Error("Token taken");

    const playerId = await ctx.db.insert("players", {
      gameId,
      name,
      token,
      isBot: true,
      botDifficulty: difficulty,
      ready: true,
      order: existing.length,
      money: STARTING_MONEY,
      position: 0,
      properties: [],
      getOutOfJailCards: 0,
      isInJail: false,
      jailTurns: 0,
      isBankrupt: false,
      hasUsedRailwayTravel: false,
    });
    return playerId;
  },
});

export const joinByCode = mutation({
  args: {
    code: v.string(),
    name: v.string(),
    token: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, { code, name, token, userId }) => {
    const game = await ctx.db.query("games").withIndex("by_code", q => q.eq("code", code.toUpperCase())).unique();
    if (!game) throw new Error("Game not found");
    if (game.status !== "lobby") throw new Error("Game already started");

    const existing = await ctx.db.query("players").withIndex("by_game", q => q.eq("gameId", game._id)).collect();
    if (existing.length >= 8) throw new Error("Game is full");
    const takenTokens = new Set(existing.map(p => p.token));
    if (takenTokens.has(token)) throw new Error("Token already taken");

    const playerId = await ctx.db.insert("players", {
      gameId: game._id,
      userId,
      name,
      token,
      isBot: false,
      ready: true,
      order: existing.length,
      money: STARTING_MONEY,
      position: 0,
      properties: [],
      getOutOfJailCards: 0,
      isInJail: false,
      jailTurns: 0,
      isBankrupt: false,
      hasUsedRailwayTravel: false,
    });
    return { gameId: game._id, playerId };
  },
});
