import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { formatMoney } from "../lib/utils";
import { PROPERTIES, RAILWAYS, UTILITIES, COLOR_GROUPS, getColorForPosition, getSpaceColorClass } from "../lib/constants";
import { ownsColorGroup, canBuildHouse, canBuildHotel } from "../lib/gameLogic";
import type { PlayerState, BoardSpaceState } from "../types";

interface Props {
  gameId: Id<"games">;
  player: PlayerState;
  boardSpaces: BoardSpaceState[];
  onClose: () => void;
}

export default function BuildPanel({ gameId, player, boardSpaces, onClose }: Props) {
  const buildHouseMut = useMutation(api.properties.buildHouse);
  const buildHotelMut = useMutation(api.properties.buildHotel);
  const sellHouseMut = useMutation(api.properties.sellHouse);
  const mortgageMut = useMutation(api.properties.mortgageProperty);
  const unmortgageMut = useMutation(api.properties.unmortgageProperty);

  const myProps = player.properties.map(pos => {
    const prop = PROPERTIES.find(p => p.position === pos);
    const rail = RAILWAYS.find(r => r.position === pos);
    const util = UTILITIES.find(u => u.position === pos);
    const space = boardSpaces.find(s => s.position === pos);
    const item = prop ?? rail ?? util;
    return { pos, prop: item, space, isProperty: !!prop };
  }).filter(p => p.prop);

  const handleBuild = async (pos: number, space?: BoardSpaceState) => {
    try {
      if (space?.houses === 4) {
        await buildHotelMut({ gameId, playerId: player._id as Id<"players">, position: pos });
      } else {
        await buildHouseMut({ gameId, playerId: player._id as Id<"players">, position: pos });
      }
    } catch (e: any) { alert(e.message); }
  };

  const handleSell = async (pos: number) => {
    try { await sellHouseMut({ gameId, playerId: player._id as Id<"players">, position: pos }); }
    catch (e: any) { alert(e.message); }
  };

  const handleMortgage = async (pos: number) => {
    try { await mortgageMut({ gameId, playerId: player._id as Id<"players">, position: pos }); }
    catch (e: any) { alert(e.message); }
  };

  const handleUnmortgage = async (pos: number) => {
    try { await unmortgageMut({ gameId, playerId: player._id as Id<"players">, position: pos }); }
    catch (e: any) { alert(e.message); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-timo-panel rounded-xl shadow-2xl w-[440px] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Manage Properties</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">&times;</button>
          </div>
          <div className="space-y-2">
            {myProps.map(({ pos, prop, space, isProperty }) => {
              const color = getColorForPosition(pos);
              const colorClass = getSpaceColorClass(color);
              const hasFullSet = isProperty && prop ? ownsColorGroup(player, (prop as any).color, boardSpaces) : false;
              const canBuild = isProperty ? canBuildHouse(pos, boardSpaces, player) : false;
              const canHotel = isProperty ? canBuildHotel(pos, boardSpaces, player) : false;
              const propDef = isProperty ? PROPERTIES.find(p => p.position === pos) : undefined;
              return (
                <div key={pos} className={`flex items-center gap-2 bg-gray-800/60 rounded px-3 py-2 ${space?.isMortgaged ? "opacity-60" : ""}`}>
                  <div className={`w-3 h-3 rounded-sm ${colorClass} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{prop?.name}</div>
                    <div className="text-[10px] text-gray-500">
                      {space?.hasHotel ? "Hotel" : space?.houses ? `${space.houses} houses` : "No buildings"}
                      {space?.isMortgaged && " (Mortgaged)"}
                      {hasFullSet && " ★"}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {(canBuild || canHotel) && isProperty && (
                      <button onClick={() => handleBuild(pos, space)} className="px-2 py-1 bg-green-700 hover:bg-green-600 rounded text-[10px] font-semibold"
                        title={canHotel ? `Build Hotel (${formatMoney(propDef?.houseCost ?? 0)})` : `Build House (${formatMoney(propDef?.houseCost ?? 0)})`}>
                        Build
                      </button>
                    )}
                    {((space?.houses ?? 0) > 0 || space?.hasHotel) && isProperty && (
                      <button onClick={() => handleSell(pos)} className="px-2 py-1 bg-yellow-700 hover:bg-yellow-600 rounded text-[10px] font-semibold">Sell</button>
                    )}
                    {!space?.isMortgaged && (space?.houses ?? 0) === 0 && !space?.hasHotel && (
                      <button onClick={() => handleMortgage(pos)} className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-[10px] font-semibold">Mortgage</button>
                    )}
                    {space?.isMortgaged && (
                      <button onClick={() => handleUnmortgage(pos)} className="px-2 py-1 bg-blue-700 hover:bg-blue-600 rounded text-[10px] font-semibold">Unmortgage</button>
                    )}
                  </div>
                </div>
              );
            })}
            {myProps.length === 0 && <p className="text-gray-500 text-sm text-center py-4">No properties yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
