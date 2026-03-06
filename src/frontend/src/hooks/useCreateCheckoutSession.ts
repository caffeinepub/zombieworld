import { useMutation } from "@tanstack/react-query";
import type { ShoppingItem } from "../backend.d";
import { useActor } from "./useActor";

export interface CheckoutSession {
  id: string;
  url: string;
}

export function useCreateCheckoutSession() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({
      items,
      successUrl,
      cancelUrl,
    }: {
      items: ShoppingItem[];
      successUrl: string;
      cancelUrl: string;
    }): Promise<CheckoutSession> => {
      if (!actor) throw new Error("No actor available");

      const result = await actor.createCheckoutSession(
        items,
        successUrl,
        cancelUrl,
      );
      const session = JSON.parse(result) as CheckoutSession;

      if (!session.url) {
        throw new Error("No checkout URL returned from Stripe");
      }

      return session;
    },
  });
}
