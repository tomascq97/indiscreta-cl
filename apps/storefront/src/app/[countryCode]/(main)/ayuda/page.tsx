import { Metadata } from "next"
import HelpContactForm from "@modules/layout/components/help-contact-form"

export const metadata: Metadata = {
  title: "Ayuda",
  description:
    "Preguntas frecuentes, información de envíos, cambios, devoluciones, guía de tallas y contacto de Indiscreta.",
}

const navigationItems = [
  {
    number: "01",
    label: "Preguntas frecuentes",
    href: "#preguntas-frecuentes",
  },
  { number: "02", label: "Envíos", href: "#envios" },
  {
    number: "03",
    label: "Cambios y devoluciones",
    href: "#cambios-y-devoluciones",
  },
  { number: "04", label: "Guía de tallas", href: "#guia-de-tallas" },
  { number: "05", label: "Contacto", href: "#contacto" },
]

const faqItems = [
  {
    question: "¿Cómo realizo una compra?",
    answer:
      "Explora nuestro catálogo, selecciona el producto y la variante que prefieras, agrégalo al carrito y completa los datos solicitados en el checkout. Antes de confirmar podrás revisar productos, cantidades, despacho y total de la compra.",
  },
  {
    question: "¿Es seguro comprar en nuestro sitio?",
    answer:
      "Trabajamos con conexiones seguras y proveedores especializados para procesar las operaciones de la tienda. Indiscreta no almacena directamente los datos completos de las tarjetas de pago.",
  },
  {
    question: "¿Cuáles son las formas de pago?",
    answer:
      "Los medios habilitados se muestran durante el checkout. Podrás revisar las alternativas disponibles antes de confirmar el pedido.",
  },
  {
    question: "¿Cuánto tarda el envío de mi compra?",
    answer:
      "El plazo estimado depende de la comuna de destino, la disponibilidad del producto y la empresa de transporte. La estimación aplicable se informará durante la compra o en la confirmación del pedido.",
  },
  {
    question: "¿Qué hago si mi producto no llega?",
    answer:
      "Escríbenos a contacto.indiscreta@gmail.com indicando tu nombre, número de pedido y una descripción del problema. Revisaremos el seguimiento y gestionaremos el caso con la empresa de transporte.",
  },
  {
    question: "¿Cuál es la garantía de los productos?",
    answer:
      "Cuando un producto nuevo presenta una falla cubierta por la garantía legal, puedes solicitar la alternativa que corresponda conforme a la normativa chilena vigente. La evaluación requiere antecedentes de la compra y del estado del producto.",
  },
]

const shippingItems = [
  {
    title: "Cobertura",
    text: "Realizamos despachos dentro de Chile en las zonas habilitadas durante el checkout. La disponibilidad del servicio depende de la dirección ingresada.",
  },
  {
    title: "Preparación del pedido",
    text: "El pedido comienza a prepararse una vez confirmado el pago. Recibirás información de la compra y, cuando corresponda, los datos de seguimiento.",
  },
  {
    title: "Plazos",
    text: "Los plazos son estimados y pueden variar según la comuna, períodos de alta demanda, disponibilidad de stock y operación de la empresa de transporte.",
  },
  {
    title: "Dirección y recepción",
    text: "Es responsabilidad de la persona compradora ingresar una dirección completa y correcta, y asegurar que exista alguien disponible para recibir el pedido.",
  },
  {
    title: "Incidencias",
    text: "Ante retrasos, daños visibles o problemas con la entrega, contáctanos con tu número de pedido para iniciar la revisión correspondiente.",
  },
]

const changeItems = [
  {
    title: "Derecho a retracto",
    text: "En compras realizadas por internet, el derecho a retracto se ejercerá en los casos y plazos establecidos por la normativa chilena. El producto debe conservarse sin uso, con sus etiquetas, accesorios y embalaje original, salvo las excepciones legales aplicables.",
  },
  {
    title: "Cambios por talla o preferencia",
    text: "Podrás solicitar un cambio si el producto está sin uso, limpio, en perfecto estado y conserva etiquetas, accesorios y embalaje. La disponibilidad de la nueva talla o producto dependerá del stock existente.",
  },
  {
    title: "Diferencias de valor",
    text: "Si eliges un producto de mayor valor, deberás pagar la diferencia. Si eliges uno de menor valor, el tratamiento del saldo se informará antes de confirmar el cambio.",
  },
  {
    title: "Costos de despacho",
    text: "Los costos asociados a cambios por talla o preferencia personal serán informados durante la gestión. Si existe una falla cubierta legalmente, se aplicarán las obligaciones correspondientes al proveedor.",
  },
  {
    title: "Garantía legal",
    text: "Si el producto nuevo presenta una falla de fabricación o no cumple las condiciones informadas, podrás ejercer la garantía legal dentro del plazo vigente y elegir entre las alternativas reconocidas por la ley, cuando corresponda.",
  },
  {
    title: "Evaluación",
    text: "Para evaluar el caso solicitaremos el número de pedido, fotografías claras y una descripción. No se consideran fallas de fabricación el desgaste normal, el mal uso, daños externos o modificaciones realizadas después de la entrega.",
  },
]

const sizeRows = [
  { cl: "35", foot: "22,5–23,0 cm" },
  { cl: "36", foot: "23,0–23,5 cm" },
  { cl: "37", foot: "23,5–24,0 cm" },
  { cl: "38", foot: "24,0–24,5 cm" },
  { cl: "39", foot: "24,5–25,0 cm" },
  { cl: "40", foot: "25,0–25,5 cm" },
]

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <header className="mb-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-rose)]">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-extrabold uppercase leading-none tracking-[-0.03em] text-black sm:text-4xl lg:text-[42px]">
        {title}
      </h2>
      <p className="mt-5 max-w-3xl text-sm leading-7 text-neutral-600 sm:text-base">
        {description}
      </p>
    </header>
  )
}

function InformationRows({
  items,
}: {
  items: Array<{ title: string; text: string }>
}) {
  return (
    <div className="divide-y divide-neutral-200 border-y border-neutral-200">
      {items.map((item, index) => (
        <article
          key={item.title}
          className="grid gap-4 py-7 sm:grid-cols-[52px_minmax(0,1fr)]"
        >
          <span className="text-sm font-semibold text-[var(--color-rose)]">
            {String(index + 1).padStart(2, "0")}
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

export default function HelpPage() {
  return (
    <main className="bg-white text-black">
      <section className="border-b border-neutral-800 bg-black text-white">
        <div className="store-container py-14 sm:py-16 lg:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-rose)]">
            Indiscreta
          </p>

          <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
            <h1 className="max-w-4xl text-5xl font-extrabold uppercase leading-[0.9] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Ayuda
            </h1>

            <p className="max-w-xl text-sm leading-7 text-white/65 sm:text-base">
              Resuelve tus dudas sobre compras, envíos, cambios, tallas y
              atención al cliente.
            </p>
          </div>
        </div>
      </section>

      <div className="store-container py-10 sm:py-12 lg:py-16">
        <nav
          aria-label="Contenido de ayuda"
          className="border-y border-neutral-200"
        >
          <ul className="grid md:grid-cols-5">
            {navigationItems.map((item) => (
              <li
                key={item.href}
                className="border-b border-neutral-200 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
              >
                <a
                  href={item.href}
                  className="group flex h-full items-center gap-3 px-4 py-5 transition-colors hover:bg-neutral-50"
                >
                  <span className="text-xs font-semibold text-[var(--color-rose)]">
                    {item.number}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.04em] text-black transition-colors group-hover:text-[var(--color-rose-dark)]">
                    {item.label}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mx-auto mt-16 max-w-[980px]">
          <section
            id="preguntas-frecuentes"
            className="scroll-mt-44 border-b border-neutral-200 pb-16"
          >
            <SectionHeader
              eyebrow="¿Necesitas ayuda rápida?"
              title="Preguntas frecuentes"
              description="Encuentra respuestas a las consultas más habituales antes y después de realizar tu compra."
            />

            <div className="divide-y divide-neutral-200 border-y border-neutral-200">
              {faqItems.map((item, index) => (
                <details key={item.question} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold text-[var(--color-rose)]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h3 className="text-sm font-bold uppercase tracking-[0.04em] text-black sm:text-base">
                        {item.question}
                      </h3>
                    </div>
                    <span
                      aria-hidden="true"
                      className="text-2xl font-light transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="max-w-3xl pb-6 pl-12 text-sm leading-7 text-neutral-600 sm:text-base">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>

          <section
            id="envios"
            className="scroll-mt-44 border-b border-neutral-200 py-16"
          >
            <SectionHeader
              eyebrow="Despachos"
              title="Envíos"
              description="Información general sobre cobertura, preparación, plazos y seguimiento de los pedidos."
            />
            <InformationRows items={shippingItems} />
          </section>

          <section
            id="cambios-y-devoluciones"
            className="scroll-mt-44 border-b border-neutral-200 py-16"
          >
            <SectionHeader
              eyebrow="Postventa"
              title="Cambios y devoluciones"
              description="Revisa las condiciones generales para solicitar cambios, ejercer el retracto o gestionar una garantía."
            />
            <InformationRows items={changeItems} />

            <div className="mt-8 border-l-4 border-[var(--color-rose)] bg-neutral-50 px-6 py-5">
              <p className="text-sm font-bold uppercase tracking-[0.06em] text-black">
                Antes de enviar un producto
              </p>
              <p className="mt-2 text-sm leading-7 text-neutral-600">
                Escríbenos primero a contacto.indiscreta@gmail.com. Te
                indicaremos los antecedentes, dirección y procedimiento
                aplicables a tu caso.
              </p>
            </div>
          </section>

          <section
            id="guia-de-tallas"
            className="scroll-mt-44 border-b border-neutral-200 py-16"
          >
            <SectionHeader
              eyebrow="Encuentra tu talla"
              title="Guía de tallas"
              description="Esta tabla es referencial. Revisa siempre la información específica publicada en cada producto."
            />

            <div className="overflow-hidden border border-neutral-200">
              <div className="grid grid-cols-2 bg-black px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
                <span>Talla</span>
                <span>Largo aproximado del pie</span>
              </div>
              {sizeRows.map((row) => (
                <div
                  key={row.cl}
                  className="grid grid-cols-2 border-t border-neutral-200 px-5 py-4 text-sm"
                >
                  <span className="font-semibold">{row.cl}</span>
                  <span className="text-neutral-600">{row.foot}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-6 bg-neutral-50 p-6 sm:grid-cols-3">
              <div>
                <span className="text-sm font-bold text-[var(--color-rose)]">
                  01
                </span>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  Apoya el talón contra una pared sobre una hoja de papel.
                </p>
              </div>
              <div>
                <span className="text-sm font-bold text-[var(--color-rose)]">
                  02
                </span>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  Marca el extremo del dedo más largo y mide la distancia.
                </p>
              </div>
              <div>
                <span className="text-sm font-bold text-[var(--color-rose)]">
                  03
                </span>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  Si estás entre dos tallas, revisa el ajuste indicado en el
                  producto o contáctanos.
                </p>
              </div>
            </div>
          </section>

          <section id="contacto" className="scroll-mt-44 pt-16">
            <SectionHeader
              eyebrow="Estamos para ayudarte"
              title="Contacto"
              description="Envíanos los antecedentes de tu consulta y prepara un correo dirigido a nuestro canal de atención."
            />

            <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
              <div className="bg-black p-7 text-white">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-rose)]">
                  Correo de atención
                </p>
                <a
                  href="mailto:contacto.indiscreta@gmail.com"
                  className="mt-3 block break-all text-lg font-semibold transition-colors hover:text-[var(--color-rose)]"
                >
                  contacto.indiscreta@gmail.com
                </a>
                <p className="mt-5 text-sm leading-7 text-white/65">
                  Incluye tu nombre y número de pedido cuando la consulta esté
                  relacionada con una compra.
                </p>
              </div>

              <HelpContactForm />
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
