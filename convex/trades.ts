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
    if (args.offerCash < 0 || args.requestCash < 0) throw new Error("Cash cannot be negative");
    if (args.offerCards < 0 || args.requestCards < 0) throw new Error("Cards cannot be negative");

    const proposer = await ctx.db.get(args.proposerId);
    const responder = await ctx.db.get(args.responderId);
    if (!proposer || !responder) throw new Error("Player not found");

    const boardSpaces = await ctx.db.query("boardSpaces").withIndex("by_game", q => q.eq("gameId", args.gameId)).collect();

    for (const pos of args.offerProperties) {
      if (!proposer.properties.includes(pos)) throw new Error("Proposer doesn't own offered property");
      const space = boardSpaces.find(s => s.position === pos);
      if (space?.isMortgaged) throw new Error("Cannot trade mortgaged property");
    }
    for (const pos of args.requestProperties) {
      if (!responder.properties.includes(pos)) throw new Error("Responder doesn't own requested property");
      const space = boardSpaces.find(s => s.position === pos);
      if (space?.isMortgaged) throw new Error("Cannot trade mortgaged property");
    }

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

    if (proposer.money < trade.offerCash) throw new Error("Proposer lacks cash");
    if (responder.money < trade.requestCash) throw new Error("Responder lacks cash");

    const boardSpaces = await ctx.db.query("boardSpaces").withIndex("by_game", q => q.eq("gameId", trade.gameId)).collect();

    for (const pos of trade.offerProperties) {
      if (!proposer.properties.includes(pos)) throw new Error("Proposer no longer owns offered property");
      const space = boardSpaces.find(s => s.position === pos);
      if (space?.isMortgaged) throw new Error("Cannot trade mortgaged property");
    }
    for (const pos of trade.requestProperties) {
      if (!responder.properties.includes(pos)) throw new Error("Responder no longer owns requested property");
      const space = boardSpaces.find(s => s.position === pos);
      if (space?.isMortgaged) throw new Error("Cannot trade mortgaged property");
    }

    const newProposerProps = proposer.properties.filter(p => !trade.offerProperties.includes(p));
    const newResponderProps = responder.properties.filter(p => !trade.requestProperties.includes(p));
    newProposerProps.push(...trade.requestProperties);
    newResponderProps.push(...trade.offerProperties);

    const propMoney = proposer.money - trade.offerCash + trade.requestCash;
    const respMoney = responder.money - trade.requestCash + trade.offerCash;

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

    for (const pos of trade.offerProperties) {
      const space = boardSpaces.find(s => s.position === pos);
      if (space) await ctx.db.patch(space._id, { ownerId: trade.responderId });
    }
    for (const pos of trade.requestProperties) {
      const space = boardSpaces.find(s => s.position === pos);
      if (space) await ctx.db.patch(space._id, { ownerId: trade.proposerId });
    }

    await ctx.db.patch(tradeId, { status: "accepted" });
  },
});

export const rejectTrade = mutation({
  args: { tradeId: v.id("trades"), playerId: v.id("players") },
  handler: async (ctx, { tradeId, playerId }) => {
    const trade = await ctx.db.get(tradeId);
    if (!trade || trade.status !== "pending") throw new Error("Trade not available");
    if (trade.responderId !== playerId) throw new Error("Not your trade");
    await ctx.db.patch(tradeId, { status: "rejected" });
  },
});
