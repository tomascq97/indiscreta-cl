import { esCl } from "@lib/translations/es-cl"
import InteractiveLink from "@modules/common/components/interactive-link"
import { Metadata } from "next"
export const metadata: Metadata = {
  title: "404",
  description: "Ocurrió un error",
}
export default async function NotFound() {
  return (
    <div className="flex flex-col gap-4 items-center justify-center min-h-[calc(100vh-64px)]">
      <h1 className="text-2xl-semi text-ui-fg-base">
        {esCl.errors.pageNotFound}
      </h1>
      <p className="text-small-regular text-ui-fg-base">
        La página que intentaste visitar no existe.
      </p>
      <InteractiveLink href="/">Ir al inicio</InteractiveLink>
    </div>
  )
}
