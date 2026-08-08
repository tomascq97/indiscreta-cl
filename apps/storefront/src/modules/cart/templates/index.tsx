import ItemsTemplate from "./items"
import Summary from "./summary"
import EmptyCartMessage from "../components/empty-cart-message"
import SignInPrompt from "../components/sign-in-prompt"
import CartRecommendations from "../components/cart-recommendations"
import { HttpTypes } from "@medusajs/types"

const CartTemplate = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  const hasItems = Boolean(cart?.items?.length)

  return (
    <section className="bg-white text-black" data-testid="cart-container">
      <div className="border-b border-neutral-800 bg-black text-white">
        <div className="store-container py-10 sm:py-12 lg:py-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-rose)]">
            Indiscreta
          </p>

          <h1 className="mt-3 text-4xl font-extrabold uppercase leading-none tracking-[-0.04em] sm:text-5xl">
            Mi carrito
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">
            Revisa tus productos, ajusta las cantidades y confirma el resumen
            antes de finalizar la compra.
          </p>
        </div>
      </div>

      <div className="store-container py-8 sm:py-10 lg:py-14">
        {hasItems && cart ? (
          <>
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-12">
              <div className="min-w-0">
                {!customer ? (
                  <div className="mb-6">
                    <SignInPrompt />
                  </div>
                ) : null}

                <ItemsTemplate cart={cart} />
              </div>

              {cart.region ? (
                <aside className="lg:sticky lg:top-44">
                  <Summary cart={cart} />
                </aside>
              ) : null}
            </div>

            <CartRecommendations cart={cart} />
          </>
        ) : (
          <EmptyCartMessage />
        )}
      </div>
    </section>
  )
}

export default CartTemplate
