import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { RAILWAYS, RAILWAY_POSITIONS } from "../lib/constants";
import type { BoardSpaceState, PlayerState } from "../types";

interface Props {
  gameId: Id<"games">;
  player: PlayerState;
  boardSpaces: BoardSpaceState[];
  onClose: () => void;
}

export default function RailwayTravel({ gameId, player, boardSpaces, onClose }: Props) {
  const travel = useMutation(api.railway.railwayTravel);

  const myRails = RAILWAY_POSITIONS.filter(pos => {
    const s = boardSpaces.find(sp => sp.position === pos);
    return s?.ownerId === player._id;
  });
  const destinations = myRails.filter(pos => pos !== player.position);

  const handleTravel = async (dest: number) => {
    try {
      await travel({ gameId, playerId: player._id as Id<"players">, destination: dest });
      onClose();
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-timo-panel rounded-xl shadow-2xl w-80" onClick={e => e.stopPropagation()}>
        <div className="p-5">
          <h3 className="text-lg font-bold mb-1">Railway Travel</h3>
          <p className="text-sm text-gray-400 mb-4">Choose a destination railway you own.</p>
          {destinations.length === 0 && <p className="text-gray-500 text-sm">No other railways to travel to.</p>}
          <div className="space-y-2">
            {destinations.map(pos => {
              const rail = RAILWAYS.find(r => r.position === pos);
              return (
                <button key={pos} onClick={() => handleTravel(pos)}
                  className="w-full text-left px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors">
                  <div className="font-medium text-sm">{rail?.name}</div>
                  <div className="text-xs text-gray-500">{rail?.description}</div>
                </button>
              );
            })}
          </div>
          <button onClick={onClose} className="w-full mt-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-medium transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
}
