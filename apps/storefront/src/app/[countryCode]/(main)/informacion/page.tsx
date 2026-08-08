import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Información",
  description:
    "Conoce Indiscreta, revisa nuestros términos y condiciones y nuestra política de privacidad.",
}

const navigationItems = [
  {
    number: "01",
    label: "Sobre Indiscreta",
    href: "#sobre-indiscreta",
  },
  {
    number: "02",
    label: "Términos y condiciones",
    href: "#terminos-y-condiciones",
  },
  {
    number: "03",
    label: "Política de privacidad",
    href: "#politica-de-privacidad",
  },
]

const termsItems = [
  {
    number: "01",
    title: "Identificación y alcance",
    text: "Estos términos regulan el acceso, navegación y compras realizadas en el sitio de Indiscreta SpA. Al completar una compra, la persona declara haber leído y aceptado las condiciones vigentes informadas durante el proceso de compra.",
  },
  {
    number: "02",
    title: "Información de productos",
    text: "Indiscreta procura presentar fotografías, descripciones, tallas, colores, materiales, cuidados y precios de manera clara. Las tonalidades pueden variar levemente según la pantalla utilizada. La disponibilidad se encuentra sujeta al stock informado al momento de confirmar la compra.",
  },
  {
    number: "03",
    title: "Precios y pagos",
    text: "Los precios se expresan en pesos chilenos e incluyen los impuestos aplicables, salvo que se indique expresamente algo distinto. Antes de confirmar la compra se informará el total, los costos de despacho y los medios de pago disponibles.",
  },
  {
    number: "04",
    title: "Confirmación de la compra",
    text: "Una vez completado el pago, la persona recibirá una confirmación con el resumen de su pedido. La compra quedará sujeta a la validación del pago, la información proporcionada y la disponibilidad efectiva de los productos.",
  },
  {
    number: "05",
    title: "Despacho y entrega",
    text: "Los plazos, cobertura, transportista y costo de despacho se informarán durante el checkout. La persona compradora debe proporcionar datos completos y correctos. Retrasos causados por información errónea, ausencia del receptor o situaciones atribuibles al transportista se gestionarán caso a caso.",
  },
  {
    number: "06",
    title: "Cambios, devoluciones y garantías",
    text: "Los cambios, devoluciones, retracto y garantía legal se gestionarán conforme a la normativa chilena aplicable y a las condiciones informadas en el sitio. Los productos deberán conservar sus etiquetas, accesorios y condiciones originales, salvo que exista una falla o falta de conformidad.",
  },
  {
    number: "07",
    title: "Uso del sitio",
    text: "No está permitido utilizar el sitio para fines ilícitos, interferir con su funcionamiento, acceder a información sin autorización ni reproducir sus contenidos, imágenes o elementos de marca sin permiso.",
  },
  {
    number: "08",
    title: "Contacto y modificaciones",
    text: "Las consultas relacionadas con compras, despachos, cambios o estas condiciones podrán realizarse mediante los canales de contacto publicados en el sitio. Indiscreta podrá actualizar estos términos cuando sea necesario; la versión vigente será la publicada en esta página.",
  },
]

const privacyItems = [
  {
    number: "01",
    title: "Datos que podemos recopilar",
    text: "Podemos recopilar datos de identificación y contacto, direcciones de despacho, información necesaria para procesar pedidos, historial de compras, preferencias y datos técnicos de navegación. Indiscreta no almacena directamente los datos completos de las tarjetas de pago.",
  },
  {
    number: "02",
    title: "Finalidades del tratamiento",
    text: "Los datos podrán utilizarse para crear y administrar cuentas, procesar compras, coordinar entregas, responder consultas, gestionar cambios o garantías, prevenir fraudes, mejorar el sitio y enviar comunicaciones comerciales cuando corresponda.",
  },
  {
    number: "03",
    title: "Proveedores y destinatarios",
    text: "La información necesaria podrá compartirse con proveedores que participen en pagos, hosting, soporte tecnológico, analítica, comunicaciones y transporte. Dichos proveedores recibirán únicamente los datos necesarios para prestar sus servicios.",
  },
  {
    number: "04",
    title: "Cookies y tecnologías similares",
    text: "El sitio puede utilizar cookies necesarias para su funcionamiento y otras tecnologías destinadas a recordar preferencias, medir el rendimiento y comprender la navegación. La disponibilidad de ciertas funciones puede depender de estas tecnologías.",
  },
  {
    number: "05",
    title: "Conservación y seguridad",
    text: "Conservaremos la información durante el tiempo necesario para cumplir las finalidades descritas, atender obligaciones contractuales y legales y resolver controversias. Aplicamos medidas razonables para prevenir accesos, modificaciones, pérdidas o divulgaciones no autorizadas.",
  },
  {
    number: "06",
    title: "Derechos de las personas",
    text: "Las personas podrán solicitar información sobre sus datos, pedir su actualización, rectificación, eliminación o ejercer los demás derechos reconocidos por la normativa aplicable, utilizando los canales de contacto publicados por Indiscreta.",
  },
  {
    number: "07",
    title: "Comunicaciones comerciales",
    text: "Cuando una persona se suscriba a novedades, podremos enviarle información sobre colecciones, beneficios y promociones. Podrá solicitar dejar de recibir estas comunicaciones mediante el mecanismo indicado en cada mensaje.",
  },
  {
    number: "08",
    title: "Actualizaciones",
    text: "Esta política podrá actualizarse para reflejar cambios en nuestros procesos, servicios o exigencias normativas. La versión vigente estará siempre disponible en esta página.",
  },
]

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description?: string
}) {
  return (
    <header className="mb-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-rose)]">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-extrabold uppercase leading-none tracking-[-0.03em] text-black sm:text-4xl lg:text-[42px]">
        {title}
      </h2>
      {description ? (
        <p className="mt-5 max-w-3xl text-sm leading-7 text-neutral-600 sm:text-base">
          {description}
        </p>
      ) : null}
    </header>
  )
}

function LegalList({
  items,
}: {
  items: Array<{ number: string; title: string; text: string }>
}) {
  return (
    <div className="divide-y divide-neutral-200 border-y border-neutral-200">
      {items.map((item) => (
        <article
          key={item.number}
          className="grid gap-4 py-7 sm:grid-cols-[52px_minmax(0,1fr)]"
        >
          <span className="text-sm font-semibold text-[var(--color-rose)]">
            {item.number}
          </span>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.06em] text-black sm:text-base">
              {item.title}
            </h3>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-600 sm:text-base">
              {item.text}
            </p>
          </div>
        </article>
      ))}
    </div>
  )
}

export default function InformationPage() {
  return (
    <main className="bg-white text-black">
      <section className="border-b border-neutral-800 bg-black text-white">
        <div className="store-container py-14 sm:py-16 lg:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-rose)]">
            Indiscreta
          </p>

          <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
            <h1 className="max-w-4xl text-5xl font-extrabold uppercase leading-[0.9] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Información
            </h1>

            <p className="max-w-xl text-sm leading-7 text-white/65 sm:text-base">
              Todo lo que necesitas saber sobre nuestra marca, tus compras y el
              uso de tus datos personales.
            </p>
          </div>
        </div>
      </section>

      <div className="store-container py-10 sm:py-12 lg:py-16">
        <nav
          aria-label="Contenido de información"
          className="border-y border-neutral-200"
        >
          <ul className="grid md:grid-cols-3">
            {navigationItems.map((item) => (
              <li
                key={item.href}
                className="border-b border-neutral-200 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
              >
                <a
                  href={item.href}
                  className="group flex items-center gap-4 px-5 py-5 transition-colors hover:bg-neutral-50"
                >
                  <span className="text-xs font-semibold text-[var(--color-rose)]">
                    {item.number}
                  </span>
                  <span className="text-sm font-semibold uppercase tracking-[0.04em] text-black transition-colors group-hover:text-[var(--color-rose-dark)]">
                    {item.label}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mx-auto mt-16 max-w-[980px]">
          <section
            id="sobre-indiscreta"
            className="scroll-mt-44 border-b border-neutral-200 pb-16"
          >
            <SectionHeader
              eyebrow="Nuestra historia"
              title="Sobre Indiscreta"
              description="Una propuesta de moda femenina creada para acompañar a mujeres que disfrutan expresar su identidad a través de su estilo."
            />

            <div className="max-w-[850px] space-y-6 text-sm leading-7 text-neutral-600 sm:text-base">
              <p>
                Indiscreta es una tienda chilena de moda femenina creada para
                acompañar a mujeres que disfrutan expresar su identidad a través
                de su estilo.
              </p>
              <p>
                Nuestra propuesta reúne calzado, vestuario y accesorios
                seleccionados con atención en el diseño, la versatilidad y las
                tendencias actuales. Buscamos ofrecer una experiencia de compra
                cercana, clara y segura, desde el descubrimiento de cada
                producto hasta su entrega.
              </p>
              <p>
                Trabajamos para que cada colección permita combinar prendas y
                accesorios de distintas formas, adaptándose a momentos
                cotidianos, celebraciones y nuevas experiencias.
              </p>
            </div>

            <div className="mt-10 border-l-4 border-[var(--color-rose)] bg-neutral-50 px-6 py-5">
              <p className="text-sm font-bold uppercase tracking-[0.08em] text-black sm:text-base">
                Disfruta, vive y descubre.
              </p>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Esa es la invitación que inspira nuestra marca y cada una de
                nuestras colecciones.
              </p>
            </div>
          </section>

          <section
            id="terminos-y-condiciones"
            className="scroll-mt-44 border-b border-neutral-200 py-16"
          >
            <SectionHeader
              eyebrow="Condiciones de compra"
              title="Términos y condiciones"
              description="Estas condiciones regulan el uso del sitio y las compras realizadas en Indiscreta."
            />

            <LegalList items={termsItems} />
          </section>

          <section id="politica-de-privacidad" className="scroll-mt-44 pt-16">
            <SectionHeader
              eyebrow="Protección de datos"
              title="Política de privacidad"
              description="Explicamos qué información podemos recopilar, para qué la utilizamos y cómo protegemos tus datos."
            />

            <LegalList items={privacyItems} />
          </section>

          <div className="mt-16 border-t border-neutral-200 pt-8">
            <LocalizedClientLink
              href="/"
              className="inline-flex min-h-12 items-center justify-center bg-black px-7 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[var(--color-rose-dark)]"
            >
              Volver al inicio
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </main>
  )
}
