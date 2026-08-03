"use client"

import { ReactNode, useRef } from "react"

type NewArrivalsCarouselProps = {
  children: ReactNode
}

function ArrowLeft() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-5 w-5"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function ArrowRight() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-5 w-5"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}

export default function NewArrivalsCarousel({
  children,
}: NewArrivalsCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    const carousel = carouselRef.current

    if (!carousel) {
      return
    }

    const firstCard = carousel.firstElementChild as HTMLElement | null
    const cardWidth = firstCard?.offsetWidth ?? carousel.clientWidth * 0.8
    const gap = 16
    const distance = (cardWidth + gap) * 2

    carousel.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth",
    })
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Ver productos anteriores"
        onClick={() => scroll("left")}
        className="absolute left-0 top-[42%] z-20 hidden h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border border-black bg-white text-black transition-colors hover:bg-black hover:text-white lg:flex"
      >
        <ArrowLeft />
      </button>

      <div
        ref={carouselRef}
        className="no-scrollbar grid snap-x snap-mandatory auto-cols-[78%] grid-flow-col gap-4 overflow-x-auto sm:auto-cols-[46%] lg:auto-cols-[calc((100%-64px)/5)]"
      >
        {children}
      </div>

      <button
        type="button"
        aria-label="Ver más productos"
        onClick={() => scroll("right")}
        className="absolute right-0 top-[42%] z-20 hidden h-10 w-10 translate-x-1/2 items-center justify-center rounded-full border border-black bg-white text-black transition-colors hover:bg-black hover:text-white lg:flex"
      >
        <ArrowRight />
      </button>
    </div>
  )
}