import { completeWebpayCartIdempotently } from "../webpay-complete-cart";

describe("completeWebpayCartIdempotently", () => {
  it("reuses an existing order linked to the cart without completing again", async () => {
    const graph = jest
      .fn()
      .mockResolvedValueOnce({
        data: [{ order_id: "order_existing" }],
      })
      .mockResolvedValueOnce({
        data: [{ id: "order_existing", total: 15990 }],
      });

    const completeCart = jest.fn();

    await expect(
      completeWebpayCartIdempotently({
        cartId: "cart_1",
        query: { graph },
        completeCart,
      }),
    ).resolves.toEqual({
      id: "order_existing",
      total: 15990,
    });

    expect(completeCart).not.toHaveBeenCalled();
  });

  it("completes the cart and loads the created order total", async () => {
    const graph = jest
      .fn()
      .mockResolvedValueOnce({
        data: [],
      })
      .mockResolvedValueOnce({
        data: [{ id: "order_1", total: 15990 }],
      });

    const completeCart = jest
      .fn()
      .mockResolvedValue({ id: "order_1" });

    await expect(
      completeWebpayCartIdempotently({
        cartId: "cart_1",
        query: { graph },
        completeCart,
      }),
    ).resolves.toEqual({
      id: "order_1",
      total: 15990,
    });

    expect(completeCart).toHaveBeenCalledTimes(1);
    expect(completeCart).toHaveBeenCalledWith("cart_1");
  });

  it("reconciles an order created before completeCart throws", async () => {
    const graph = jest
      .fn()
      .mockResolvedValueOnce({
        data: [],
      })
      .mockResolvedValueOnce({
        data: [{ order_id: "order_reconciled" }],
      })
      .mockResolvedValueOnce({
        data: [{ id: "order_reconciled", total: 15990 }],
      });

    const completeCart = jest
      .fn()
      .mockRejectedValue(new Error("ambiguous completion failure"));

    await expect(
      completeWebpayCartIdempotently({
        cartId: "cart_1",
        query: { graph },
        completeCart,
      }),
    ).resolves.toEqual({
      id: "order_reconciled",
      total: 15990,
    });

    expect(completeCart).toHaveBeenCalledTimes(1);
  });

  it("rethrows the original completion error when no order can be reconciled", async () => {
    const completionError = new Error("completion failed");

    const graph = jest
      .fn()
      .mockResolvedValueOnce({
        data: [],
      })
      .mockResolvedValueOnce({
        data: [],
      });

    const completeCart = jest
      .fn()
      .mockRejectedValue(completionError);

    await expect(
      completeWebpayCartIdempotently({
        cartId: "cart_1",
        query: { graph },
        completeCart,
      }),
    ).rejects.toBe(completionError);

    expect(completeCart).toHaveBeenCalledTimes(1);
  });

  it("preserves order_id with NaN total when loading the reconciled order fails", async () => {
    const graph = jest
      .fn()
      .mockResolvedValueOnce({
        data: [{ order_id: "order_existing" }],
      })
      .mockRejectedValueOnce(new Error("order query failed"));

    const completeCart = jest.fn();

    const result = await completeWebpayCartIdempotently({
      cartId: "cart_1",
      query: { graph },
      completeCart,
    });

    expect(result.id).toBe("order_existing");
    expect(Number.isNaN(result.total)).toBe(true);
    expect(completeCart).not.toHaveBeenCalled();
  });
});