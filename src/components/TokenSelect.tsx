import { TOKENS } from "../types";
import { getTokenEmoji } from "../lib/utils";

interface Props {
  selected: string;
  onSelect: (token: string) => void;
  taken: string[];
}

export default function TokenSelect({ selected, onSelect, taken }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {TOKENS.map(t => {
        const isTaken = taken.includes(t.id);
        const isSelected = selected === t.id;
        return (
          <button key={t.id} onClick={() => !isTaken && onSelect(t.id)} disabled={isTaken}
            title={t.name}
            className={`p-3 rounded-lg text-2xl transition-all border-2
              ${isSelected ? "border-timo-gold bg-timo-gold/20 shadow-lg shadow-timo-gold/20" : "border-transparent bg-gray-800 hover:bg-gray-700"}
              ${isTaken ? "opacity-20 cursor-not-allowed" : "cursor-pointer"}`}>
            {getTokenEmoji(t.id)}
          </button>
        );
      })}
    </div>
  );
}
