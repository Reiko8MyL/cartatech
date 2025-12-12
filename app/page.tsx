import type { Metadata } from "next";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { HeroSearch } from "@/components/home/hero-search";
import { FeaturesCarousel } from "@/components/home/features-carousel";
import { Footer } from "@/components/home/footer";
import { Logo } from "@/components/ui/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateMetadata as genMeta } from "@/lib/metadata";
export const metadata: Metadata = genMeta({
  title: "Inicio",
  description:
    "Deck Builder para Mitos y Leyendas Primer Bloque. Construye, explora y comparte tus mazos. La base de datos más completa de cartas del formato Primer Bloque Extendido.",
  keywords: ["deck builder", "constructor de mazos", "base de datos", "cartas MyL"],
  path: "/",
});

export default function Home() {
  return (
    <>
      <main className="flex flex-col">
        {/* Hero Section con fondo de imagen - Ocupa toda la altura del viewport */}
        <section
          className="relative h-screen flex items-start justify-center px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 md:pt-20 hero-section"
        >
          {/* Overlay sutil para mejorar legibilidad del texto - Reducido para aumentar opacidad de imagen */}
          <div className="absolute inset-0 bg-black/30 dark:bg-black/30" />

          <div className="container mx-auto max-w-6xl text-center relative z-10">
            <div className="mb-4 flex justify-center">
              <Logo
                width={600}
                height={200}
                className="h-48 sm:h-56 md:h-64 lg:h-72 translate-x-[-3px]"
                priority={true}
              />
            </div>
            <h1 className="sr-only">Carta Tech - MyL Deck Builder</h1>
            <p className="text-base sm:text-lg md:text-xl italic text-foreground mb-6">
              La Base de datos más completa de Mitos y Leyendas Primer Bloque Extendido
            </p>
            <HeroSearch />
          </div>

          {/* "Y HAY MÁS!" con flecha animada */}
          <div className="absolute bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-0.5">
            <span className="text-sm sm:text-base font-light italic text-foreground/90 uppercase tracking-tight font-sans">
              Y HAY MÁS!
            </span>
            <ChevronDown className="h-8 w-8 sm:h-10 sm:w-10 text-foreground/90 animate-bounce-pulse" />
          </div>
        </section>

        {/* Banner/Carrusel de características */}
        <section className="py-16">
          <FeaturesCarousel />
        </section>

        {/* Secciones para futuras actualizaciones */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12 sm:text-4xl">Próximamente</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <Card className="bg-background/50">
                <CardHeader>
                  <CardTitle>Nueva Funcionalidad</CardTitle>
                  <CardDescription>
                    Estamos trabajando en nuevas características que mejorarán tu experiencia. Mantente atento a las
                    actualizaciones.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Esta sección se actualizará próximamente con contenido exclusivo.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-background/50">
                <CardHeader>
                  <CardTitle>Nueva Funcionalidad</CardTitle>
                  <CardDescription>
                    Estamos trabajando en nuevas características que mejorarán tu experiencia. Mantente atento a las
                    actualizaciones.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Esta sección se actualizará próximamente con contenido exclusivo.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}










