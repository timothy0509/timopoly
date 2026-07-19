import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import TokenSelect from "./TokenSelect";
import { generateLobbyCode, getTokenEmoji } from "../lib/utils";

interface Props {
  onJoin: (gameId: Id<"games">, playerId: Id<"players">) => void;
}

export default function GameLobby({ onJoin }: Props) {
  const [mode, setMode] = useState<"menu" | "lobby">("menu");
  const [name, setName] = useState("");
  const [token, setToken] = useState("tophat");
  const [joinCode, setJoinCode] = useState("");
  const [gameId, setGameId] = useState<Id<"games"> | null>(null);
  const [playerId, setPlayerId] = useState<Id<"players"> | null>(null);
  const [error, setError] = useState("");

  const createMutation = useMutation(api.games.create);
  const joinMutation = useMutation(api.players.joinByCode);
  const startMutation = useMutation(api.games.startGame);
  const addBotMutation = useMutation(api.players.addBot);

  const game = useQuery(api.games.getById, gameId ? { id: gameId } : "skip");
  const players = useQuery(api.players.getByGame, gameId ? { gameId } : "skip");

  useEffect(() => {
    if (game?.status === "playing" && gameId && playerId) {
      onJoin(gameId, playerId);
    }
  }, [game?.status, gameId, playerId, onJoin]);

  const handleCreate = async () => {
    if (!name.trim()) { setError("Enter your name"); return; }
    try {
      const code = generateLobbyCode();
      const result = await createMutation({ code, hostName: name.trim(), hostToken: token });
      setGameId(result.gameId);
      setPlayerId(result.playerId);
      setMode("lobby");
      setError("");
    } catch (e: any) { setError(e.message); }
  };

  const handleJoin = async () => {
    if (!name.trim()) { setError("Enter your name"); return; }
    if (!joinCode.trim()) { setError("Enter game code"); return; }
    try {
      const result = await joinMutation({ code: joinCode.trim().toUpperCase(), name: name.trim(), token });
      setGameId(result.gameId);
      setPlayerId(result.playerId);
      setMode("lobby");
      setError("");
    } catch (e: any) { setError(e.message); }
  };

  const handleStart = async () => {
    if (!gameId || !playerId) return;
    try { await startMutation({ gameId, playerId }); } catch (e: any) { setError(e.message); }
  };

  const handleAddBot = async (difficulty: "easy" | "medium" | "hard") => {
    if (!gameId) return;
    const taken = new Set(players?.map(p => p.token) ?? []);
    const available = ["tophat","racecar","bulldog","cat","ship","boot","thimble","moneybag"].filter(t => !taken.has(t));
    if (available.length === 0) { setError("No tokens available"); return; }
    try {
      await addBotMutation({ gameId, name: `Bot-${difficulty[0].toUpperCase()}${difficulty.slice(1)}`, token: available[0], difficulty });
    } catch (e: any) { setError(e.message); }
  };

  const isHost = game && playerId && game.hostId === playerId;
  const canStart = isHost && players && players.length >= 2;

  if (mode === "menu") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-timo-dark">
        <div className="bg-timo-panel rounded-lg p-8 w-full max-w-md shadow-xl">
          <h1 className="text-4xl font-black text-center mb-8 text-timo-gold tracking-tight">TIMOPOLY</h1>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5 text-gray-300">Your Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-800 rounded-md border border-gray-600 focus:border-timo-gold focus:outline-none text-white"
              placeholder="Enter your name" maxLength={20} />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-300">Choose Token</label>
            <TokenSelect selected={token} onSelect={setToken} taken={players?.map(p => p.token) ?? []} />
          </div>
          {error && <div className="text-red-400 text-sm mb-4 bg-red-400/10 px-3 py-2 rounded">{error}</div>}
          <div className="space-y-3">
            <button onClick={handleCreate}
              className="w-full py-2.5 bg-timo-accent hover:brightness-110 rounded-md font-semibold transition-all">
              Create New Game
            </button>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-600" />
              <span className="text-gray-500 text-xs uppercase tracking-wide">or join</span>
              <div className="flex-1 h-px bg-gray-600" />
            </div>
            <div className="flex gap-2">
              <input type="text" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                className="flex-1 px-3 py-2.5 bg-gray-800 rounded-md border border-gray-600 focus:border-timo-gold focus:outline-none text-white uppercase tracking-widest text-center font-mono"
                placeholder="CODE" maxLength={6} />
              <button onClick={handleJoin}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-md font-semibold transition-all">
                Join
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-timo-dark">
      <div className="bg-timo-panel rounded-lg p-8 w-full max-w-lg shadow-xl">
        <h1 className="text-2xl font-bold text-center mb-1 text-timo-gold">Game Lobby</h1>
        <div className="text-center mb-6">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Share this code</div>
          <div className="text-4xl font-mono font-black tracking-[0.3em] text-white bg-gray-800 inline-block px-6 py-2 rounded-lg">
            {game?.code ?? "..."}
          </div>
        </div>
        <div className="mb-6">
          <div className="text-sm text-gray-400 mb-2">Players ({players?.length ?? 0}/8)</div>
          <div className="space-y-1.5">
            {players?.sort((a, b) => a.order - b.order).map(p => (
              <div key={p._id} className="flex items-center gap-3 bg-gray-800/60 rounded-md px-3 py-2">
                <span className="text-xl">{getTokenEmoji(p.token)}</span>
                <span className="flex-1 font-medium text-sm">{p.name}</span>
                {p._id === game?.hostId && <span className="text-[10px] bg-timo-gold/20 text-timo-gold px-1.5 py-0.5 rounded font-semibold">HOST</span>}
                {p.isBot && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded uppercase">{p.botDifficulty}</span>}
              </div>
            ))}
          </div>
        </div>
        {isHost && (
          <div className="mb-6">
            <div className="text-sm text-gray-400 mb-2">Add Bot</div>
            <div className="flex gap-2">
              {([["easy","bg-green-700 hover:bg-green-600"],["medium","bg-yellow-700 hover:bg-yellow-600"],["hard","bg-red-700 hover:bg-red-600"]] as const).map(([d,c]) => (
                <button key={d} onClick={() => handleAddBot(d)} className={`flex-1 py-1.5 ${c} rounded-md text-sm font-medium transition-colors capitalize`}>{d}</button>
              ))}
            </div>
          </div>
        )}
        {error && <div className="text-red-400 text-sm mb-4 bg-red-400/10 px-3 py-2 rounded">{error}</div>}
        {isHost ? (
          <button onClick={handleStart} disabled={!canStart}
            className="w-full py-3 bg-timo-accent hover:brightness-110 rounded-md font-bold text-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            Start Game
          </button>
        ) : (
          <div className="text-center text-gray-500 text-sm py-3">Waiting for host to start...</div>
        )}
      </div>
    </div>
  );
}
