/** Generate a random 6-char lobby code. */
export function generateLobbyCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/** Shuffle an array in place (Fisher-Yates). */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Format currency with Timo Dollar symbol. */
export function formatMoney(amount: number): string {
  return `\u20AE${amount.toLocaleString()}`;
}

/** Get token emoji by id. */
export function getTokenEmoji(tokenId: string): string {
  const map: Record<string, string> = {
    tophat: "\u{1F3A9}",
    racecar: "\u{1F3CE}",
    bulldog: "\u{1F436}",
    cat: "\u{1F431}",
    ship: "\u26F5",
    boot: "\u{1F462}",
    thimble: "\u{1FA81}",
    moneybag: "\u{1F4B0}",
  };
  return map[tokenId] ?? "?";
}

/** Delay helper for animations. */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
