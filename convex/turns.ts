import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { GO_SALARY, JAIL_FINE, PROPERTIES, RAILWAYS, UTILITIES, TAXES } from "../src/lib/constants";
import { movePlayer, countRailways, calculateRailwayRent, countUtilities, calculateUtilityRent, calculatePropertyRent, ownsColorGroup } from "../src/lib/gameLogic";

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

    // 3 consecutive doubles -> jail
    if (newDoublesCount >= 3) {
      await ctx.db.patch(playerId, { isInJail: true, jailTurns: 0 });
      await ctx.db.patch(gameId, {
        lastDice: { die1, die2, doubles },
        doublesCount: 0,
        turnPhase: "resolving",
        boardSpaces: game.boardSpaces.map(s =>
          s.name === "TimoJail" ? s : s
        ),
      });
      return { die1, die2, doubles: true, newPosition: 10, wentToJail: true, passedGo: false };
    }

    const total = die1 + die2;
    const { position: newPos, passedGo } = movePlayer(player.position, total);

    let newMoney = player.money;
    if (passedGo && newPos !== 0) {
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
    const player = await ctx.db.get(playerId);
    if (!player) throw new Error("Player not found");
    if (game.turnPhase !== "resolving") throw new Error("Wrong phase");

    const pos = player.position;
    const space = game.boardSpaces.find(s => s.position === pos);
    if (!space) throw new Error("Space not found");

    // Property / Railway / Utility
    const prop = PROPERTIES.find(p => p.position === pos);
    const rail = RAILWAYS.find(r => r.position === pos);
    const util = UTILITIES.find(u => u.position === pos);
    const tax = TAXES.find(t => t.position === pos);

    if (prop || rail || util) {
      if (space.ownerId && space.ownerId !== playerId && !space.isMortgaged) {
        // Pay rent
        let rent = 0;
        const allSpaces = game.boardSpaces;
        if (prop) {
          if (space.hasHotel) rent = prop.rent.hotel;
          else if ((space.houses ?? 0) > 0) {
            const keys = ["base", "oneHouse", "twoHouses", "threeHouses", "fourHouses"] as const;
            rent = prop.rent[keys[space.houses!]] ?? prop.rent.base;
          } else {
            // Check color set
            const allPlayers = await ctx.db.query("players").withIndex("by_game", q => q.eq("gameId", gameId)).collect();
            const owner = allPlayers.find(p => p._id === space.ownerId);
            const hasColorSet = owner ? ownsColorGroup(owner, prop.color, allSpaces) : false;
            rent = hasColorSet ? prop.rent.colorSet : prop.rent.base;
          }
        } else if (rail) {
          const allPlayers = await ctx.db.query("players").withIndex("by_game", q => q.eq("gameId", gameId)).collect();
          const owner = allPlayers.find(p => p._id === space.ownerId);
          const numOwned = owner ? countRailways(owner, allSpaces) : 1;
          rent = calculateRailwayRent(numOwned);
        } else if (util) {
          const allPlayers = await ctx.db.query("players").withIndex("by_game", q => q.eq("gameId", gameId)).collect();
          const owner = allPlayers.find(p => p._id === space.ownerId);
          const numOwned = owner ? countUtilities(owner, allSpaces) : 1;
          const dice = (game.lastDice?.die1 ?? 0) + (game.lastDice?.die2 ?? 0);
          rent = calculateUtilityRent(numOwned, dice);
        }
        if (rent > 0) {
          const newMoney = Math.max(0, player.money - rent);
          await ctx.db.patch(playerId, { money: newMoney });
          // Credit owner
          const ownerId = space.ownerId!;
          const owner = await ctx.db.get(ownerId);
          if (owner) await ctx.db.patch(ownerId, { money: owner.money + rent });
        }
        await ctx.db.patch(gameId, { turnPhase: "end_turn" });
        return { action: "paid_rent", rent };
      }
      if (!space.ownerId) {
        await ctx.db.patch(gameId, { turnPhase: "post_roll" });
        return { action: "can_buy", price: prop?.price ?? rail?.price ?? util?.price ?? 0 };
      }
      // Owned by self or mortgaged
      await ctx.db.patch(gameId, { turnPhase: "end_turn" });
      return { action: "nothing" };
    }

    if (tax) {
      const newMoney = Math.max(0, player.money - tax.amount);
      await ctx.db.patch(playerId, { money: newMoney });
      await ctx.db.patch(gameId, { turnPhase: "end_turn" });
      return { action: "tax", amount: tax.amount };
    }

    if (space.type === "chance" || space.type === "treasury") {
      await ctx.db.patch(gameId, { turnPhase: "post_roll" });
      return { action: "draw_card", deck: space.type };
    }

    // Corner spaces
    if (pos === 30) {
      // Go to Jail
      await ctx.db.patch(playerId, { position: 10, isInJail: true, jailTurns: 0 });
      await ctx.db.patch(gameId, { turnPhase: "end_turn" });
      return { action: "go_to_jail" };
    }

    // Free parking, just visiting jail, GO (already handled)
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
    const player = await ctx.db.get(playerId);
    if (!player) throw new Error("Player not found");

    const pos = player.position;
    const space = game.boardSpaces.find(s => s.position === pos);
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
    await ctx.db.patch(gameId, {
      boardSpaces: game.boardSpaces.map(s =>
        s.position === pos ? { ...s, ownerId: playerId } : s
      ),
      turnPhase: "end_turn",
    });
    return { success: true };
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

    // If doubles, same player goes again
    if (game.lastDice?.doubles && game.turnPhase === "end_turn") {
      const player = players[game.currentPlayerIndex];
      if (player && player._id === playerId) {
        await ctx.db.patch(gameId, { turnPhase: "pre_roll" });
        return { nextPlayerIndex: game.currentPlayerIndex };
      }
    }

    // Find next non-bankrupt player
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

    // Reset railway travel for next player
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
        // Must pay after 3 failed attempts
        const newMoney = Math.max(0, player.money - JAIL_FINE);
        const total = die1 + die2;
        const { position: newPos, passedGo } = movePlayer(player.position, total);
        await ctx.db.patch(playerId, { position: newPos, money: newMoney + (passedGo ? GO_SALARY : 0), isInJail: false, jailTurns: 0 });
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
    await ctx.db.patch(gameId, {
      chatLog: [...game.chatLog, { playerId, message, timestamp: Date.now() }],
    });
  },
});
