import { mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { GO_SALARY, JAIL_FINE, PROPERTIES, RAILWAYS, UTILITIES, TAXES } from "../src/lib/constants";
import { movePlayer, countRailways, calculateRailwayRent, countUtilities, calculateUtilityRent, ownsColorGroup } from "../src/lib/gameLogic";
import type { Id } from "./_generated/dataModel";

async function getBoardSpaces(ctx: MutationCtx, gameId: Id<"games">) {
  const spaces = await ctx.db.query("boardSpaces").withIndex("by_game", q => q.eq("gameId", gameId)).collect();
  spaces.sort((a, b) => a.position - b.position);
  return spaces;
}

async function getSpaceByPosition(ctx: MutationCtx, gameId: Id<"games">, position: number) {
  return await ctx.db.query("boardSpaces").withIndex("by_game_and_position", q => q.eq("gameId", gameId).eq("position", position)).unique();
}

export const rollDice = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
  },
  handler: async (ctx, { gameId, playerId }) => {
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    const players = await ctx.db.query("players").withIndex("by_game", q => q.eq("gameId", gameId)).collect();
    players.sort((a, b) => a.order - b.order);
    const player = players[game.currentPlayerIndex];
    if (!player || player._id !== playerId) throw new Error("Not your turn");
    if (game.turnPhase !== "pre_roll") throw new Error("Wrong phase");

    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const doubles = die1 === die2;

    let newDoublesCount = doubles ? game.doublesCount + 1 : 0;

    if (newDoublesCount >= 3) {
      await ctx.db.patch(playerId, { isInJail: true, jailTurns: 0, position: 10 });
      await ctx.db.patch(gameId, {
        lastDice: { die1, die2, doubles },
        doublesCount: 0,
        turnPhase: "resolving",
      });
      return { die1, die2, doubles: true, newPosition: 10, wentToJail: true, passedGo: false };
    }

    const total = die1 + die2;
    const { position: newPos, passedGo } = movePlayer(player.position, total);

    let newMoney = player.money;
    if (passedGo) {
      newMoney += GO_SALARY;
    }

    await ctx.db.patch(playerId, { position: newPos, money: newMoney });
    await ctx.db.patch(gameId, {
      lastDice: { die1, die2, doubles },
      doublesCount: newDoublesCount,
      turnPhase: "resolving",
    });

    return { die1, die2, doubles, newPosition: newPos, wentToJail: false, passedGo };
  },
});

export const resolveSpace = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
  },
  handler: async (ctx, { gameId, playerId }) => {
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    const players = await ctx.db.query("players").withIndex("by_game", q => q.eq("gameId", gameId)).collect();
    players.sort((a, b) => a.order - b.order);
    const player = players.find(p => p._id === playerId);
    if (!player) throw new Error("Player not found");
    if (game.turnPhase !== "resolving") throw new Error("Wrong phase");
    const currentPlayer = players[game.currentPlayerIndex];
    if (!currentPlayer || currentPlayer._id !== playerId) throw new Error("Not your turn");

    const pos = player.position;
    const space = await getSpaceByPosition(ctx, gameId, pos);
    if (!space) throw new Error("Space not found");

    const prop = PROPERTIES.find(p => p.position === pos);
    const rail = RAILWAYS.find(r => r.position === pos);
    const util = UTILITIES.find(u => u.position === pos);
    const tax = TAXES.find(t => t.position === pos);

    const allSpaces = await getBoardSpaces(ctx, gameId);

    if (prop || rail || util) {
      if (space.ownerId && space.ownerId !== playerId && !space.isMortgaged) {
        let rent = 0;
        if (prop) {
          if (space.hasHotel) rent = prop.rent.hotel;
          else if ((space.houses ?? 0) > 0) {
            const keys = ["base", "oneHouse", "twoHouses", "threeHouses", "fourHouses"] as const;
            rent = prop.rent[keys[space.houses!]] ?? prop.rent.base;
          } else {
            const owner = players.find(p => p._id === space.ownerId);
            const hasColorSet = owner ? ownsColorGroup(owner, prop.color, allSpaces) : false;
            rent = hasColorSet ? prop.rent.colorSet : prop.rent.base;
          }
        } else if (rail) {
          const owner = players.find(p => p._id === space.ownerId);
          const numOwned = owner ? countRailways(owner, allSpaces) : 1;
          rent = calculateRailwayRent(numOwned);
        } else if (util) {
          const owner = players.find(p => p._id === space.ownerId);
          const numOwned = owner ? countUtilities(owner, allSpaces) : 1;
          const dice = (game.lastDice?.die1 ?? 0) + (game.lastDice?.die2 ?? 0);
          rent = calculateUtilityRent(numOwned, dice);
        }
        if (rent > 0) {
          const actualPayment = Math.min(rent, player.money);
          await ctx.db.patch(playerId, { money: player.money - actualPayment });
          const ownerId = space.ownerId!;
          const owner = await ctx.db.get(ownerId);
          if (owner) await ctx.db.patch(ownerId, { money: owner.money + actualPayment });
        }
        await ctx.db.patch(gameId, { turnPhase: "end_turn" });
        return { action: "paid_rent", rent };
      }
      if (!space.ownerId) {
        await ctx.db.patch(gameId, { turnPhase: "post_roll" });
        return { action: "can_buy", price: prop?.price ?? rail?.price ?? util?.price ?? 0 };
      }
      await ctx.db.patch(gameId, { turnPhase: "end_turn" });
      return { action: "nothing" };
    }

    if (tax) {
      const actualPayment = Math.min(tax.amount, player.money);
      await ctx.db.patch(playerId, { money: player.money - actualPayment });
      await ctx.db.patch(gameId, { turnPhase: "end_turn" });
      return { action: "tax", amount: tax.amount };
    }

    if (space.type === "chance" || space.type === "treasury") {
      await ctx.db.patch(gameId, { turnPhase: "post_roll" });
      return { action: "draw_card", deck: space.type as "chance" | "treasury" };
    }

    if (pos === 30) {
      await ctx.db.patch(playerId, { position: 10, isInJail: true, jailTurns: 0 });
      await ctx.db.patch(gameId, { turnPhase: "end_turn" });
      return { action: "go_to_jail" };
    }

    await ctx.db.patch(gameId, { turnPhase: "end_turn" });
    return { action: "nothing" };
  },
});

export const buyProperty = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
  },
  handler: async (ctx, { gameId, playerId }) => {
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    if (game.turnPhase !== "post_roll") throw new Error("Wrong phase");
    const players = await ctx.db.query("players").withIndex("by_game", q => q.eq("gameId", gameId)).collect();
    players.sort((a, b) => a.order - b.order);
    const player = players.find(p => p._id === playerId);
    if (!player) throw new Error("Player not found");
    const currentPlayer = players[game.currentPlayerIndex];
    if (!currentPlayer || currentPlayer._id !== playerId) throw new Error("Not your turn");

    const pos = player.position;
    const space = await getSpaceByPosition(ctx, gameId, pos);
    if (!space || space.ownerId) throw new Error("Cannot buy");

    const prop = PROPERTIES.find(p => p.position === pos);
    const rail = RAILWAYS.find(r => r.position === pos);
    const util = UTILITIES.find(u => u.position === pos);
    const price = prop?.price ?? rail?.price ?? util?.price;
    if (price === undefined) throw new Error("Not buyable");
    if (player.money < price) throw new Error("Not enough money");

    await ctx.db.patch(playerId, {
      money: player.money - price,
      properties: [...player.properties, pos],
    });
    await ctx.db.patch(space._id, { ownerId: playerId });
    await ctx.db.patch(gameId, { turnPhase: "end_turn" });
    return { success: true };
  },
});

export const startAuction = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    position: v.number(),
  },
  handler: async (ctx, { gameId, playerId, position }) => {
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    if (game.turnPhase !== "post_roll") throw new Error("Wrong phase");
    const players = await ctx.db.query("players").withIndex("by_game", q => q.eq("gameId", gameId)).collect();
    players.sort((a, b) => a.order - b.order);
    const currentPlayer = players[game.currentPlayerIndex];
    if (!currentPlayer || currentPlayer._id !== playerId) throw new Error("Not your turn");

    const activePlayers = players.filter(p => !p.isBankrupt);
    const bidderIds = activePlayers.map(p => p._id);

    await ctx.db.patch(gameId, {
      currentAuction: {
        propertyPosition: position,
        highestBid: 0,
        bidderIds,
        expiresAt: Date.now() + 60000,
      },
      turnPhase: "trading",
    });

    return { success: true };
  },
});

export const placeBid = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    amount: v.number(),
  },
  handler: async (ctx, { gameId, playerId, amount }) => {
    const game = await ctx.db.get(gameId);
    if (!game || !game.currentAuction) throw new Error("No auction active");
    const auction = game.currentAuction;

    const player = await ctx.db.get(playerId);
    if (!player) throw new Error("Player not found");
    if (amount <= 0) throw new Error("Bid must be positive");
    if (player.money < amount) throw new Error("Not enough money");
    if (amount <= auction.highestBid) throw new Error("Bid must be higher");
    if (!auction.bidderIds.includes(playerId)) throw new Error("Not a bidder");

    await ctx.db.patch(gameId, {
      currentAuction: {
        ...auction,
        highestBid: amount,
        highestBidderId: playerId,
      },
    });

    return { success: true };
  },
});

export const passAuction = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
  },
  handler: async (ctx, { gameId, playerId }) => {
    const game = await ctx.db.get(gameId);
    if (!game || !game.currentAuction) throw new Error("No auction active");

    let auction = game.currentAuction;
    if (auction.highestBidderId === playerId) {
      auction = { ...auction, highestBidderId: undefined, highestBid: 0 };
    }

    const remaining = auction.bidderIds.filter(id => id !== playerId);

    if (remaining.length <= 1) {
      const winnerId = auction.highestBidderId;
      if (winnerId && auction.highestBid > 0) {
        const winner = await ctx.db.get(winnerId);
        if (winner) {
          await ctx.db.patch(winnerId, {
            money: winner.money - auction.highestBid,
            properties: [...winner.properties, auction.propertyPosition],
          });
          const space = await getSpaceByPosition(ctx, gameId, auction.propertyPosition);
          if (space) await ctx.db.patch(space._id, { ownerId: winnerId });
          await ctx.db.patch(gameId, {
            currentAuction: undefined,
            turnPhase: "end_turn",
          });
        }
      } else {
        await ctx.db.patch(gameId, {
          currentAuction: undefined,
          turnPhase: "end_turn",
        });
      }
      return { ended: true, winnerId: auction.highestBidderId, price: auction.highestBid };
    }

    await ctx.db.patch(gameId, {
      currentAuction: {
        ...auction,
        bidderIds: remaining,
      },
    });

    return { ended: false };
  },
});

export const claimAuctionWin = mutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, { gameId }) => {
    const game = await ctx.db.get(gameId);
    if (!game || !game.currentAuction) throw new Error("No auction active");
    const auction = game.currentAuction;

    if (auction.bidderIds.length <= 1 || Date.now() > auction.expiresAt) {
      const winnerId = auction.highestBidderId;
      if (winnerId && auction.highestBid > 0) {
        const winner = await ctx.db.get(winnerId);
        if (winner) {
          await ctx.db.patch(winnerId, {
            money: winner.money - auction.highestBid,
            properties: [...winner.properties, auction.propertyPosition],
          });
          const space = await getSpaceByPosition(ctx, gameId, auction.propertyPosition);
          if (space) await ctx.db.patch(space._id, { ownerId: winnerId });
          await ctx.db.patch(gameId, {
            currentAuction: undefined,
            turnPhase: "end_turn",
          });
          return { winnerId, price: auction.highestBid };
        }
      }
      await ctx.db.patch(gameId, { currentAuction: undefined, turnPhase: "end_turn" });
      return { winnerId: undefined, price: 0 };
    }

    throw new Error("Auction still active");
  },
});

export const endTurn = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
  },
  handler: async (ctx, { gameId, playerId }) => {
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");

    const players = await ctx.db.query("players").withIndex("by_game", q => q.eq("gameId", gameId)).collect();
    players.sort((a, b) => a.order - b.order);

    const currentPlayer = players[game.currentPlayerIndex];
    if (!currentPlayer || currentPlayer._id !== playerId) throw new Error("Not your turn");

    if (game.lastDice?.doubles && game.turnPhase === "end_turn") {
      if (currentPlayer._id === playerId) {
        await ctx.db.patch(gameId, { turnPhase: "pre_roll" });
        return { nextPlayerIndex: game.currentPlayerIndex };
      }
    }

    let nextIdx = (game.currentPlayerIndex + 1) % players.length;
    let attempts = 0;
    while (players[nextIdx]?.isBankrupt && attempts < players.length) {
      nextIdx = (nextIdx + 1) % players.length;
      attempts++;
    }

    if (attempts >= players.length) {
      await ctx.db.patch(gameId, { status: "finished" });
      return { gameOver: true };
    }

    await ctx.db.patch(players[nextIdx]._id, { hasUsedRailwayTravel: false });

    await ctx.db.patch(gameId, {
      currentPlayerIndex: nextIdx,
      turnPhase: "pre_roll",
      doublesCount: 0,
      lastDice: undefined,
    });

    return { nextPlayerIndex: nextIdx };
  },
});

export const payJailFine = mutation({
  args: { gameId: v.id("games"), playerId: v.id("players") },
  handler: async (ctx, { gameId, playerId }) => {
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    if (game.turnPhase !== "pre_roll") throw new Error("Wrong phase");
    const player = await ctx.db.get(playerId);
    if (!player || !player.isInJail) throw new Error("Not in jail");
    if (player.money < JAIL_FINE) throw new Error("Not enough money");
    await ctx.db.patch(playerId, { money: player.money - JAIL_FINE, isInJail: false, jailTurns: 0 });
    await ctx.db.patch(gameId, { turnPhase: "pre_roll" });
  },
});

export const useJailCard = mutation({
  args: { gameId: v.id("games"), playerId: v.id("players") },
  handler: async (ctx, { gameId, playerId }) => {
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    if (game.turnPhase !== "pre_roll") throw new Error("Wrong phase");
    const player = await ctx.db.get(playerId);
    if (!player || !player.isInJail) throw new Error("Not in jail");
    if (player.getOutOfJailCards <= 0) throw new Error("No cards");
    await ctx.db.patch(playerId, { getOutOfJailCards: player.getOutOfJailCards - 1, isInJail: false, jailTurns: 0 });
    await ctx.db.patch(gameId, { turnPhase: "pre_roll" });
  },
});

export const tryJailDoubles = mutation({
  args: { gameId: v.id("games"), playerId: v.id("players") },
  handler: async (ctx, { gameId, playerId }) => {
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    if (game.turnPhase !== "pre_roll") throw new Error("Wrong phase");
    const player = await ctx.db.get(playerId);
    if (!player || !player.isInJail) throw new Error("Not in jail");

    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const doubles = die1 === die2;

    if (doubles) {
      const total = die1 + die2;
      const { position: newPos, passedGo } = movePlayer(player.position, total);
      let newMoney = player.money + (passedGo ? GO_SALARY : 0);
      await ctx.db.patch(playerId, { position: newPos, money: newMoney, isInJail: false, jailTurns: 0 });
      await ctx.db.patch(gameId, { lastDice: { die1, die2, doubles: true }, turnPhase: "resolving" });
      return { die1, die2, doubles: true, newPosition: newPos, passedGo, escaped: true };
    } else {
      const newTurns = player.jailTurns + 1;
      if (newTurns >= 3) {
        const actualFine = Math.min(JAIL_FINE, player.money);
        const total = die1 + die2;
        const { position: newPos, passedGo } = movePlayer(player.position, total);
        await ctx.db.patch(playerId, { position: newPos, money: player.money - actualFine + (passedGo ? GO_SALARY : 0), isInJail: false, jailTurns: 0 });
        await ctx.db.patch(gameId, { lastDice: { die1, die2, doubles: false }, turnPhase: "resolving" });
        return { die1, die2, doubles: false, newPosition: newPos, passedGo, escaped: true, forcedPay: true };
      }
      await ctx.db.patch(playerId, { jailTurns: newTurns });
      await ctx.db.patch(gameId, { lastDice: { die1, die2, doubles: false }, turnPhase: "end_turn" });
      return { die1, die2, doubles: false, newPosition: player.position, passedGo: false, escaped: false };
    }
  },
});

export const sendChat = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    message: v.string(),
  },
  handler: async (ctx, { gameId, playerId, message }) => {
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    const trimmed = message.trim().slice(0, 500);
    if (!trimmed) throw new Error("Empty message");
    await ctx.db.insert("chatMessages", { gameId, playerId, message: trimmed, timestamp: Date.now() });
  },
});
