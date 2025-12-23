import type { Metadata } from "next";
import Image from "next/image";
import { ChevronDown, Heart, MessageSquare, CreditCard, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
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
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-16 sm:text-4xl tracking-tight">Comunidad y Apoyo</h2>
            <div className="grid gap-8 sm:grid-cols-2">
              {/* Card de Apoyo */}
              <Card className="group relative overflow-hidden bg-background/40 border-primary/10 hover:border-primary/30 transition-all duration-500 shadow-xl hover:shadow-2xl hover:-translate-y-1">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-500">
                      <Heart className="h-6 w-6 fill-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">Apoya el Proyecto</CardTitle>
                      <CardDescription className="text-xs font-medium uppercase tracking-widest text-primary/70">Donaciones</CardDescription>
                    </div>
                  </div>
                  <CardDescription className="text-sm leading-relaxed">
                    Ayúdanos a mantener los servidores y seguir mejorando CartaTech. Tu aporte nos permite seguir creando herramientas premium para la comunidad de Mitos y Leyendas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                  <div className="flex flex-col gap-3 p-5 rounded-2xl bg-muted/40 border border-border/40 backdrop-blur-sm">
                    <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                      <span>Pasarela Segura</span>
                      <span className="text-primary/80">vía Flow.cl</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center px-2 py-2 bg-white rounded-xl shadow-sm border border-border/20 group-hover:border-primary/30 transition-colors">
                        <Image 
                          src="https://media.licdn.com/dms/image/v2/D4E0BAQFSqAbJNU5RbQ/company-logo_200_200/B4EZfpnDttGwAQ-/0/1751971020067/flow_sa_logo?e=2147483647&v=beta&t=39Dyu3LlUSqEf2X8lrFN7y4JOyV3junr5Pr88Ozsmrg" 
                          alt="Flow" 
                          width={40} 
                          height={40} 
                          className="h-10 w-10 object-contain rounded-lg"
                          unoptimized
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-foreground uppercase tracking-tight">
                          <CreditCard className="h-3 w-3 text-primary" />
                          <span>PAGO SEGURO NACIONAL</span>
                        </div>
                        <span className="text-[9px] text-muted-foreground font-medium">Webpay, Redcompra y Transferencias</span>
                      </div>
                    </div>
                  </div>
                  <a 
                    href="https://www.flow.cl/btn.php?token=j47e52fda683bbac69ff3efe05006f4d9ca389a7" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button className="w-full h-14 rounded-2xl text-base font-black bg-gradient-to-br from-primary via-primary to-primary/90 hover:to-primary text-primary-foreground shadow-[0_8px_30px_rgb(var(--primary)/0.2)] hover:shadow-[0_8px_30px_rgb(var(--primary)/0.4)] transition-all duration-300 group/btn overflow-hidden relative">
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        Aportar con Webpay
                        <ExternalLink className="h-4 w-4 opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" />
                      </span>
                      <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                    </Button>
                  </a>
                </CardContent>
              </Card>

              {/* Card de Discord */}
              <Card className="group relative overflow-hidden bg-background/40 border-secondary/10 hover:border-secondary/30 transition-all duration-500 shadow-xl hover:shadow-2xl hover:-translate-y-1">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#5865F2]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-2xl bg-[#5865F2]/10 text-[#5865F2] group-hover:scale-110 transition-transform duration-500">
                      <MessageSquare className="h-6 w-6 fill-current" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">Únete a Discord</CardTitle>
                      <CardDescription className="text-xs font-medium uppercase tracking-widest text-[#5865F2]/70">Comunidad Oficial</CardDescription>
                    </div>
                  </div>
                  <CardDescription className="text-sm leading-relaxed">
                    Sé parte de nuestra comunidad oficial. Comparte tus mazos, recibe ayuda de otros jugadores y discute estrategias, el meta, la carta tech del mazo, lo que tu quieras.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                  <div className="flex items-center gap-4 p-5 rounded-2xl bg-[#5865F2]/5 border border-[#5865F2]/10 backdrop-blur-sm">
                    <div className="p-2.5 rounded-xl bg-[#5865F2] text-white shadow-lg shadow-[#5865F2]/20">
                      <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.074 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.069.07 0 0 0-.032.027C.533 9.048-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.419-2.157 2.419z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-[#5865F2] uppercase tracking-wider">CartaTech Community</p>
                      <p className="text-[11px] text-muted-foreground font-medium">Chat en vivo, soporte y anuncios</p>
                    </div>
                  </div>
                  <a 
                    href="https://discord.gg/HVYcDFwZ" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button className="w-full h-14 rounded-2xl text-base font-black bg-[#5865F2] hover:bg-[#4752C4] text-white shadow-[0_8px_30px_rgba(88,101,242,0.2)] hover:shadow-[0_8px_30px_rgba(88,101,242,0.4)] transition-all duration-300 group/btn overflow-hidden relative border-none">
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        Unirse al Servidor
                        <ExternalLink className="h-4 w-4 opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" />
                      </span>
                      <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                    </Button>
                  </a>
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










