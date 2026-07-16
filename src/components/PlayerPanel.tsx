import { getTokenEmoji, formatMoney } from "../lib/utils";
import { PROPERTIES, RAILWAYS, UTILITIES } from "../lib/constants";
import type { PlayerState } from "../types";

interface Props {
  players: PlayerState[];
  currentPlayerId?: string;
  myPlayerId: string;
}

export default function PlayerPanel({ players, currentPlayerId, myPlayerId }: Props) {
  const sorted = [...players].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Players</h2>
      {sorted.map(p => {
        const isCurrent = p._id === currentPlayerId;
        const isMe = p._id === myPlayerId;
        const propNames = p.properties.map(pos => {
          const prop = PROPERTIES.find(pr => pr.position === pos);
          const rail = RAILWAYS.find(r => r.position === pos);
          const util = UTILITIES.find(u => u.position === pos);
          return prop?.name ?? rail?.name ?? util?.name ?? `#${pos}`;
        });

        return (
          <div key={p._id}
            className={`rounded-md px-3 py-2 transition-all
              ${isCurrent ? "bg-timo-gold/15 border border-timo-gold/40" : "bg-gray-800/60 border border-transparent"}
              ${p.isBankrupt ? "opacity-40" : ""}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{getTokenEmoji(p.token)}</span>
              <span className={`flex-1 font-semibold text-sm ${isMe ? "text-timo-gold" : ""}`}>{p.name}</span>
              {p.isBot && <span className="text-[9px] text-blue-400 bg-blue-400/10 px-1 rounded">BOT</span>}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-green-400 font-mono font-bold">{formatMoney(p.money)}</span>
              {p.isInJail && <span className="text-red-400 text-[10px] bg-red-400/10 px-1 rounded">IN JAIL</span>}
              {p.isBankrupt && <span className="text-gray-500 text-[10px]">BANKRUPT</span>}
            </div>
            {propNames.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {propNames.map((name, i) => (
                  <span key={i} className="text-[9px] bg-gray-700 text-gray-300 px-1 rounded">{name}</span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
