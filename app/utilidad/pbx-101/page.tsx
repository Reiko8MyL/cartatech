import type { Metadata } from "next"
import { generateMetadata as genMeta } from "@/lib/metadata"

export const metadata: Metadata = genMeta({
  title: "PBX 101",
  description: "Guía completa sobre el formato Primer Bloque (PBX) de Mitos y Leyendas para nuevos jugadores. Aprende las reglas, restricciones y estrategias del formato.",
  keywords: ["PBX", "Primer Bloque", "guía", "tutorial", "nuevos jugadores", "formato", "reglas"],
  path: "/utilidad/pbx-101",
});

export default function PBX101Page() {
  return (
    <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          PBX 101
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Guía completa sobre el formato Primer Bloque. Esta funcionalidad estará disponible próximamente.
        </p>
      </div>
    </main>
  );
}



