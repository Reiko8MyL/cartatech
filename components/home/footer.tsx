import Link from "next/link";

const footerLinks = {
  navegacion: [
    { href: "/", label: "Inicio" },
    { href: "/deck-builder", label: "Deck Builder" },
    { href: "/galeria", label: "Galería" },
    { href: "/mis-mazos", label: "Mis Mazos" },
    { href: "/mazos-comunidad", label: "Mazos de la Comunidad" },
  ],
  utilidad: [
    { href: "/utilidad/ban-list", label: "Ban List" },
    { href: "/utilidad/pbx-101", label: "PBX 101" },
    { href: "/utilidad/comunidad-vota", label: "La Comunidad Vota" },
  ],
  recursos: [
    { href: "/utilidad", label: "Utilidad" },
    { href: "/galeria", label: "Todas las Cartas" },
    { href: "/mazos-comunidad", label: "Mazos Populares" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <h3 className="text-xl font-semibold mb-4">Carta Tech</h3>
            <p className="text-muted-foreground max-w-md">
              La herramienta definitiva para construir, explorar y compartir
              mazos del formato Primer Bloque de Mitos y Leyendas. Únete a la
              comunidad y lleva tu juego al siguiente nivel.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Navegación</h4>
            <ul className="space-y-2">
              {footerLinks.navegacion.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Recursos</h4>
            <ul className="space-y-2">
              {footerLinks.utilidad.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {footerLinks.recursos.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border/40">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Carta Tech. Todos los derechos
            reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}











