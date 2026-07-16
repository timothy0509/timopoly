import { useState, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { PlayerState } from "../types";

interface Props {
  gameId: Id<"games">;
  playerId: Id<"players">;
  players: PlayerState[];
  chatLog: { playerId: string; message: string; timestamp: number }[];
}

export default function ChatPanel({ gameId, playerId, players, chatLog }: Props) {
  const [msg, setMsg] = useState("");
  const sendChat = useMutation(api.turns.sendChat);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog.length]);

  const handleSend = async () => {
    const text = msg.trim();
    if (!text) return;
    try {
      await sendChat({ gameId, playerId, message: text });
      setMsg("");
    } catch {}
  };

  const getName = (pid: string) => players.find(p => p._id === pid)?.name ?? "???";

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-1 text-xs mb-2">
        {chatLog.slice(-20).map((entry, i) => (
          <div key={i}>
            <span className="font-semibold text-gray-400">{getName(entry.playerId)}: </span>
            <span className="text-gray-300">{entry.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-1">
        <input type="text" value={msg} onChange={e => setMsg(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          className="flex-1 px-2 py-1.5 bg-gray-800 rounded border border-gray-700 focus:border-gray-500 focus:outline-none text-xs text-white"
          placeholder="Type message..." maxLength={200} />
        <button onClick={handleSend} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs font-medium transition-colors">Send</button>
      </div>
    </div>
  );
}
