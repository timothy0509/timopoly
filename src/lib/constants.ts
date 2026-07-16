import type { PropertyDef, RailwayDef, UtilityDef, TaxDef, BoardSpaceDef, CardDef, ColorGroup } from "../types";

export const STARTING_MONEY = 1500;
export const GO_SALARY = 200;
export const JAIL_FINE = 50;
export const MAX_HOUSES = 32;
export const MAX_HOTELS = 12;
export const INCOME_TAX = 200;
export const LUXURY_TAX = 100;

export const COLOR_GROUPS: Record<ColorGroup, { houses: string[]; houseCost: number }>= {
  brown: { houses: ["Timo Lane", "Timo Court"], houseCost: 50 },
  lightblue: { houses: ["Timo Street", "Timo Avenue", "Timo Boulevard"], houseCost: 50 },
  pink: { houses: ["Timo Place", "Timo Drive", "Timo Way"], houseCost: 100 },
  orange: { houses: ["Timo Crescent", "Timo Terrace", "Timo Parade"], houseCost: 100 },
  red: { houses: ["Timo Plaza", "Timo Square", "Timo Central"], houseCost: 150 },
  yellow: { houses: ["Timo Promenade", "Timo Esplanade", "Timo Gardens"], houseCost: 150 },
  green: { houses: ["Timo Marina", "Timo Baywalk", "Timo Pier"], houseCost: 200 },
  darkblue: { houses: ["Timo Summit", "Timo Pinnacle"], houseCost: 200 },
};

export const RAILWAY_POSITIONS = [5, 15, 25, 35];
export const RAILWAY_RENT = [25, 50, 100, 200];

export const PROPERTIES: PropertyDef[] = [
  { position: 1, type: "property", name: "Timo Lane", color: "brown", price: 60, rent: { base: 2, colorSet: 4, oneHouse: 10, twoHouses: 30, threeHouses: 90, fourHouses: 160, hotel: 250 }, houseCost: 50, mortgageValue: 30 },
  { position: 3, type: "property", name: "Timo Court", color: "brown", price: 60, rent: { base: 4, colorSet: 8, oneHouse: 20, twoHouses: 60, threeHouses: 180, fourHouses: 320, hotel: 450 }, houseCost: 50, mortgageValue: 30 },
  { position: 6, type: "property", name: "Timo Street", color: "lightblue", price: 100, rent: { base: 6, colorSet: 12, oneHouse: 30, twoHouses: 90, threeHouses: 270, fourHouses: 400, hotel: 550 }, houseCost: 50, mortgageValue: 50 },
  { position: 8, type: "property", name: "Timo Avenue", color: "lightblue", price: 100, rent: { base: 6, colorSet: 12, oneHouse: 30, twoHouses: 90, threeHouses: 270, fourHouses: 400, hotel: 550 }, houseCost: 50, mortgageValue: 50 },
  { position: 9, type: "property", name: "Timo Boulevard", color: "lightblue", price: 120, rent: { base: 8, colorSet: 16, oneHouse: 40, twoHouses: 100, threeHouses: 300, fourHouses: 450, hotel: 600 }, houseCost: 50, mortgageValue: 60 },
  { position: 11, type: "property", name: "Timo Place", color: "pink", price: 140, rent: { base: 10, colorSet: 20, oneHouse: 50, twoHouses: 150, threeHouses: 450, fourHouses: 625, hotel: 750 }, houseCost: 100, mortgageValue: 70 },
  { position: 13, type: "property", name: "Timo Drive", color: "pink", price: 140, rent: { base: 10, colorSet: 20, oneHouse: 50, twoHouses: 150, threeHouses: 450, fourHouses: 625, hotel: 750 }, houseCost: 100, mortgageValue: 70 },
  { position: 14, type: "property", name: "Timo Way", color: "pink", price: 160, rent: { base: 12, colorSet: 24, oneHouse: 60, twoHouses: 180, threeHouses: 500, fourHouses: 700, hotel: 900 }, houseCost: 100, mortgageValue: 80 },
  { position: 16, type: "property", name: "Timo Crescent", color: "orange", price: 180, rent: { base: 14, colorSet: 28, oneHouse: 70, twoHouses: 200, threeHouses: 550, fourHouses: 750, hotel: 950 }, houseCost: 100, mortgageValue: 90 },
  { position: 18, type: "property", name: "Timo Terrace", color: "orange", price: 180, rent: { base: 14, colorSet: 28, oneHouse: 70, twoHouses: 200, threeHouses: 550, fourHouses: 750, hotel: 950 }, houseCost: 100, mortgageValue: 90 },
  { position: 19, type: "property", name: "Timo Parade", color: "orange", price: 200, rent: { base: 16, colorSet: 32, oneHouse: 80, twoHouses: 220, threeHouses: 600, fourHouses: 800, hotel: 1000 }, houseCost: 100, mortgageValue: 100 },
  { position: 21, type: "property", name: "Timo Plaza", color: "red", price: 220, rent: { base: 18, colorSet: 36, oneHouse: 90, twoHouses: 250, threeHouses: 700, fourHouses: 875, hotel: 1050 }, houseCost: 150, mortgageValue: 110 },
  { position: 23, type: "property", name: "Timo Square", color: "red", price: 220, rent: { base: 18, colorSet: 36, oneHouse: 90, twoHouses: 250, threeHouses: 700, fourHouses: 875, hotel: 1050 }, houseCost: 150, mortgageValue: 110 },
  { position: 24, type: "property", name: "Timo Central", color: "red", price: 240, rent: { base: 20, colorSet: 40, oneHouse: 100, twoHouses: 300, threeHouses: 750, fourHouses: 925, hotel: 1100 }, houseCost: 150, mortgageValue: 120 },
  { position: 26, type: "property", name: "Timo Promenade", color: "yellow", price: 260, rent: { base: 22, colorSet: 44, oneHouse: 110, twoHouses: 330, threeHouses: 800, fourHouses: 975, hotel: 1150 }, houseCost: 150, mortgageValue: 130 },
  { position: 27, type: "property", name: "Timo Esplanade", color: "yellow", price: 260, rent: { base: 22, colorSet: 44, oneHouse: 110, twoHouses: 330, threeHouses: 800, fourHouses: 975, hotel: 1150 }, houseCost: 150, mortgageValue: 130 },
  { position: 29, type: "property", name: "Timo Gardens", color: "yellow", price: 280, rent: { base: 24, colorSet: 48, oneHouse: 120, twoHouses: 360, threeHouses: 850, fourHouses: 1025, hotel: 1200 }, houseCost: 150, mortgageValue: 140 },
  { position: 31, type: "property", name: "Timo Marina", color: "green", price: 300, rent: { base: 26, colorSet: 52, oneHouse: 130, twoHouses: 390, threeHouses: 900, fourHouses: 1100, hotel: 1275 }, houseCost: 200, mortgageValue: 150 },
  { position: 32, type: "property", name: "Timo Baywalk", color: "green", price: 300, rent: { base: 26, colorSet: 52, oneHouse: 130, twoHouses: 390, threeHouses: 900, fourHouses: 1100, hotel: 1275 }, houseCost: 200, mortgageValue: 150 },
  { position: 34, type: "property", name: "Timo Pier", color: "green", price: 320, rent: { base: 28, colorSet: 56, oneHouse: 150, twoHouses: 450, threeHouses: 1000, fourHouses: 1200, hotel: 1400 }, houseCost: 200, mortgageValue: 160 },
  { position: 37, type: "property", name: "Timo Summit", color: "darkblue", price: 350, rent: { base: 35, colorSet: 70, oneHouse: 175, twoHouses: 500, threeHouses: 1100, fourHouses: 1300, hotel: 1500 }, houseCost: 200, mortgageValue: 175 },
  { position: 39, type: "property", name: "Timo Pinnacle", color: "darkblue", price: 400, rent: { base: 50, colorSet: 100, oneHouse: 200, twoHouses: 600, threeHouses: 1400, fourHouses: 1700, hotel: 2000 }, houseCost: 200, mortgageValue: 200 },
];

export const RAILWAYS: RailwayDef[] = [
  { position: 5, type: "railway", name: "TimoLine Metro", description: "Oldest subway in Timotopia", price: 200, mortgageValue: 100 },
  { position: 15, type: "railway", name: "TimoRail", description: "Overground railway", price: 200, mortgageValue: 100 },
  { position: 25, type: "railway", name: "TimoExpress", description: "High-speed express line", price: 200, mortgageValue: 100 },
  { position: 35, type: "railway", name: "TimoSkyway", description: "Futuristic monorail", price: 200, mortgageValue: 100 },
];

export const UTILITIES: UtilityDef[] = [
  { position: 12, type: "utility", name: "TimoPower", description: "Power grid operator", price: 150, mortgageValue: 75 },
  { position: 28, type: "utility", name: "TimoWater", description: "Municipal water supply", price: 150, mortgageValue: 75 },
];

export const TAXES: TaxDef[] = [
  { position: 4, type: "tax", name: "Timo Income Tax", amount: INCOME_TAX },
  { position: 38, type: "tax", name: "Timo Luxury Tax", amount: LUXURY_TAX },
];

export const BOARD_SPACES: BoardSpaceDef[] = [
  { position: 0, type: "corner", name: "TimoStart" },
  { position: 1, type: "property", name: "Timo Lane" },
  { position: 2, type: "treasury", name: "Timo Treasury Draw" },
  { position: 3, type: "property", name: "Timo Court" },
  { position: 4, type: "tax", name: "Timo Income Tax" },
  { position: 5, type: "railway", name: "TimoLine Metro" },
  { position: 6, type: "property", name: "Timo Street" },
  { position: 7, type: "chance", name: "Timo Fortune Draw" },
  { position: 8, type: "property", name: "Timo Avenue" },
  { position: 9, type: "property", name: "Timo Boulevard" },
  { position: 10, type: "corner", name: "TimoJail" },
  { position: 11, type: "property", name: "Timo Place" },
  { position: 12, type: "utility", name: "TimoPower" },
  { position: 13, type: "property", name: "Timo Drive" },
  { position: 14, type: "property", name: "Timo Way" },
  { position: 15, type: "railway", name: "TimoRail" },
  { position: 16, type: "property", name: "Timo Crescent" },
  { position: 17, type: "treasury", name: "Timo Treasury Draw" },
  { position: 18, type: "property", name: "Timo Terrace" },
  { position: 19, type: "property", name: "Timo Parade" },
  { position: 20, type: "corner", name: "Timo Rest Stop" },
  { position: 21, type: "property", name: "Timo Plaza" },
  { position: 22, type: "chance", name: "Timo Fortune Draw" },
  { position: 23, type: "property", name: "Timo Square" },
  { position: 24, type: "property", name: "Timo Central" },
  { position: 25, type: "railway", name: "TimoExpress" },
  { position: 26, type: "property", name: "Timo Promenade" },
  { position: 27, type: "property", name: "Timo Esplanade" },
  { position: 28, type: "utility", name: "TimoWater" },
  { position: 29, type: "property", name: "Timo Gardens" },
  { position: 30, type: "corner", name: "Go to TimoJail" },
  { position: 31, type: "property", name: "Timo Marina" },
  { position: 32, type: "property", name: "Timo Baywalk" },
  { position: 33, type: "treasury", name: "Timo Treasury Draw" },
  { position: 34, type: "property", name: "Timo Pier" },
  { position: 35, type: "railway", name: "TimoSkyway" },
  { position: 36, type: "chance", name: "Timo Fortune Draw" },
  { position: 37, type: "property", name: "Timo Summit" },
  { position: 38, type: "tax", name: "Timo Luxury Tax" },
  { position: 39, type: "property", name: "Timo Pinnacle" },
];

export const CHANCE_CARDS: CardDef[] = [
  { type: "chance", index: 0, text: "Advance to Timo Pinnacle.", effectType: "move_to", position: 39 },
  { type: "chance", index: 1, text: "Advance to TimoStart. Collect $200.", effectType: "move_to", position: 0 },
  { type: "chance", index: 2, text: "Advance to Timo Central. If you pass TimoStart, collect $200.", effectType: "move_to", position: 24 },
  { type: "chance", index: 3, text: "Advance to Timo Place. If you pass TimoStart, collect $200.", effectType: "move_to", position: 11 },
  { type: "chance", index: 4, text: "Advance to nearest Railway. Pay owner 2x rent.", effectType: "nearest_railway" },
  { type: "chance", index: 5, text: "Advance to nearest Railway. Pay owner 2x rent.", effectType: "nearest_railway" },
  { type: "chance", index: 6, text: "Advance to nearest Utility. Pay owner 10x dice.", effectType: "nearest_utility" },
  { type: "chance", index: 7, text: "Timo Bank dividend. Collect $50.", effectType: "collect", value: 50 },
  { type: "chance", index: 8, text: "Get Out of TimoJail Free.", effectType: "get_out_of_jail" },
  { type: "chance", index: 9, text: "Go Back 3 Spaces.", effectType: "go_back", value: 3 },
  { type: "chance", index: 10, text: "Go to TimoJail.", effectType: "go_to_jail" },
  { type: "chance", index: 11, text: "General repairs: Pay $25 per house, $100 per hotel.", effectType: "repairs", value: 25 },
  { type: "chance", index: 12, text: "Speeding fine. Pay $15.", effectType: "pay", value: 15 },
  { type: "chance", index: 13, text: "Take a trip to TimoLine Metro.", effectType: "move_to", position: 5 },
  { type: "chance", index: 14, text: "Elected Chairman. Pay each player $50.", effectType: "pay_each", value: 50 },
  { type: "chance", index: 15, text: "Building loan matures. Collect $150.", effectType: "collect", value: 150 },
];

export const TREASURY_CARDS: CardDef[] = [
  { type: "treasury", index: 0, text: "Advance to TimoStart. Collect $200.", effectType: "move_to", position: 0 },
  { type: "treasury", index: 1, text: "Bank error in your favor. Collect $200.", effectType: "collect", value: 200 },
  { type: "treasury", index: 2, text: "Doctor's fees. Pay $50.", effectType: "pay", value: 50 },
  { type: "treasury", index: 3, text: "Sale of stock. Collect $50.", effectType: "collect", value: 50 },
  { type: "treasury", index: 4, text: "Get Out of TimoJail Free.", effectType: "get_out_of_jail" },
  { type: "treasury", index: 5, text: "Go to TimoJail.", effectType: "go_to_jail" },
  { type: "treasury", index: 6, text: "Grand Opera Night. Collect $50 from every player.", effectType: "collect_each", value: 50 },
  { type: "treasury", index: 7, text: "Holiday fund matures. Collect $100.", effectType: "collect", value: 100 },
  { type: "treasury", index: 8, text: "Income tax refund. Collect $20.", effectType: "collect", value: 20 },
  { type: "treasury", index: 9, text: "It is your birthday. Collect $10 from each player.", effectType: "collect_each", value: 10 },
  { type: "treasury", index: 10, text: "Life insurance matures. Collect $100.", effectType: "collect", value: 100 },
  { type: "treasury", index: 11, text: "Hospital fees. Pay $100.", effectType: "pay", value: 100 },
  { type: "treasury", index: 12, text: "School fees. Pay $50.", effectType: "pay", value: 50 },
  { type: "treasury", index: 13, text: "Consultancy fee. Collect $25.", effectType: "collect", value: 25 },
  { type: "treasury", index: 14, text: "Street repairs: Pay $40 per house, $115 per hotel.", effectType: "repairs", value: 40 },
  { type: "treasury", index: 15, text: "Beauty contest prize. Collect $10.", effectType: "collect", value: 10 },
];

export const TOKEN_EMOJI: Record<string, string> = {
  tophat: "\u{1F3A9}",
  racecar: "\u{1F3CE}",
  bulldog: "\u{1F436}",
  cat: "\u{1F431}",
  ship: "\u26F5",
  boot: "\u{1F462}",
  thimble: "\u{1FA81}",
  moneybag: "\u{1F4B0}",
};

export function getPropertyAtPosition(pos: number): PropertyDef | undefined {
  return PROPERTIES.find(p => p.position === pos);
}

export function getRailwayAtPosition(pos: number): RailwayDef | undefined {
  return RAILWAYS.find(r => r.position === pos);
}

export function getUtilityAtPosition(pos: number): UtilityDef | undefined {
  return UTILITIES.find(u => u.position === pos);
}

export function getColorForPosition(pos: number): string | undefined {
  const prop = PROPERTIES.find(p => p.position === pos);
  return prop?.color;
}

export function getSpaceColorClass(color?: string): string {
  const map: Record<string, string> = {
    brown: "bg-amber-800",
    lightblue: "bg-sky-300",
    pink: "bg-pink-400",
    orange: "bg-orange-400",
    red: "bg-red-500",
    yellow: "bg-yellow-400",
    green: "bg-green-600",
    darkblue: "bg-blue-900",
  };
  return color ? map[color] || "bg-gray-600" : "bg-gray-600";
}
