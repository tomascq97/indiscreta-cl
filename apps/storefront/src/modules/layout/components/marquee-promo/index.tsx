const messages = [
  "Envíos a todo Chile",
  "Hasta 6 cuotas sin interés",
  "Envío gratis sobre $80.000",
  "Retiro disponible",
]

export default function MarqueePromo() {
  return (
    <div className="overflow-hidden border-b border-neutral-800 bg-neutral-950 py-2 text-white">
      <div className="marquee-track flex w-max whitespace-nowrap">
        {[...messages, ...messages].map((message, index) => (
          <span
            key={`${message}-${index}`}
            className="mx-10 text-xs font-medium uppercase tracking-[0.16em]"
          >
            {message}
          </span>
        ))}
      </div>
    </div>
  )
}