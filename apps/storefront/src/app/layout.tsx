import { getBaseURL } from "@lib/util/env"
import { Cormorant_Garamond, Manrope } from "next/font/google"
import { Metadata } from "next"
import "styles/globals.css"

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-editorial",
  weight: ["400", "500", "600"],
  display: "swap",
})

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: "Tienda de moda femenina",
    template: "%s | Tienda",
  },
  description:
    "Moda femenina, calzado y accesorios con despacho a todo Chile.",
}

export default function RootLayout(props: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="es"
      data-mode="light"
      className={`${cormorant.variable} ${manrope.variable}`}
    >
      <body>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}