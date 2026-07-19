import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { formatMoney, getTokenEmoji } from "../lib/utils";
import { PROPERTIES, RAILWAYS, UTILITIES } from "../lib/constants";
import type { PlayerState, BoardSpaceState } from "../types";

interface Props {
  gameId: Id<"games">;
  me: PlayerState;
  players: PlayerState[];
  boardSpaces: BoardSpaceState[];
  onClose: () => void;
}

export default function TradeModal({ gameId, me, players, boardSpaces, onClose }: Props) {
  const [targetId, setTargetId] = useState<string>("");
  const [offerProps, setOfferProps] = useState<number[]>([]);
  const [offerCash, setOfferCash] = useState(0);
  const [requestProps, setRequestProps] = useState<number[]>([]);
  const [requestCash, setRequestCash] = useState(0);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"propose" | "incoming">("propose");
  const proposeTrade = useMutation(api.trades.proposeTrade);
  const acceptTrade = useMutation(api.trades.acceptTrade);
  const rejectTrade = useMutation(api.trades.rejectTrade);
  const trades = useQuery(api.trades.getTrades, { gameId });

  const others = players.filter(p => p._id !== me._id && !p.isBankrupt);
  const target = players.find(p => p._id === targetId);
  const incomingTrades = trades?.filter(t => t.responderId === me._id && t.status === "pending") ?? [];

  const propName = (pos: number) => {
    const p = PROPERTIES.find(pr => pr.position === pos);
    const r = RAILWAYS.find(rr => rr.position === pos);
    const u = UTILITIES.find(uu => uu.position === pos);
    return p?.name ?? r?.name ?? u?.name ?? `#${pos}`;
  };

  const toggleOfferProp = (pos: number) => {
    setOfferProps(prev => prev.includes(pos) ? prev.filter(p => p !== pos) : [...prev, pos]);
  };
  const toggleRequestProp = (pos: number) => {
    setRequestProps(prev => prev.includes(pos) ? prev.filter(p => p !== pos) : [...prev, pos]);
  };

  const handleSubmit = async () => {
    if (!targetId) { setError("Select a player"); return; }
    try {
      await proposeTrade({
        gameId, proposerId: me._id as Id<"players">, responderId: targetId as Id<"players">,
        offerProperties: offerProps, offerCash, offerCards: 0,
        requestProperties: requestProps, requestCash, requestCards: 0,
      });
      onClose();
    } catch (e: any) { setError(e.message); }
  };

  const handleAccept = async (tradeId: string) => {
    try {
      await acceptTrade({ tradeId: tradeId as Id<"trades">, playerId: me._id as Id<"players"> });
    } catch (e: any) { setError(e.message); }
  };

  const handleReject = async (tradeId: string) => {
    try {
      await rejectTrade({ tradeId: tradeId as Id<"trades">, playerId: me._id as Id<"players"> });
    } catch (e: any) { setError(e.message); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-timo-panel rounded-xl shadow-2xl w-[480px] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Trade</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">&times;</button>
          </div>

          <div className="flex gap-1 mb-4">
            <button onClick={() => setTab("propose")}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${tab === "propose" ? "bg-timo-accent text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
              Propose Trade
            </button>
            <button onClick={() => setTab("incoming")}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors relative ${tab === "incoming" ? "bg-timo-accent text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
              Incoming
              {incomingTrades.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {incomingTrades.length}
                </span>
              )}
            </button>
          </div>

          {tab === "propose" && (
            <>
              <div className="mb-4">
                <label className="text-sm text-gray-400 block mb-1">Trade with</label>
                <select value={targetId} onChange={e => setTargetId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 rounded border border-gray-600 focus:border-timo-gold focus:outline-none text-white">
                  <option value="">Select player...</option>
                  {others.map(p => <option key={p._id} value={p._id}>{getTokenEmoji(p.token)} {p.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="text-sm font-semibold text-green-400 mb-2">You Offer</h4>
                  <input type="number" value={offerCash || ""} onChange={e => setOfferCash(Math.max(0, Number(e.target.value) || 0))} placeholder="Cash" min={0}
                    className="w-full px-2 py-1.5 mb-2 bg-gray-800 rounded border border-gray-600 text-sm text-white font-mono" />
                  {me.properties.map(pos => (
                    <label key={pos} className="flex items-center gap-1.5 text-xs py-0.5 cursor-pointer">
                      <input type="checkbox" checked={offerProps.includes(pos)} onChange={() => toggleOfferProp(pos)} />
                      <span>{propName(pos)}</span>
                    </label>
                  ))}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-blue-400 mb-2">You Request</h4>
                  <input type="number" value={requestCash || ""} onChange={e => setRequestCash(Math.max(0, Number(e.target.value) || 0))} placeholder="Cash" min={0}
                    className="w-full px-2 py-1.5 mb-2 bg-gray-800 rounded border border-gray-600 text-sm text-white font-mono" />
                  {target?.properties.map(pos => (
                    <label key={pos} className="flex items-center gap-1.5 text-xs py-0.5 cursor-pointer">
                      <input type="checkbox" checked={requestProps.includes(pos)} onChange={() => toggleRequestProp(pos)} />
                      <span>{propName(pos)}</span>
                    </label>
                  ))}
                </div>
              </div>

              {error && <div className="text-red-400 text-sm mb-3">{error}</div>}
              <button onClick={handleSubmit} className="w-full py-2.5 bg-timo-accent hover:brightness-110 rounded-md font-semibold transition-all">
                Propose Trade
              </button>
            </>
          )}

          {tab === "incoming" && (
            <div className="space-y-3">
              {incomingTrades.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">No pending trades</p>
              )}
              {incomingTrades.map(trade => {
                const proposer = players.find(p => p._id === trade.proposerId);
                return (
                  <div key={trade._id} className="bg-gray-800/60 rounded-lg p-3">
                    <div className="text-sm font-semibold mb-2">
                      {getTokenEmoji(proposer?.token ?? "")} {proposer?.name ?? "Unknown"} offers:
                    </div>
                    <div className="text-xs text-gray-300 mb-1">
                      {trade.offerProperties.length > 0 && (
                        <div>Properties: {trade.offerProperties.map(p => propName(p)).join(", ")}</div>
                      )}
                      {trade.offerCash > 0 && <div>Cash: {formatMoney(trade.offerCash)}</div>}
                      {trade.offerProperties.length === 0 && trade.offerCash === 0 && <div>Nothing</div>}
                    </div>
                    <div className="text-xs text-gray-400 mb-2">
                      For: {trade.requestProperties.length > 0 && (
                        <span>{trade.requestProperties.map(p => propName(p)).join(", ")} </span>
                      )}
                      {trade.requestCash > 0 && <span>{formatMoney(trade.requestCash)}</span>}
                      {trade.requestProperties.length === 0 && trade.requestCash === 0 && <span>Nothing</span>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleAccept(trade._id)}
                        className="flex-1 py-1.5 bg-green-700 hover:bg-green-600 rounded text-xs font-semibold transition-colors">
                        Accept
                      </button>
                      <button onClick={() => handleReject(trade._id)}
                        className="flex-1 py-1.5 bg-red-700 hover:bg-red-600 rounded text-xs font-semibold transition-colors">
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
              {error && <div className="text-red-400 text-sm">{error}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
