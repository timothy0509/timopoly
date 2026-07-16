export type ColorGroup = "brown" | "lightblue" | "pink" | "orange" | "red" | "yellow" | "green" | "darkblue";

export type SpaceType = "property" | "railway" | "utility" | "tax" | "chance" | "treasury" | "corner";

export type CornerType = "go" | "jail" | "free_parking" | "go_to_jail";

export type TurnPhase = "pre_roll" | "rolling" | "post_roll" | "resolving" | "trading" | "building" | "end_turn";

export type GameStatus = "lobby" | "playing" | "finished";

export type BotDifficulty = "easy" | "medium" | "hard";

export interface RentSchedule {
  base: number;
  colorSet: number;
  oneHouse: number;
  twoHouses: number;
  threeHouses: number;
  fourHouses: number;
  hotel: number;
}

export interface PropertyDef {
  position: number;
  type: "property";
  name: string;
  color: ColorGroup;
  price: number;
  rent: RentSchedule;
  houseCost: number;
  mortgageValue: number;
}

export interface RailwayDef {
  position: number;
  type: "railway";
  name: string;
  description: string;
  price: number;
  mortgageValue: number;
}

export interface UtilityDef {
  position: number;
  type: "utility";
  name: string;
  description: string;
  price: number;
  mortgageValue: number;
}

export interface TaxDef {
  position: number;
  type: "tax";
  name: string;
  amount: number;
}

export interface CardDef {
  type: "chance" | "treasury";
  index: number;
  text: string;
  effectType: string;
  value?: number;
  position?: number;
}

export interface BoardSpaceDef {
  position: number;
  type: SpaceType;
  name: string;
}

export interface PlayerState {
  _id: string;
  gameId: string;
  name: string;
  token: string;
  isBot: boolean;
  botDifficulty?: BotDifficulty;
  ready: boolean;
  order: number;
  money: number;
  position: number;
  properties: number[];
  getOutOfJailCards: number;
  isInJail: boolean;
  jailTurns: number;
  isBankrupt: boolean;
  hasUsedRailwayTravel: boolean;
}

export interface BoardSpaceState {
  position: number;
  type: string;
  name: string;
  ownerId?: string;
  houses?: number;
  hasHotel?: boolean;
  isMortgaged?: boolean;
}

export interface GameState {
  _id: string;
  code: string;
  status: GameStatus;
  hostId: string;
  currentPlayerIndex: number;
  turnPhase: TurnPhase;
  boardSpaces: BoardSpaceState[];
  chanceDeck: number[];
  treasuryDeck: number[];
  chanceIndex: number;
  treasuryIndex: number;
  houseSupply: number;
  hotelSupply: number;
  lastDice?: { die1: number; die2: number; doubles: boolean };
  doublesCount: number;
  currentAuction?: {
    propertyPosition: number;
    highestBid: number;
    highestBidderId?: string;
    bidderIds: string[];
    expiresAt: number;
  };
  chatLog: { playerId: string; message: string; timestamp: number }[];
  createdAt: number;
}

export interface TradeState {
  _id: string;
  gameId: string;
  proposerId: string;
  responderId: string;
  offerProperties: number[];
  offerCash: number;
  offerCards: number;
  requestProperties: number[];
  requestCash: number;
  requestCards: number;
  status: "pending" | "accepted" | "rejected";
}

export const TOKENS = [
  { id: "tophat", name: "Top Hat", emoji: "\u{1F3A9}" },
  { id: "racecar", name: "Race Car", emoji: "\u{1F3CE}" },
  { id: "bulldog", name: "Bulldog", emoji: "\u{1F436}" },
  { id: "cat", name: "Cat", emoji: "\u{1F431}" },
  { id: "ship", name: "Sailing Ship", emoji: "\u26F5" },
  { id: "boot", name: "Boot", emoji: "\u{1F462}" },
  { id: "thimble", name: "Thimble", emoji: "\u{1FA81}" },
  { id: "moneybag", name: "Money Bag", emoji: "\u{1F4B0}" },
] as const;

export type TokenId = (typeof TOKENS)[number]["id"];
