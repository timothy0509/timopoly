import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  games: defineTable({
    code: v.string(),
    status: v.union(v.literal("lobby"), v.literal("playing"), v.literal("finished")),
    hostId: v.optional(v.id("players")),
    currentPlayerIndex: v.number(),
    turnPhase: v.union(
      v.literal("pre_roll"),
      v.literal("rolling"),
      v.literal("post_roll"),
      v.literal("resolving"),
      v.literal("trading"),
      v.literal("building"),
      v.literal("end_turn")
    ),
    chanceDeck: v.array(v.number()),
    treasuryDeck: v.array(v.number()),
    chanceIndex: v.number(),
    treasuryIndex: v.number(),
    houseSupply: v.number(),
    hotelSupply: v.number(),
    lastDice: v.optional(v.object({
      die1: v.number(),
      die2: v.number(),
      doubles: v.boolean(),
    })),
    doublesCount: v.number(),
    currentAuction: v.optional(v.object({
      propertyPosition: v.number(),
      highestBid: v.number(),
      highestBidderId: v.optional(v.id("players")),
      bidderIds: v.array(v.id("players")),
      expiresAt: v.number(),
    })),
    createdAt: v.number(),
    // Deprecated legacy fields -- kept for schema compatibility with
    // existing documents that still have stale embedded data. Code
    // reads boardSpaces and chatLog from the boardSpaces and
    // chatMessages tables respectively.
    boardSpaces: v.optional(v.any()),
    chatLog: v.optional(v.any()),
  }).index("by_code", ["code"]),

  boardSpaces: defineTable({
    gameId: v.id("games"),
    position: v.number(),
    type: v.string(),
    name: v.string(),
    ownerId: v.optional(v.id("players")),
    houses: v.optional(v.number()),
    hasHotel: v.optional(v.boolean()),
    isMortgaged: v.optional(v.boolean()),
  }).index("by_game", ["gameId"])
    .index("by_game_and_position", ["gameId", "position"]),

  chatMessages: defineTable({
    gameId: v.id("games"),
    playerId: v.id("players"),
    message: v.string(),
    timestamp: v.number(),
  }).index("by_game", ["gameId"]),

  players: defineTable({
    gameId: v.id("games"),
    userId: v.optional(v.string()),
    name: v.string(),
    token: v.string(),
    isBot: v.boolean(),
    botDifficulty: v.optional(v.union(
      v.literal("easy"),
      v.literal("medium"),
      v.literal("hard")
    )),
    ready: v.boolean(),
    order: v.number(),
    money: v.number(),
    position: v.number(),
    properties: v.array(v.number()),
    getOutOfJailCards: v.number(),
    isInJail: v.boolean(),
    jailTurns: v.number(),
    isBankrupt: v.boolean(),
    hasUsedRailwayTravel: v.boolean(),
  }).index("by_game", ["gameId"])
    .index("by_user", ["userId"])
    .index("by_game_and_order", ["gameId", "order"]),

  trades: defineTable({
    gameId: v.id("games"),
    proposerId: v.id("players"),
    responderId: v.id("players"),
    offerProperties: v.array(v.number()),
    offerCash: v.number(),
    offerCards: v.number(),
    requestProperties: v.array(v.number()),
    requestCash: v.number(),
    requestCards: v.number(),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected")),
  }).index("by_game", ["gameId"])
    .index("by_game_and_status", ["gameId", "status"]),
});
