import type { Metadata } from "next"
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateMetadata as genMeta } from "@/lib/metadata";

export const metadata: Metadata = genMeta({
  title: "Utilidad",
  description: "Herramientas útiles para jugadores de Mitos y Leyendas Primer Bloque: Ban List, guías, votaciones de la comunidad y más recursos.",
  keywords: ["herramientas", "utilidades", "recursos", "ban list", "guías", "votaciones"],
  path: "/utilidad",
});

const utilidadLinks = [
  {
    href: "/utilidad/ban-list",
    title: "Ban List",
    description: "Consulta las cartas prohibidas y restringidas en el formato Primer Bloque.",
  },
  {
    href: "/utilidad/pbx-101",
    title: "PBX 101",
    description: "Guía completa sobre el formato Primer Bloque para nuevos jugadores.",
  },
  {
    href: "/utilidad/comunidad-vota",
    title: "La Comunidad Vota",
    description: "Participa en las votaciones de la comunidad sobre el formato.",
  },
];

export default function UtilidadPage() {
  return (
    <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Utilidad
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Herramientas y recursos útiles para jugadores de Mitos y Leyendas Primer Bloque.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {utilidadLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="transition-all hover:bg-accent/50">
                <CardHeader>
                  <CardTitle>{link.title}</CardTitle>
                  <CardDescription>{link.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}



