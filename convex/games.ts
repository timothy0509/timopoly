import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { BOARD_SPACES, STARTING_MONEY, MAX_HOUSES, MAX_HOTELS, CHANCE_CARDS, TREASURY_CARDS } from "../src/lib/constants";
import { shuffle } from "../src/lib/utils";

export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const game = await ctx.db.query("games").withIndex("by_code", q => q.eq("code", code)).unique();
    return game;
  },
});

export const getById = query({
  args: { id: v.id("games") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const create = mutation({
  args: {
    code: v.string(),
    hostName: v.string(),
    hostToken: v.string(),
    hostUserId: v.optional(v.string()),
  },
  handler: async (ctx, { code, hostName, hostToken, hostUserId }) => {
    const boardSpaces = BOARD_SPACES.map(s => ({
      position: s.position,
      type: s.type,
      name: s.name,
    }));

    const gameId = await ctx.db.insert("games", {
      code,
      status: "lobby",
      hostId: "" as any,
      currentPlayerIndex: 0,
      turnPhase: "pre_roll",
      boardSpaces,
      chanceDeck: shuffle(Array.from({ length: 16 }, (_, i) => i)),
      treasuryDeck: shuffle(Array.from({ length: 16 }, (_, i) => i)),
      chanceIndex: 0,
      treasuryIndex: 0,
      houseSupply: MAX_HOUSES,
      hotelSupply: MAX_HOTELS,
      doublesCount: 0,
      chatLog: [],
      createdAt: Date.now(),
    });

    const playerId = await ctx.db.insert("players", {
      gameId,
      userId: hostUserId,
      name: hostName,
      token: hostToken,
      isBot: false,
      ready: true,
      order: 0,
      money: STARTING_MONEY,
      position: 0,
      properties: [],
      getOutOfJailCards: 0,
      isInJail: false,
      jailTurns: 0,
      isBankrupt: false,
      hasUsedRailwayTravel: false,
    });

    await ctx.db.patch(gameId, { hostId: playerId });
    return { gameId, playerId };
  },
});

export const startGame = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => {
    const game = await ctx.db.get(gameId);
    if (!game || game.status !== "lobby") throw new Error("Game not in lobby");

    const players = await ctx.db.query("players").withIndex("by_game", q => q.eq("gameId", gameId)).collect();
    if (players.length < 2) throw new Error("Need at least 2 players");

    // Randomize turn order
    const indices = shuffle(players.map((_, i) => i));
    for (let i = 0; i < players.length; i++) {
      await ctx.db.patch(players[indices[i]]._id, { order: i });
    }

    await ctx.db.patch(gameId, {
      status: "playing",
      turnPhase: "pre_roll",
      currentPlayerIndex: 0,
    });
  },
});
