"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CarouselSlide {
  title: string;
  description: string;
  cta: string;
  href: string;
  videoUrl?: string;
}

const slides: CarouselSlide[] = [
  {
    title: "Deck Builder Completo",
    description:
      "Construye tus mazos con nuestra herramienta completa que cuenta con una base de datos actualizada de todas las cartas del formato Primer Bloque.",
    cta: "Comenzar a Construir",
    href: "/deck-builder",
    videoUrl: "https://res.cloudinary.com/dpbmbrekj/video/upload/v1765496629/banner_carrousel_1_video_zpdlu7.mp4",
  },
  {
    title: "Galería de Cartas",
    description:
      "Explora todas las cartas disponibles y marca las que ya tienes para llevar un registro completo de tu colección.",
    cta: "Ver Galería",
    href: "/galeria",
  },
  {
    title: "Mazos de la Comunidad",
    description:
      "Descubre los mazos que crean otros jugadores, inspírate y comparte tus propias creaciones con la comunidad.",
    cta: "Explorar Mazos",
    href: "/mazos-comunidad",
  },
];

export function FeaturesCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // Limpiar timeout anterior si existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Reiniciar el video si volvemos al primer slide
    if (currentSlide === 0 && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        // Ignorar errores de reproducción automática
      });
    }

    // El primer slide dura 9 segundos, los demás 5 segundos
    const duration = currentSlide === 0 ? 10000 : 5000;
    
    timeoutRef.current = setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, duration);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentSlide]);

  function goToSlide(index: number) {
    setCurrentSlide(index);
  }

  function nextSlide() {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }

  function prevSlide() {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }

  function handleVideoEnded() {
    // Pausar el video al finalizar para que muestre el último frame
    if (videoRef.current) {
      videoRef.current.pause();
    }
  }

  return (
    <div className="relative w-full">
      <div className="relative overflow-hidden bg-gradient-to-br from-accent/50 to-accent/20 aspect-[12/5] w-full">
        {/* Video de fondo si está disponible */}
        {slides[currentSlide].videoUrl && (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            loop={false}
            onEnded={handleVideoEnded}
            className="absolute inset-0 w-full h-full object-cover"
            key={currentSlide}
          >
            <source src={slides[currentSlide].videoUrl} type="video/mp4" />
          </video>
        )}
        
        {/* Overlay para mejorar legibilidad del texto - solo si hay contenido de texto */}
        {currentSlide !== 0 && (
          <div className="absolute inset-0 bg-black/30 dark:bg-black/40" />
        )}
        
        {/* Contenido de texto y botón - oculto en el primer slide */}
        {currentSlide !== 0 && (
          <div className="absolute inset-0 flex items-center justify-center p-8 sm:p-12 z-10">
            <div className="text-center max-w-2xl">
              <h2 className="text-3xl font-bold mb-4 sm:text-4xl md:text-5xl">
                {slides[currentSlide].title}
              </h2>
              <p className="text-lg text-muted-foreground mb-8 sm:text-xl">
                {slides[currentSlide].description}
              </p>
              <Button asChild size="lg" className="text-base">
                <Link href={slides[currentSlide].href}>
                  {slides[currentSlide].cta}
                </Link>
              </Button>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 hover:bg-background z-20"
          aria-label="Slide anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 hover:bg-background z-20"
          aria-label="Slide siguiente"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex justify-center gap-2 mt-6">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              index === currentSlide
                ? "w-8 bg-primary"
                : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
            aria-label={`Ir al slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

