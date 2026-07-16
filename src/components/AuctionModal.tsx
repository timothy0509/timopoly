import { useState } from "react";
import { formatMoney } from "../lib/utils";
import { PROPERTIES, RAILWAYS, UTILITIES, getColorForPosition, getSpaceColorClass } from "../lib/constants";
import type { PlayerState } from "../types";

interface Props {
  position: number;
  players: PlayerState[];
  currentPlayerId: string;
  onBid: (amount: number) => void;
  onPass: () => void;
  highestBid: number;
}

export default function AuctionModal({ position, players, currentPlayerId, onBid, onPass, highestBid }: Props) {
  const [bid, setBid] = useState(highestBid + 10);
  const prop = PROPERTIES.find(p => p.position === position);
  const rail = RAILWAYS.find(r => r.position === position);
  const util = UTILITIES.find(u => u.position === position);
  const name = prop?.name ?? rail?.name ?? util?.name ?? "Unknown";
  const color = getColorForPosition(position);
  const colorClass = getSpaceColorClass(color);
  const me = players.find(p => p._id === currentPlayerId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-timo-panel rounded-xl shadow-2xl w-80 overflow-hidden">
        {color && <div className={`h-3 ${colorClass}`} />}
        <div className="p-5">
          <h3 className="text-lg font-bold mb-1">Auction: {name}</h3>
          <p className="text-sm text-gray-400 mb-4">Highest bid: <span className="text-white font-mono">{formatMoney(highestBid)}</span></p>
          <div className="flex gap-2 mb-4">
            <input type="number" value={bid} onChange={e => setBid(Math.max(highestBid + 1, Number(e.target.value)))}
              min={highestBid + 1} max={me?.money ?? 0}
              className="flex-1 px-3 py-2 bg-gray-800 rounded border border-gray-600 focus:border-timo-gold focus:outline-none text-white font-mono" />
            <button onClick={() => onBid(bid)} disabled={bid <= highestBid || (me && bid > me.money)}
              className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded font-semibold text-sm disabled:opacity-40 transition-colors">
              Bid
            </button>
          </div>
          <button onClick={onPass} className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium transition-colors">
            Pass
          </button>
        </div>
      </div>
    </div>
  );
}
