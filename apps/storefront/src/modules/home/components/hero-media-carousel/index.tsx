"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"

const AUTOPLAY_INTERVAL = 3000

const mediaItems = [
  {
    type: "image" as const,
    src: "/images/home/hero/hero-real-mirror.webp",
    alt: "Modelo de Indiscreta frente al espejo luciendo un look de la colección",
    position: "object-center",
  },
  {
    type: "image" as const,
    src: "/images/home/hero/hero-look-pink.webp",
    alt: "Modelo de Indiscreta con outfit en tonos beige y celeste sobre fondo rosado",
    position: "object-center",
  },
  {
    type: "video" as const,
    src: "/images/home/hero/hero-video.mp4",
  },
  {
    type: "image" as const,
    src: "/images/home/hero/hero-look-back.webp",
    alt: "Modelo de Indiscreta de espalda con outfit negro",
    position: "object-center",
  },
]

const desktopGroups = [
  [0, 1],
  [2, 3],
]

export default function HeroMediaCarousel() {
  const [mobileIndex, setMobileIndex] = useState(0)
  const [desktopIndex, setDesktopIndex] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)
  const desktopVideoRef = useRef<HTMLVideoElement>(null)
  const mobileVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")

    const updateReducedMotion = () => {
      setReducedMotion(mediaQuery.matches)
    }

    updateReducedMotion()
    mediaQuery.addEventListener("change", updateReducedMotion)

    return () => {
      mediaQuery.removeEventListener("change", updateReducedMotion)
    }
  }, [])

  useEffect(() => {
    if (reducedMotion) {
      return
    }

    const timer = window.setTimeout(() => {
      setMobileIndex((current) => (current + 1) % mediaItems.length)
      setDesktopIndex((current) => (current + 1) % desktopGroups.length)
    }, AUTOPLAY_INTERVAL)

    return () => {
      window.clearTimeout(timer)
    }
  }, [mobileIndex, desktopIndex, reducedMotion])

  useEffect(() => {
    const desktopVideo = desktopVideoRef.current
    const mobileVideo = mobileVideoRef.current

    const desktopVideoActive = desktopIndex === 1
    const mobileVideoActive = mobileIndex === 2

    if (desktopVideo) {
      if (desktopVideoActive) {
        desktopVideo.currentTime = 0
        desktopVideo.play().catch(() => {})
      } else {
        desktopVideo.pause()
        desktopVideo.currentTime = 0
      }
    }

    if (mobileVideo) {
      if (mobileVideoActive) {
        mobileVideo.currentTime = 0
        mobileVideo.play().catch(() => {})
      } else {
        mobileVideo.pause()
        mobileVideo.currentTime = 0
      }
    }
  }, [desktopIndex, mobileIndex])

  return (
    <div
      className="absolute inset-0 overflow-hidden bg-black"
      aria-roledescription="carousel"
      aria-label="Colección destacada de Indiscreta"
    >
      <div className="absolute inset-0 lg:hidden">
        {mediaItems.map((item, index) => {
          const isActive = index === mobileIndex

          return (
            <div
              key={item.src}
              className={`absolute inset-0 ${
                isActive
                  ? "z-10 opacity-100"
                  : "pointer-events-none z-0 opacity-0"
              }`}
              aria-hidden={!isActive}
            >
              {item.type === "image" ? (
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  className="object-contain"
                />
              ) : (
                <div className="relative h-full w-full overflow-hidden bg-black">
                  <video
                    src={item.src}
                    muted
                    playsInline
                    preload="metadata"
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl opacity-45"
                  />

                  <video
                    ref={mobileVideoRef}
                    src={item.src}
                    muted
                    playsInline
                    preload="metadata"
                    disablePictureInPicture
                    className="relative z-10 h-full w-full object-contain"
                    aria-label="Video de colección de Indiscreta"
                  />
                </div>
              )}
            </div>
          )
        })}

        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
          {mediaItems.map((item, index) => {
            const isActive = index === mobileIndex

            return (
              <button
                key={item.src}
                type="button"
                onClick={() => setMobileIndex(index)}
                aria-label={`Mostrar elemento ${index + 1} de ${mediaItems.length}`}
                aria-current={isActive ? "true" : undefined}
                className={`h-2 rounded-full transition-all duration-300 ${
                  isActive
                    ? "w-7 bg-white"
                    : "w-2 bg-white/55 hover:bg-white/80"
                }`}
              >
                <span className="sr-only">
                  {isActive
                    ? "Elemento activo"
                    : `Ir al elemento ${index + 1}`}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="absolute inset-0 hidden lg:block">
        {desktopGroups.map((group, groupIndex) => {
          const isActive = groupIndex === desktopIndex

          return (
            <div
              key={groupIndex}
              className={`absolute inset-0 grid grid-cols-2 gap-1 bg-black transition-opacity duration-700 ease-in-out ${
                isActive
                  ? "z-10 opacity-100"
                  : "pointer-events-none z-0 opacity-0"
              }`}
              aria-hidden={!isActive}
            >
              {group.map((mediaIndex) => {
                const item = mediaItems[mediaIndex]

                return (
                  <div
                    key={item.src}
                    className="relative min-w-0 overflow-hidden bg-black"
                  >
                    {item.type === "image" ? (
                      <Image
                        src={item.src}
                        alt={item.alt}
                        fill
                        priority={groupIndex === 0}
                        sizes="28vw"
                        className={`object-cover ${item.position}`}
                      />
                    ) : (
                      <video
                        ref={desktopVideoRef}
                        src={item.src}
                        muted
                        playsInline
                        preload="metadata"
                        disablePictureInPicture
                        className="h-full w-full bg-black object-cover"
                        aria-label="Video de colección de Indiscreta"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}

        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
          {desktopGroups.map((_, index) => {
            const isActive = index === desktopIndex

            return (
              <button
                key={index}
                type="button"
                onClick={() => setDesktopIndex(index)}
                aria-label={`Mostrar composición ${index + 1} de ${desktopGroups.length}`}
                aria-current={isActive ? "true" : undefined}
                className={`h-2 rounded-full transition-all duration-300 ${
                  isActive
                    ? "w-7 bg-white"
                    : "w-2 bg-white/55 hover:bg-white/80"
                }`}
              >
                <span className="sr-only">
                  {isActive
                    ? "Composición activa"
                    : `Ir a composición ${index + 1}`}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
