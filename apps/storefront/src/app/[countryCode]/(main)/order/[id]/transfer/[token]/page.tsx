import { Heading, Text } from "@modules/common/components/ui"
import TransferActions from "@modules/order/components/transfer-actions"
import TransferImage from "@modules/order/components/transfer-image"

export default async function TransferPage({
  params,
}: {
  params: { id: string; token: string }
}) {
  const { id, token } = params

  return (
    <div className="flex flex-col gap-y-4 items-start w-2/5 mx-auto mt-10 mb-20">
      <TransferImage />
      <div className="flex flex-col gap-y-6">
        <Heading level="h1" className="text-xl text-zinc-900">
          Solicitud de transferencia del pedido {id}
        </Heading>
        <Text className="text-zinc-600">
          Recibiste una solicitud para transferir la titularidad de tu pedido (
          {id}). If you agree to this request, you can approve the transfer by
          clicking the button below.
        </Text>
        <div className="w-full h-px bg-zinc-200" />
        <Text className="text-zinc-600">
          Si aceptas, la nueva persona propietaria asumirá todas las
          responsabilidades y permisos asociados a este pedido.
        </Text>
        <Text className="text-zinc-600">
          Si no reconoces esta solicitud o deseas conservar la propiedad, no
          necesitas realizar ninguna otra acción.
        </Text>
        <div className="w-full h-px bg-zinc-200" />
        <TransferActions id={id} token={token} />
      </div>
    </div>
  )
}
