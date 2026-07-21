const messages = [
  "Envío gratis sobre $80.000",
  "Hasta 6 cuotas sin interés",
  "Cambios y devoluciones gratis",
]

export default function MarqueePromo() {
  return (
    <div className="overflow-hidden bg-black py-2.5 text-white">
      <div className="marquee-track flex w-max items-center whitespace-nowrap">
        {[...messages, ...messages].map((message, index) => (
          <div
            key={`${message}-${index}`}
            className="flex items-center"
          >
            <span className="mx-10 text-[10px] font-medium uppercase tracking-[0.14em] sm:text-[11px]">
              {message}
            </span>

            <span
              aria-hidden="true"
              className="h-1 w-1 rounded-full bg-white/70"
            />
          </div>
        ))}
      </div>
    </div>
  )
}