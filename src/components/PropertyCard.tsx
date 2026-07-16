import { PROPERTIES, RAILWAYS, UTILITIES, getSpaceColorClass, getColorForPosition } from "../lib/constants";
import { formatMoney } from "../lib/utils";
import type { BoardSpaceState } from "../types";

interface Props {
  position: number;
  space: BoardSpaceState;
  onClose: () => void;
}

export default function PropertyCard({ position, space, onClose }: Props) {
  const prop = PROPERTIES.find(p => p.position === position);
  const rail = RAILWAYS.find(r => r.position === position);
  const util = UTILITIES.find(u => u.position === position);
  const color = getColorForPosition(position);
  const colorClass = getSpaceColorClass(color);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-timo-panel rounded-xl shadow-2xl w-72 overflow-hidden" onClick={e => e.stopPropagation()}>
        {color && <div className={`h-4 ${colorClass}`} />}
        <div className="p-5">
          <h3 className="text-lg font-bold mb-1">{space.name}</h3>
          {prop && (
            <div className="space-y-1 text-sm text-gray-300">
              <div className="flex justify-between"><span>Price</span><span className="font-mono">{formatMoney(prop.price)}</span></div>
              <hr className="border-gray-700" />
              <div className="flex justify-between"><span>Rent</span><span className="font-mono">{formatMoney(prop.rent.base)}</span></div>
              <div className="flex justify-between"><span>With Color Set</span><span className="font-mono">{formatMoney(prop.rent.colorSet)}</span></div>
              <div className="flex justify-between"><span>1 House</span><span className="font-mono">{formatMoney(prop.rent.oneHouse)}</span></div>
              <div className="flex justify-between"><span>2 Houses</span><span className="font-mono">{formatMoney(prop.rent.twoHouses)}</span></div>
              <div className="flex justify-between"><span>3 Houses</span><span className="font-mono">{formatMoney(prop.rent.threeHouses)}</span></div>
              <div className="flex justify-between"><span>4 Houses</span><span className="font-mono">{formatMoney(prop.rent.fourHouses)}</span></div>
              <div className="flex justify-between"><span>Hotel</span><span className="font-mono">{formatMoney(prop.rent.hotel)}</span></div>
              <hr className="border-gray-700" />
              <div className="flex justify-between"><span>House Cost</span><span className="font-mono">{formatMoney(prop.houseCost)}</span></div>
              <div className="flex justify-between"><span>Mortgage</span><span className="font-mono">{formatMoney(prop.mortgageValue)}</span></div>
            </div>
          )}
          {rail && (
            <div className="space-y-1 text-sm text-gray-300">
              <div className="flex justify-between"><span>Price</span><span className="font-mono">{formatMoney(rail.price)}</span></div>
              <div className="flex justify-between"><span>Mortgage</span><span className="font-mono">{formatMoney(rail.mortgageValue)}</span></div>
              <div className="text-xs text-gray-500 mt-2 italic">{rail.description}</div>
            </div>
          )}
          {util && (
            <div className="space-y-1 text-sm text-gray-300">
              <div className="flex justify-between"><span>Price</span><span className="font-mono">{formatMoney(util.price)}</span></div>
              <div className="flex justify-between"><span>Mortgage</span><span className="font-mono">{formatMoney(util.mortgageValue)}</span></div>
              <div className="text-xs text-gray-500 mt-2 italic">{util.description}</div>
            </div>
          )}
          <button onClick={onClose} className="w-full mt-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-medium transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
}
