export type PersistedShipitQuote = {
  id: string;
  cart_id: string;
  quote_hash: string;
  quoted_at: Date;
  invalidated_at: Date | null;
};

export type ShipitQuoteStore<TQuote, TCreate> = {
  findByCartAndHash(cartId: string, quoteHash: string): Promise<TQuote[]>;
  create(input: TCreate): Promise<TQuote>;
};

export async function createOrReuseShipitQuote<
  TQuote extends PersistedShipitQuote,
  TCreate,
>(input: {
  cartId: string;
  quoteHash: string;
  maxAgeSeconds: number;
  create: TCreate;
  store: ShipitQuoteStore<TQuote, TCreate>;
  now?: Date;
}): Promise<{ quote: TQuote; reused: boolean }> {
  const now = input.now ?? new Date();
  const candidates = await input.store.findByCartAndHash(
    input.cartId,
    input.quoteHash,
  );
  const quote = candidates.find(
    (candidate) =>
      candidate.cart_id === input.cartId &&
      candidate.quote_hash === input.quoteHash &&
      candidate.invalidated_at === null &&
      now.getTime() - candidate.quoted_at.getTime() <=
        input.maxAgeSeconds * 1_000,
  );
  if (quote) return { quote, reused: true };
  return { quote: await input.store.create(input.create), reused: false };
}
