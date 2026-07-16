import { BOARD_SPACES, PROPERTIES, RAILWAYS, UTILITIES, getColorForPosition, getSpaceColorClass } from "../lib/constants";
import { getTokenEmoji, formatMoney } from "../lib/utils";
import type { BoardSpaceState, PlayerState } from "../types";

interface Props {
  position: number;
  space: BoardSpaceState | undefined;
  playersHere: PlayerState[];
  isCurrentPosition: boolean;
}

export default function BoardSpace({ position, space, playersHere, isCurrentPosition }: Props) {
  const def = BOARD_SPACES.find(s => s.position === position);
  const prop = PROPERTIES.find(p => p.position === position);
  const rail = RAILWAYS.find(r => r.position === position);
  const util = UTILITIES.find(u => u.position === position);
  const color = getColorForPosition(position);
  const colorClass = getSpaceColorClass(color);

  const isCorner = position === 0 || position === 10 || position === 20 || position === 30;
  const price = prop?.price ?? rail?.price ?? util?.price;

  return (
    <div className={`relative flex flex-col border border-gray-700/50 overflow-hidden
      ${isCurrentPosition ? "ring-2 ring-timo-gold ring-inset" : ""}
      ${space?.isMortgaged ? "opacity-50" : ""}`}
      style={{ fontSize: "7px", lineHeight: "1.1" }}>
      {/* Color band */}
      {color && <div className={`h-2 ${colorClass} shrink-0`} />}

      {/* Space name */}
      <div className="px-0.5 py-0.5 flex-1 flex flex-col justify-between bg-gray-900/80">
        <div className="font-bold text-center leading-tight truncate" style={{ fontSize: "6px" }}>
          {def?.name ?? ""}
        </div>
        {price !== undefined && (
          <div className="text-center text-gray-400" style={{ fontSize: "5px" }}>
            {formatMoney(price)}
          </div>
        )}
        {/* Buildings */}
        {space?.hasHotel && <div className="text-center text-red-400" style={{ fontSize: "6px" }}>H</div>}
        {space?.houses && space.houses > 0 && !space.hasHotel && (
          <div className="text-center text-green-400" style={{ fontSize: "5px" }}>
            {"h".repeat(space.houses)}
          </div>
        )}
        {/* Owner indicator */}
        {space?.ownerId && (
          <div className={`text-center rounded-sm mt-0.5 ${space.isMortgaged ? "bg-gray-600 line-through" : "bg-gray-700"}`} style={{ fontSize: "5px" }}>
            owned
          </div>
        )}
      </div>

      {/* Player tokens */}
      {playersHere.length > 0 && (
        <div className="flex flex-wrap justify-center gap-px px-0.5 pb-0.5">
          {playersHere.map(p => (
            <span key={p._id} className="inline-block" style={{ fontSize: "8px" }} title={p.name}>
              {getTokenEmoji(p.token)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
