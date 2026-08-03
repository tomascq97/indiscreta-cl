const benefits = [
  {
    title: "Envío gratis",
    description: "Sobre $80.000",
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-7 w-7"
      >
        <path d="M3 6.5h11v10H3z" />
        <path d="M14 10h3.5l3.5 3.5v3H14z" />
        <circle cx="7" cy="18" r="1.5" />
        <circle cx="18" cy="18" r="1.5" />
      </svg>
    ),
  },
  {
    title: "Hasta 6 cuotas",
    description: "Sin interés",
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-7 w-7"
      >
        <rect x="3" y="5" width="18" height="14" rx="1.5" />
        <path d="M3 9h18" />
        <path d="M7 15h4" />
      </svg>
    ),
  },
  {
    title: "Cambios gratis",
    description: "Hasta 30 días",
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-7 w-7"
      >
        <path d="M7 7h11l-2.5-2.5" />
        <path d="M18 7l-2.5 2.5" />
        <path d="M17 17H6l2.5 2.5" />
        <path d="M6 17l2.5-2.5" />
      </svg>
    ),
  },
  {
    title: "Compra segura",
    description: "Tus datos protegidos",
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-7 w-7"
      >
        <path d="M12 3 19 6v5c0 4.5-2.8 8-7 10-4.2-2-7-5.5-7-10V6z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
]

export default function StoreBenefits() {
  return (
    <section
      aria-label="Beneficios de compra"
      className="border-y border-neutral-200 bg-white"
    >
      <div className="store-container">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, index) => (
            <div
              key={benefit.title}
              className={[
                "flex min-h-[104px] items-center justify-center gap-4 px-4 py-6",
                "border-neutral-200",
                index % 2 === 0 ? "border-r" : "",
                index < 2 ? "border-b lg:border-b-0" : "",
                index < benefits.length - 1 ? "lg:border-r" : "",
              ].join(" ")}
            >
              <div className="shrink-0 text-black">{benefit.icon}</div>

              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-black">
                  {benefit.title}
                </h3>

                <p className="mt-1 text-[11px] text-neutral-500">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}