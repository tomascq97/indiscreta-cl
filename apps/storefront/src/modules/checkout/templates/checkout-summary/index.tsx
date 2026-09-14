import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import DiscountCode from "@modules/checkout/components/discount-code"
import CartTotals from "@modules/common/components/cart-totals"
import { HttpTypes } from "@medusajs/types"

const CheckoutSummary = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  return (
    <section
      className="border border-neutral-200 bg-white p-5 shadow-sm sm:p-6"
      data-testid="checkout-summary"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-rose)]">
        Tu compra
      </p>

      <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-black">
        Resumen del pedido
      </h2>

      <div className="mt-6 border-t border-neutral-200 pt-5">
        <CartTotals totals={cart} />
      </div>

      <div className="mt-6 border-t border-neutral-200 pt-5">
        <ItemsPreviewTemplate cart={cart} />
      </div>

      <div className="mt-6 border-t border-neutral-200 pt-5">
        <DiscountCode cart={cart} />
      </div>

      <div className="mt-6 space-y-2 border-t border-neutral-200 pt-5 text-xs leading-5 text-neutral-600">
        <p>✓ Compra 100% segura</p>
        <p>✓ Pago protegido</p>
        <p>✓ Envíos a todo Chile</p>
      </div>
    </section>
  )
}

export default CheckoutSummary
