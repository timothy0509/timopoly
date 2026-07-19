import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { BOARD_SPACES, PROPERTIES, RAILWAYS, UTILITIES, RAILWAY_POSITIONS } from "../lib/constants";
import { getTokenEmoji, formatMoney } from "../lib/utils";
import BoardSpace from "./BoardSpace";
import PlayerPanel from "./PlayerPanel";
import DiceRoller from "./DiceRoller";
import PropertyCard from "./PropertyCard";
import CardModal from "./CardModal";
import TradeModal from "./TradeModal";
import BuildPanel from "./BuildPanel";
import RailwayTravel from "./RailwayTravel";
import JailModal from "./JailModal";
import ChatPanel from "./ChatPanel";
import AuctionModal from "./AuctionModal";
import type { CardDef } from "../types";

interface Props {
  gameId: Id<"games">;
  playerId: Id<"players">;
}

export default function GameBoard({ gameId, playerId }: Props) {
  const game = useQuery(api.games.getById, { id: gameId });
  const players = useQuery(api.players.getByGame, { gameId });

  const sortedPlayers = useMemo(() => {
    if (!players) return undefined;
    return [...players].sort((a, b) => a.order - b.order);
  }, [players]);

  const rollDice = useMutation(api.turns.rollDice);
  const resolveSpace = useMutation(api.turns.resolveSpace);
  const buyProperty = useMutation(api.turns.buyProperty);
  const endTurn = useMutation(api.turns.endTurn);
  const drawCard = useMutation(api.cards.drawCard);
  const payJailFine = useMutation(api.turns.payJailFine);
  const useJailCard = useMutation(api.turns.useJailCard);
  const tryJailDoubles = useMutation(api.turns.tryJailDoubles);
  const executeBotTurn = useMutation(api.bots.executeBotTurn);
  const startAuction = useMutation(api.turns.startAuction);
  const placeBid = useMutation(api.turns.placeBid);
  const passAuction = useMutation(api.turns.passAuction);

  const [isRolling, setIsRolling] = useState(false);
  const [showProperty, setShowProperty] = useState<number | null>(null);
  const [showCard, setShowCard] = useState<{ card: CardDef; result?: Record<string, unknown> } | null>(null);
  const [showTrade, setShowTrade] = useState(false);
  const [showBuild, setShowBuild] = useState(false);
  const [showRailway, setShowRailway] = useState(false);
  const [showJail, setShowJail] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const handleBotTurn = useCallback(async (botId: string) => {
    try {
      await executeBotTurn({ gameId, playerId: botId as Id<"players"> });
      const result = await rollDice({ gameId, playerId: botId as Id<"players"> });
      if (!result.wentToJail) {
        const resolved = await resolveSpace({ gameId, playerId: botId as Id<"players"> });
        if (resolved.action === "can_buy") {
          const bot = sortedPlayers?.find(p => p._id === botId);
          if (bot && (bot.botDifficulty === "medium" || bot.botDifficulty === "hard") && bot.money >= (resolved.price ?? 0)) {
            await buyProperty({ gameId, playerId: botId as Id<"players"> });
          }
        }
        if (resolved.action === "draw_card") {
          await drawCard({ gameId, playerId: botId as Id<"players">, deck: resolved.deck });
        }
      }
      await endTurn({ gameId, playerId: botId as Id<"players"> });
    } catch (e) {
      console.error("Bot turn failed:", e);
    }
  }, [gameId, sortedPlayers, executeBotTurn, rollDice, resolveSpace, buyProperty, drawCard, endTurn]);

  const handleBotJail = useCallback(async (botId: string) => {
    await tryJailDoubles({ gameId, playerId: botId as Id<"players"> });
    await endTurn({ gameId, playerId: botId as Id<"players"> });
  }, [gameId, tryJailDoubles, endTurn]);

  useEffect(() => {
    if (game?.turnPhase === "pre_roll" && game?.status === "playing") {
      const cp = sortedPlayers?.[game.currentPlayerIndex];
      if (cp?.isInJail) {
        if (cp.isBot) {
          handleBotJail(cp._id);
        } else if (cp._id === playerId) {
          setShowJail(true);
        }
      } else if (cp?.isBot) {
        handleBotTurn(cp._id);
      }
    }
  }, [game?.turnPhase, game?.currentPlayerIndex, game?.status, handleBotTurn, handleBotJail, sortedPlayers, playerId]);

  const me = sortedPlayers?.find(p => p._id === playerId);
  const currentPlayer = sortedPlayers?.[game?.currentPlayerIndex ?? 0];
  const isMyTurn = currentPlayer?._id === playerId;
  const dice = game?.lastDice;

  const handleRoll = async () => {
    if (!isMyTurn || !me) return;
    setIsRolling(true);
    await new Promise(r => setTimeout(r, 600));
    try {
      const result = await rollDice({ gameId, playerId });
      setIsRolling(false);
      if (result.wentToJail) {
        setLastResult({ ...result, action: "go_to_jail" });
        await endTurn({ gameId, playerId });
      } else {
        const resolved = await resolveSpace({ gameId, playerId });
        setLastResult({ ...result, ...resolved });
        if (resolved.action === "can_buy" || resolved.action === "draw_card") {
          // Wait for user action
        } else {
          // Auto end for tax/rent/nothing
          setTimeout(() => setLastResult(null), 2000);
        }
      }
    } catch (e: any) {
      setIsRolling(false);
      alert(e.message);
    }
  };

  const handleBuy = async () => {
    try {
      await buyProperty({ gameId, playerId });
      setLastResult(null);
    } catch (e: any) { alert(e.message); }
  };

  const handleDeclineBuy = async () => {
    if (lastResult?.newPosition !== undefined || lastResult?.action === "can_buy") {
      await startAuction({ gameId, playerId, position: me!.position });
      setLastResult(null);
    } else {
      await endTurn({ gameId, playerId });
      setLastResult(null);
    }
  };

  const handleAuctionBid = async (amount: number) => {
    try {
      await placeBid({ gameId, playerId, amount });
    } catch (e: any) { alert(e.message); }
  };

  const handleAuctionPass = async () => {
    try {
      const result = await passAuction({ gameId, playerId });
      if (result.ended && !result.winnerId) {
        await endTurn({ gameId, playerId });
      }
    } catch (e: any) { alert(e.message); }
  };

  const handleDrawCard = async () => {
    if (!lastResult?.deck) return;
    try {
      const result = await drawCard({ gameId, playerId, deck: lastResult.deck });
      setShowCard({ card: result.card as CardDef, result });
      setLastResult(null);
    } catch (e: any) { alert(e.message); }
  };

  const handleEndTurn = async () => {
    try {
      await endTurn({ gameId, playerId });
      setLastResult(null);
    } catch (e: any) { alert(e.message); }
  };

  const handlePayJailFine = async () => {
    try { await payJailFine({ gameId, playerId }); setShowJail(false); } catch (e: any) { alert(e.message); }
  };
  const handleUseJailCard = async () => {
    try { await useJailCard({ gameId, playerId }); setShowJail(false); } catch (e: any) { alert(e.message); }
  };
  const handleTryDoubles = async () => {
    try {
      const result = await tryJailDoubles({ gameId, playerId });
      setShowJail(false);
      if (result.escaped) {
        const resolved = await resolveSpace({ gameId, playerId });
        setLastResult({ ...result, ...resolved });
      }
    } catch (e: any) { alert(e.message); }
  };

  if (!game || !sortedPlayers || !me) {
    return <div className="flex items-center justify-center h-screen bg-timo-dark text-white">Loading...</div>;
  }

  // Build 11x11 grid
  const grid: (number | null)[][] = [];
  for (let r = 0; r < 11; r++) {
    const row: (number | null)[] = [];
    for (let c = 0; c < 11; c++) {
      if (r === 0) row.push(20 + c);
      else if (r === 10) row.push(10 - c);
      else if (c === 0) row.push(20 - r);
      else if (c === 10) row.push(30 + r);
      else row.push(null);
    }
    grid.push(row);
  }

  const canRoll = isMyTurn && game.turnPhase === "pre_roll" && !me.isInJail;
  const canBuy = isMyTurn && lastResult?.action === "can_buy";
  const canDraw = isMyTurn && lastResult?.action === "draw_card";
  const canEndTurn = isMyTurn && (game.turnPhase === "end_turn" || game.turnPhase === "post_roll" || game.turnPhase === "trading" || game.turnPhase === "building");
  const canRailway = isMyTurn && me.position !== undefined && RAILWAY_POSITIONS.includes(me.position) && !me.hasUsedRailwayTravel &&
    RAILWAY_POSITIONS.some(pos => {
      const s = game.boardSpaces.find(sp => sp.position === pos);
      return s?.ownerId === playerId && pos !== me.position;
    });

  return (
    <div className="flex flex-col h-screen bg-timo-dark overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-timo-panel border-b border-gray-800 shrink-0">
        <h1 className="text-lg font-black text-timo-gold tracking-tight">TIMOPOLY</h1>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500">Code: <span className="text-white font-mono font-bold">{game.code}</span></span>
          <span className="text-xs text-gray-500">Houses: <span className="text-white font-bold">{game.houseSupply}</span></span>
          <span className="text-xs text-gray-500">Hotels: <span className="text-white font-bold">{game.hotelSupply}</span></span>
        </div>
      </header>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Board */}
        <div className="flex-1 flex items-center justify-center p-2 overflow-auto">
          <div className="grid grid-cols-11 grid-rows-11 border-2 border-gray-700"
            style={{ width: "min(70vh, 640px)", height: "min(70vh, 640px)" }}>
            {grid.flatMap((row, r) =>
              row.map((pos, c) => {
                if (pos === null) {
                  return <div key={`${r}-${c}`} className="bg-gray-900/50 flex items-center justify-center">
                    {r === 5 && c === 5 && (
                      <div className="text-center">
                        <div className="text-timo-gold font-black text-lg leading-none">T</div>
                        <div className="text-[7px] text-gray-600">TIMOTOPOLY</div>
                      </div>
                    )}
                  </div>;
                }
                const space = game.boardSpaces.find(s => s.position === pos);
                const playersHere = sortedPlayers.filter(p => p.position === pos && !p.isBankrupt);
                return (
                  <div key={`${r}-${c}`} className="cursor-pointer" onClick={() => setShowProperty(pos)}>
                    <BoardSpace position={pos} space={space} playersHere={playersHere}
                      isCurrentPosition={currentPlayer?.position === pos} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Side panel */}
        <aside className="w-64 bg-timo-panel border-l border-gray-800 flex flex-col shrink-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* Current turn indicator */}
            <div className="bg-gray-800/80 rounded-lg px-3 py-2">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">
                {isMyTurn ? "Your Turn" : `${currentPlayer?.name ?? ""}'s Turn`}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">{getTokenEmoji(currentPlayer?.token ?? "")}</span>
                <span className="font-semibold text-sm">{currentPlayer?.name}</span>
                <span className="ml-auto text-xs text-gray-500 capitalize">{game.turnPhase.replace("_", " ")}</span>
              </div>
            </div>

            {/* Dice */}
            <DiceRoller die1={dice?.die1} die2={dice?.die2} onRoll={handleRoll} canRoll={canRoll} isRolling={isRolling} />

            {/* Action buttons */}
            <div className="space-y-1.5">
              {canBuy && (
                <div className="flex gap-1.5">
                  <button onClick={handleBuy}
                    className="flex-1 py-2 bg-green-700 hover:bg-green-600 rounded-md text-sm font-semibold transition-colors">
                    Buy {formatMoney(lastResult?.price ?? 0)}
                  </button>
                  <button onClick={handleDeclineBuy}
                    className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-medium transition-colors">
                    Decline
                  </button>
                </div>
              )}
              {canDraw && (
                <button onClick={handleDrawCard}
                  className="w-full py-2 bg-yellow-700 hover:bg-yellow-600 rounded-md text-sm font-semibold transition-colors">
                  Draw Card
                </button>
              )}
              {canRailway && (
                <button onClick={() => setShowRailway(true)}
                  className="w-full py-2 bg-purple-700 hover:bg-purple-600 rounded-md text-sm font-semibold transition-colors">
                  Railway Travel
                </button>
              )}
              <div className="flex gap-1.5">
                <button onClick={() => setShowBuild(true)}
                  className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-xs font-medium transition-colors">
                  Properties
                </button>
                <button onClick={() => setShowTrade(true)}
                  className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-xs font-medium transition-colors">
                  Trade
                </button>
                {isMyTurn && (
                  <button onClick={handleEndTurn}
                    className="flex-1 py-2 bg-timo-accent/80 hover:bg-timo-accent rounded-md text-xs font-semibold transition-colors">
                    End Turn
                  </button>
                )}
              </div>
            </div>

            {/* Player panel */}
            <PlayerPanel players={sortedPlayers} currentPlayerId={currentPlayer?._id} myPlayerId={playerId} />
          </div>

          {/* Chat */}
          <div className="h-40 border-t border-gray-800 p-2 shrink-0">
            <ChatPanel gameId={gameId} playerId={playerId} players={sortedPlayers} chatLog={game.chatLog} />
          </div>
        </aside>
      </div>

      {/* Status message */}
      {lastResult?.action === "paid_rent" && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-900/90 text-white px-6 py-3 rounded-lg shadow-xl z-40">
          Paid {formatMoney(lastResult.rent)} rent
        </div>
      )}
      {lastResult?.action === "tax" && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-orange-900/90 text-white px-6 py-3 rounded-lg shadow-xl z-40">
          Paid {formatMoney(lastResult.amount)} tax
        </div>
      )}
      {lastResult?.action === "go_to_jail" && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-900/90 text-white px-6 py-3 rounded-lg shadow-xl z-40">
          Sent to TimoJail!
        </div>
      )}
      {lastResult?.action === "nothing" && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-800/90 text-gray-300 px-6 py-3 rounded-lg shadow-xl z-40">
          Nothing to do here
        </div>
      )}

      {/* Modals */}
      {showProperty !== null && (
        <PropertyCard position={showProperty}
          space={game.boardSpaces.find(s => s.position === showProperty) ?? { position: showProperty, type: "", name: "" }}
          onClose={() => setShowProperty(null)} />
      )}
      {showCard && <CardModal card={showCard.card} result={showCard.result} onClose={() => setShowCard(null)} />}
      {showTrade && me && (
        <TradeModal gameId={gameId} me={me} players={sortedPlayers} boardSpaces={game.boardSpaces} onClose={() => setShowTrade(false)} />
      )}
      {showBuild && me && (
        <BuildPanel gameId={gameId} player={me} boardSpaces={game.boardSpaces} onClose={() => setShowBuild(false)} />
      )}
      {showRailway && me && (
        <RailwayTravel gameId={gameId} player={me} boardSpaces={game.boardSpaces} onClose={() => setShowRailway(false)} />
      )}
      {showJail && me && (
        <JailModal player={me} onPayFine={handlePayJailFine} onUseCard={handleUseJailCard} onTryDoubles={handleTryDoubles} onClose={() => setShowJail(false)} />
      )}
      {game.currentAuction && (
        <AuctionModal
          position={game.currentAuction.propertyPosition}
          players={sortedPlayers}
          currentPlayerId={playerId}
          onBid={handleAuctionBid}
          onPass={handleAuctionPass}
          highestBid={game.currentAuction.highestBid}
        />
      )}
    </div>
  );
}
