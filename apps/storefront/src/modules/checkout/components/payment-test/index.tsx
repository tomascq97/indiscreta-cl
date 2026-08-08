import { esCl } from "@lib/translations/es-cl"
import { Badge } from "@modules/common/components/ui"

const PaymentTest = ({ className }: { className?: string }) => {
  return (
    <Badge color="orange" className={className}>
      {esCl.checkout.paymentTestNotice}
    </Badge>
  )
}

export default PaymentTest
