import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function useRollDice() {
  return useMutation(api.turns.rollDice);
}

export function useResolveSpace() {
  return useMutation(api.turns.resolveSpace);
}

export function useBuyProperty() {
  return useMutation(api.turns.buyProperty);
}

export function useEndTurn() {
  return useMutation(api.turns.endTurn);
}

export function usePayJailFine() {
  return useMutation(api.turns.payJailFine);
}

export function useJailCard() {
  return useMutation(api.turns.useJailCard);
}

export function useTryJailDoubles() {
  return useMutation(api.turns.tryJailDoubles);
}

export function useSendChat() {
  return useMutation(api.turns.sendChat);
}

export function useStartAuction() {
  return useMutation(api.turns.startAuction);
}

export function usePlaceBid() {
  return useMutation(api.turns.placeBid);
}

export function usePassAuction() {
  return useMutation(api.turns.passAuction);
}

export function useClaimAuctionWin() {
  return useMutation(api.turns.claimAuctionWin);
}
