/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as bots from "../bots.js";
import type * as cards from "../cards.js";
import type * as games from "../games.js";
import type * as players from "../players.js";
import type * as properties from "../properties.js";
import type * as railway from "../railway.js";
import type * as trades from "../trades.js";
import type * as turns from "../turns.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  bots: typeof bots;
  cards: typeof cards;
  games: typeof games;
  players: typeof players;
  properties: typeof properties;
  railway: typeof railway;
  trades: typeof trades;
  turns: typeof turns;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
