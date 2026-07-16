import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getTrades = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => {
    return await ctx.db.query("trades").withIndex("by_game", q => q.eq("gameId", gameId)).collect();
  },
});

export const proposeTrade = mutation({
  args: {
    gameId: v.id("games"),
    proposerId: v.id("players"),
    responderId: v.id("players"),
    offerProperties: v.array(v.number()),
    offerCash: v.number(),
    offerCards: v.number(),
    requestProperties: v.array(v.number()),
    requestCash: v.number(),
    requestCards: v.number(),
  },
  handler: async (ctx, args) => {
    const tradeId = await ctx.db.insert("trades", {
      gameId: args.gameId,
      proposerId: args.proposerId,
      responderId: args.responderId,
      offerProperties: args.offerProperties,
      offerCash: args.offerCash,
      offerCards: args.offerCards,
      requestProperties: args.requestProperties,
      requestCash: args.requestCash,
      requestCards: args.requestCards,
      status: "pending",
    });
    return tradeId;
  },
});

export const acceptTrade = mutation({
  args: { tradeId: v.id("trades"), playerId: v.id("players") },
  handler: async (ctx, { tradeId, playerId }) => {
    const trade = await ctx.db.get(tradeId);
    if (!trade || trade.status !== "pending") throw new Error("Trade not available");
    if (trade.responderId !== playerId) throw new Error("Not your trade");

    const proposer = await ctx.db.get(trade.proposerId);
    const responder = await ctx.db.get(trade.responderId);
    if (!proposer || !responder) throw new Error("Player not found");

    const game = await ctx.db.get(trade.gameId);
    if (!game) throw new Error("Game not found");

    // Verify both players have what they're offering
    if (proposer.money < trade.offerCash) throw new Error("Proposer lacks cash");
    if (responder.money < trade.requestCash) throw new Error("Responder lacks cash");

    // Transfer properties
    const newProposerProps = proposer.properties.filter(p => !trade.offerProperties.includes(p));
    const newResponderProps = responder.properties.filter(p => !trade.requestProperties.includes(p));
    newProposerProps.push(...trade.requestProperties);
    newResponderProps.push(...trade.offerProperties);

    // Transfer cash
    const propMoney = proposer.money - trade.offerCash + trade.requestCash;
    const respMoney = responder.money - trade.requestCash + trade.offerCash;

    // Transfer jail cards
    const propCards = proposer.getOutOfJailCards - trade.offerCards + trade.requestCards;
    const respCards = responder.getOutOfJailCards - trade.requestCards + trade.offerCards;

    await ctx.db.patch(trade.proposerId, {
      money: propMoney,
      properties: newProposerProps,
      getOutOfJailCards: propCards,
    });
    await ctx.db.patch(trade.responderId, {
      money: respMoney,
      properties: newResponderProps,
      getOutOfJailCards: respCards,
    });

    // Update board space ownership
    const newSpaces = game.boardSpaces.map(s => {
      if (trade.offerProperties.includes(s.position)) return { ...s, ownerId: trade.responderId };
      if (trade.requestProperties.includes(s.position)) return { ...s, ownerId: trade.proposerId };
      return s;
    });
    await ctx.db.patch(trade.gameId, { boardSpaces: newSpaces });
    await ctx.db.patch(tradeId, { status: "accepted" });
  },
});

export const rejectTrade = mutation({
  args: { tradeId: v.id("trades"), playerId: v.id("players") },
  handler: async (ctx, { tradeId }) => {
    await ctx.db.patch(tradeId, { status: "rejected" });
  },
});
