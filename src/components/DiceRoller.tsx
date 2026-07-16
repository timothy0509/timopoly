import { useState } from "react";

const DIE_FACES = ["", "\u2680", "\u2681", "\u2682", "\u2683", "\u2684", "\u2685"];

interface Props {
  die1?: number;
  die2?: number;
  onRoll: () => void;
  canRoll: boolean;
  isRolling: boolean;
}

export default function DiceRoller({ die1, die2, onRoll, canRoll, isRolling }: Props) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex gap-2">
        <div className={`w-12 h-12 bg-white text-gray-900 rounded-lg flex items-center justify-center text-2xl font-bold shadow-md
          ${isRolling ? "animate-bounce" : ""}`}>
          {die1 ? DIE_FACES[die1] : "-"}
        </div>
        <div className={`w-12 h-12 bg-white text-gray-900 rounded-lg flex items-center justify-center text-2xl font-bold shadow-md
          ${isRolling ? "animate-bounce" : ""}`}>
          {die2 ? DIE_FACES[die2] : "-"}
        </div>
      </div>
      {die1 && die2 && (
        <div className="text-sm text-gray-400">
          Total: <span className="text-white font-bold text-lg">{die1 + die2}</span>
          {die1 === die2 && <span className="ml-2 text-timo-gold font-semibold">Doubles!</span>}
        </div>
      )}
      <button onClick={onRoll} disabled={!canRoll || isRolling}
        className={`px-5 py-2.5 rounded-md font-bold text-sm transition-all
          ${canRoll && !isRolling
            ? "bg-timo-accent hover:brightness-110 shadow-lg shadow-timo-accent/30"
            : "bg-gray-700 text-gray-500 cursor-not-allowed"}`}>
        {isRolling ? "Rolling..." : "Roll Dice"}
      </button>
    </div>
  );
}
