import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { CHANCE_CARDS, TREASURY_CARDS, GO_SALARY } from "../src/lib/constants";
import { movePlayer, nearestRailwayPosition, nearestUtilityPosition, countBuildings } from "../src/lib/gameLogic";

export const drawCard = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    deck: v.union(v.literal("chance"), v.literal("treasury")),
  },
  handler: async (ctx, { gameId, playerId, deck }) => {
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    const player = await ctx.db.get(playerId);
    if (!player) throw new Error("Player not found");

    const isChance = deck === "chance";
    const cardIndex = isChance
      ? game.chanceDeck[game.chanceIndex % game.chanceDeck.length]
      : game.treasuryDeck[game.treasuryIndex % game.treasuryDeck.length];
    const card = isChance ? CHANCE_CARDS[cardIndex] : TREASURY_CARDS[cardIndex];
    if (!card) throw new Error("Card not found");

    if (isChance) {
      await ctx.db.patch(gameId, { chanceIndex: game.chanceIndex + 1 });
    } else {
      await ctx.db.patch(gameId, { treasuryIndex: game.treasuryIndex + 1 });
    }

    let result: Record<string, unknown> = { card, action: card.effectType };
    let isMoveEffect = false;

    switch (card.effectType) {
      case "move_to": {
        isMoveEffect = true;
        const target = card.position!;
        const steps = target > player.position ? target - player.position : 40 - player.position + target;
        const passedGo = target < player.position || (player.position + steps >= 40);
        let newMoney = player.money + (passedGo ? GO_SALARY : 0);
        await ctx.db.patch(playerId, { position: target, money: newMoney });
        result.newPosition = target;
        result.passedGo = passedGo;
        break;
      }
      case "nearest_railway": {
        isMoveEffect = true;
        const target = nearestRailwayPosition(player.position);
        const passedGo = target < player.position;
        let newMoney = player.money + (passedGo ? GO_SALARY : 0);
        await ctx.db.patch(playerId, { position: target, money: newMoney });
        result.newPosition = target;
        result.passedGo = passedGo;
        break;
      }
      case "nearest_utility": {
        isMoveEffect = true;
        const target = nearestUtilityPosition(player.position);
        const passedGo = target < player.position;
        let newMoney = player.money + (passedGo ? GO_SALARY : 0);
        await ctx.db.patch(playerId, { position: target, money: newMoney });
        result.newPosition = target;
        result.passedGo = passedGo;
        break;
      }
      case "go_back": {
        isMoveEffect = true;
        const newPos = (player.position - (card.value ?? 3) + 40) % 40;
        await ctx.db.patch(playerId, { position: newPos });
        result.newPosition = newPos;
        break;
      }
      case "go_to_jail": {
        isMoveEffect = true;
        await ctx.db.patch(playerId, { position: 10, isInJail: true, jailTurns: 0 });
        result.newPosition = 10;
        break;
      }
      case "get_out_of_jail": {
        await ctx.db.patch(playerId, { getOutOfJailCards: player.getOutOfJailCards + 1 });
        break;
      }
      case "collect": {
        await ctx.db.patch(playerId, { money: player.money + (card.value ?? 0) });
        break;
      }
      case "pay": {
        const newMoney = Math.max(0, player.money - (card.value ?? 0));
        await ctx.db.patch(playerId, { money: newMoney });
        break;
      }
      case "repairs": {
        const perHotel = isChance ? 100 : 115;
        const boardSpaces = await ctx.db.query("boardSpaces").withIndex("by_game", q => q.eq("gameId", gameId)).collect();
        const { houses, hotels } = countBuildings(player, boardSpaces);
        const cost = (houses * (card.value ?? 0)) + (hotels * perHotel);
        const newMoney = Math.max(0, player.money - cost);
        await ctx.db.patch(playerId, { money: newMoney });
        result.cost = cost;
        break;
      }
      case "pay_each": {
        const allPlayers = await ctx.db.query("players").withIndex("by_game", q => q.eq("gameId", gameId)).collect();
        const others = allPlayers.filter(p => p._id !== playerId && !p.isBankrupt);
        const amount = card.value ?? 0;
        let totalPay = amount * others.length;
        const actualTotalPay = Math.min(totalPay, player.money);
        const actualPerPlayer = Math.floor(actualTotalPay / others.length);
        await ctx.db.patch(playerId, { money: player.money - actualTotalPay });
        for (const other of others) {
          await ctx.db.patch(other._id, { money: other.money + actualPerPlayer });
        }
        break;
      }
      case "collect_each": {
        const allPlayers = await ctx.db.query("players").withIndex("by_game", q => q.eq("gameId", gameId)).collect();
        const others = allPlayers.filter(p => p._id !== playerId && !p.isBankrupt);
        const amount = card.value ?? 0;
        let totalCollect = 0;
        for (const other of others) {
          const pay = Math.min(other.money, amount);
          await ctx.db.patch(other._id, { money: other.money - pay });
          totalCollect += pay;
        }
        await ctx.db.patch(playerId, { money: player.money + totalCollect });
        break;
      }
    }

    if (isMoveEffect) {
      await ctx.db.patch(gameId, { turnPhase: "resolving" });
    } else {
      await ctx.db.patch(gameId, { turnPhase: "end_turn" });
    }
    return result;
  },
});
