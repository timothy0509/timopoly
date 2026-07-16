import { formatMoney } from "../lib/utils";
import type { PlayerState } from "../types";

interface Props {
  player: PlayerState;
  onPayFine: () => void;
  onUseCard: () => void;
  onTryDoubles: () => void;
  onClose: () => void;
}

export default function JailModal({ player, onPayFine, onUseCard, onTryDoubles, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-timo-panel rounded-xl shadow-2xl w-80" onClick={e => e.stopPropagation()}>
        <div className="p-5">
          <h3 className="text-lg font-bold mb-1 text-red-400">You're in TimoJail!</h3>
          <p className="text-sm text-gray-400 mb-4">Choose how to get out. ({player.jailTurns}/3 turns)</p>
          <div className="space-y-2">
            <button onClick={onPayFine} disabled={player.money < 50}
              className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors disabled:opacity-40">
              <div className="font-medium text-sm">Pay {formatMoney(50)} Fine</div>
              <div className="text-xs text-gray-500">Pay to get out immediately</div>
            </button>
            {player.getOutOfJailCards > 0 && (
              <button onClick={onUseCard}
                className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors">
                <div className="font-medium text-sm">Use Get Out of Jail Free Card</div>
                <div className="text-xs text-gray-500">{player.getOutOfJailCards} card(s) available</div>
              </button>
            )}
            <button onClick={onTryDoubles}
              className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors">
              <div className="font-medium text-sm">Roll for Doubles</div>
              <div className="text-xs text-gray-500">If you roll doubles, you escape for free</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
