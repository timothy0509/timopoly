import type { BoardSpaceState, PlayerState, ColorGroup, RentSchedule } from "../types";
import {
  PROPERTIES, RAILWAYS, UTILITIES, RAILWAY_POSITIONS, RAILWAY_RENT,
  COLOR_GROUPS, GO_SALARY, JAIL_FINE,
} from "./constants";

/** Calculate rent for a property at the given board space state. */
export function calculatePropertyRent(
  space: BoardSpaceState,
  _allSpaces: BoardSpaceState[],
): number {
  const prop = PROPERTIES.find(p => p.position === space.position);
  if (!prop) return 0;
  if (space.isMortgaged) return 0;
  if (space.hasHotel) return prop.rent.hotel;
  const houses = space.houses ?? 0;
  const keys: (keyof RentSchedule)[] = [
    "base", "oneHouse", "twoHouses", "threeHouses", "fourHouses",
  ];
  return prop.rent[keys[houses]] ?? prop.rent.base;
}

/** Check if player owns the full color group for a property. */
export function ownsColorGroup(
  player: PlayerState,
  color: ColorGroup,
  allSpaces: BoardSpaceState[],
): boolean {
  const groupPositions = PROPERTIES.filter(p => p.color === color).map(p => p.position);
  return groupPositions.every(pos => {
    const s = allSpaces.find(sp => sp.position === pos);
    return s?.ownerId === player._id;
  });
}

/** Count railways owned by a player. */
export function countRailways(player: PlayerState, allSpaces: BoardSpaceState[]): number {
  return RAILWAY_POSITIONS.filter(pos => {
    const s = allSpaces.find(sp => sp.position === pos);
    return s?.ownerId === player._id && !s.isMortgaged;
  }).length;
}

/** Calculate railway rent based on number owned. */
export function calculateRailwayRent(ownedCount: number): number {
  return RAILWAY_RENT[Math.min(ownedCount, 4) - 1] ?? 25;
}

/** Count utilities owned by a player. */
export function countUtilities(player: PlayerState, allSpaces: BoardSpaceState[]): number {
  const utilPositions = UTILITIES.map(u => u.position);
  return utilPositions.filter(pos => {
    const s = allSpaces.find(sp => sp.position === pos);
    return s?.ownerId === player._id && !s.isMortgaged;
  }).length;
}

/** Calculate utility rent (multiplier × dice roll). */
export function calculateUtilityRent(ownedCount: number, diceRoll: number): number {
  const multiplier = ownedCount >= 2 ? 10 : 4;
  return multiplier * diceRoll;
}

/** Move a player, returning new position and whether they passed GO. */
export function movePlayer(currentPos: number, steps: number): { position: number; passedGo: boolean } {
  const newPos = (currentPos + steps) % 40;
  const passedGo = newPos < currentPos || (currentPos + steps >= 40);
  return { position: newPos, passedGo };
}

/** Get the nearest railway to a position (forward). */
export function nearestRailwayPosition(pos: number): number {
  for (const rPos of RAILWAY_POSITIONS) {
    if (rPos > pos) return rPos;
  }
  return RAILWAY_POSITIONS[0]; // wrap around
}

/** Get the nearest utility to a position (forward). */
export function nearestUtilityPosition(pos: number): number {
  const utilPositions = UTILITIES.map(u => u.position).sort((a, b) => a - b);
  for (const uPos of utilPositions) {
    if (uPos > pos) return uPos;
  }
  return utilPositions[0];
}

/** Even-building check: can a house be placed at this position? */
export function canBuildHouse(
  position: number,
  allSpaces: BoardSpaceState[],
  player: PlayerState,
): boolean {
  const prop = PROPERTIES.find(p => p.position === position);
  if (!prop) return false;
  const space = allSpaces.find(s => s.position === position);
  if (!space || space.ownerId !== player._id) return false;
  if (space.isMortgaged) return false;
  if (space.hasHotel) return false;
  if (!ownsColorGroup(player, prop.color, allSpaces)) return false;
  const currentHouses = space.houses ?? 0;
  if (currentHouses >= 4) return false; // need hotel upgrade separately
  // Even building: check min houses in group
  const groupPositions = PROPERTIES.filter(p => p.color === prop.color).map(p => p.position);
  const groupSpaces = allSpaces.filter(s => groupPositions.includes(s.position));
  const minHouses = Math.min(...groupSpaces.map(s => s.houses ?? 0));
  return currentHouses <= minHouses;
}

/** Can upgrade 4 houses to hotel? */
export function canBuildHotel(
  position: number,
  allSpaces: BoardSpaceState[],
  player: PlayerState,
): boolean {
  const prop = PROPERTIES.find(p => p.position === position);
  if (!prop) return false;
  const space = allSpaces.find(s => s.position === position);
  if (!space || space.ownerId !== player._id) return false;
  if (space.isMortgaged || space.hasHotel) return false;
  if (!ownsColorGroup(player, prop.color, allSpaces)) return false;
  if ((space.houses ?? 0) !== 4) return false;
  // Even building: all in group must have 4 houses
  const groupPositions = PROPERTIES.filter(p => p.color === prop.color).map(p => p.position);
  const groupSpaces = allSpaces.filter(s => groupPositions.includes(s.position));
  return groupSpaces.every(s => (s.houses ?? 0) >= 4);
}

/** Count total buildings a player owns (for card repairs). */
export function countBuildings(player: PlayerState, allSpaces: BoardSpaceState[]): {
  houses: number;
  hotels: number;
} {
  let houses = 0;
  let hotels = 0;
  for (const pos of player.properties) {
    const space = allSpaces.find(s => s.position === pos);
    if (!space) continue;
    if (space.hasHotel) hotels++;
    else houses += space.houses ?? 0;
  }
  return { houses, hotels };
}
