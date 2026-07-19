import type { CardDef } from "../types";

interface Props {
  card: CardDef;
  result?: Record<string, unknown>;
  onClose: () => void;
}

export default function CardModal({ card, result, onClose }: Props) {
  const isChance = card.type === "chance";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className={`rounded-xl shadow-2xl w-80 overflow-hidden ${isChance ? "bg-orange-900" : "bg-blue-900"}`}
        onClick={e => e.stopPropagation()}>
        <div className={`px-5 py-3 ${isChance ? "bg-orange-800" : "bg-blue-800"}`}>
          <h3 className="text-sm font-bold uppercase tracking-wide text-white/80">
            {isChance ? "Timo Fortune" : "Timo Treasury"}
          </h3>
        </div>
        <div className="p-5">
          <p className="text-lg font-medium text-center mb-4">{card.text}</p>
          {result?.cost !== undefined && (
            <p className="text-center text-red-300 font-mono text-lg mb-2">-{String(result.cost)}</p>
          )}
          {result?.newPosition !== undefined && (
            <p className="text-center text-gray-400 text-sm">Moved to space {String(result.newPosition)}</p>
          )}
          <button onClick={onClose}
            className="w-full mt-4 py-2 bg-white/20 hover:bg-white/30 rounded-md text-sm font-medium transition-colors">
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
