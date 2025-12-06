import type { Metadata } from "next";
import { generateMetadata as genMeta } from "@/lib/metadata";
import { Footer } from "@/components/home/footer";

export const metadata: Metadata = genMeta({
  title: "Política de Privacidad",
  description:
    "Política de Privacidad de CartaTech. Información sobre cómo recopilamos, usamos y protegemos tus datos personales.",
  keywords: ["política de privacidad", "privacidad", "cookies", "datos personales"],
  path: "/politica-de-privacidad",
});

export default function PoliticaPrivacidadPage() {
  return (
    <>
      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold mb-6 sm:text-5xl">Política de Privacidad</h1>
          <p className="text-muted-foreground mb-8 text-sm sm:text-base">
            Última actualización: {new Date().toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-sm sm:text-base">
            {/* Introducción */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 sm:text-3xl">1. Introducción</h2>
              <p className="text-muted-foreground leading-relaxed">
                Bienvenido a <strong>CartaTech</strong>. Esta Política de Privacidad describe cómo recopilamos, 
                usamos, almacenamos y protegemos la información personal que nos proporcionas cuando utilizas 
                nuestro sitio web. Al acceder y utilizar CartaTech, aceptas las prácticas descritas en esta política.
              </p>
            </section>

            {/* Recopilación de datos */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 sm:text-3xl">2. Recopilación de Información</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Recopilamos diferentes tipos de información cuando utilizas nuestro sitio:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  <strong>Datos de navegación:</strong> Información sobre cómo interactúas con nuestro sitio, 
                  incluyendo páginas visitadas, tiempo de permanencia, y patrones de navegación.
                </li>
                <li>
                  <strong>Cookies y tecnologías similares:</strong> Utilizamos cookies, píxeles y otras tecnologías 
                  de seguimiento para mejorar tu experiencia, analizar el tráfico del sitio y personalizar el contenido.
                </li>
                <li>
                  <strong>Datos de registro:</strong> Si creas una cuenta, recopilamos información como nombre de 
                  usuario, dirección de correo electrónico y cualquier otra información que elijas proporcionar.
                </li>
                <li>
                  <strong>Datos de uso:</strong> Información sobre cómo utilizas nuestras funcionalidades, como los 
                  mazos que creas, guardas o compartes.
                </li>
              </ul>
            </section>

            {/* Cláusula AdSense - CRÍTICO */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 sm:text-3xl">3. Publicidad y Servicios de Terceros</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                <strong>Utilizamos proveedores externos, incluido Google, que usan cookies para mostrar anuncios 
                basados en las visitas anteriores del usuario a su sitio web o a otros sitios web.</strong>
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                CartaTech utiliza Google AdSense, un servicio de publicidad proporcionado por Google LLC. Google 
                AdSense utiliza cookies y tecnologías similares para:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Mostrar anuncios relevantes basados en tus intereses y actividad de navegación</li>
                <li>Medir la efectividad de los anuncios</li>
                <li>Limitar la cantidad de veces que ves un anuncio</li>
              </ul>
            </section>

            {/* Cookies de DoubleClick */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 sm:text-3xl">4. Cookies de Publicidad</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                El uso de cookies de publicidad permite a Google y a sus socios mostrar anuncios basados en la 
                navegación del usuario en nuestro sitio y en otros sitios web. Estas cookies recopilan información 
                sobre tus visitas a este y otros sitios web para proporcionarte anuncios sobre productos y servicios 
                que puedan ser de tu interés.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Google y sus socios utilizan cookies de publicidad (como las cookies de DoubleClick) para:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Personalizar los anuncios según tus intereses</li>
                <li>Medir la interacción con los anuncios</li>
                <li>Proporcionar informes sobre el rendimiento de los anuncios</li>
                <li>Evitar mostrar anuncios duplicados</li>
              </ul>
            </section>

            {/* Uso de la información */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 sm:text-3xl">5. Uso de la Información</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Utilizamos la información recopilada para:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Proporcionar, mantener y mejorar nuestros servicios</li>
                <li>Personalizar tu experiencia en el sitio</li>
                <li>Procesar transacciones y enviar notificaciones relacionadas</li>
                <li>Enviar comunicaciones técnicas, actualizaciones y soporte</li>
                <li>Detectar, prevenir y abordar problemas técnicos o de seguridad</li>
                <li>Cumplir con obligaciones legales y proteger nuestros derechos</li>
              </ul>
            </section>

            {/* Derechos del usuario */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 sm:text-3xl">6. Tus Derechos y Opciones</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Tienes varios derechos respecto a tu información personal:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                <li>
                  <strong>Acceso:</strong> Puedes solicitar una copia de la información personal que tenemos sobre ti.
                </li>
                <li>
                  <strong>Rectificación:</strong> Puedes corregir o actualizar tu información personal en cualquier momento.
                </li>
                <li>
                  <strong>Eliminación:</strong> Puedes solicitar la eliminación de tu cuenta y datos personales.
                </li>
                <li>
                  <strong>Oposición:</strong> Puedes oponerte al procesamiento de tus datos personales en ciertas circunstancias.
                </li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mb-4">
                <strong>Desactivar la publicidad personalizada:</strong> Puedes desactivar la publicidad personalizada 
                de Google visitando la página de{" "}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Configuración de anuncios de Google
                </a>
                . También puedes optar por no recibir cookies de publicidad visitando{" "}
                <a
                  href="https://www.google.com/policies/technologies/ads/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  las políticas de cookies de Google
                </a>
                .
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Para gestionar las cookies en tu navegador, puedes configurar las preferencias de cookies en la 
                configuración de tu navegador. Ten en cuenta que desactivar ciertas cookies puede afectar la 
                funcionalidad de nuestro sitio.
              </p>
            </section>

            {/* Compartir información */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 sm:text-3xl">7. Compartir Información con Terceros</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                No vendemos tu información personal. Podemos compartir información con terceros en las siguientes 
                circunstancias:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  <strong>Proveedores de servicios:</strong> Compartimos información con proveedores que nos ayudan 
                  a operar nuestro sitio, como servicios de hosting, análisis y publicidad (incluido Google AdSense).
                </li>
                <li>
                  <strong>Cumplimiento legal:</strong> Podemos divulgar información si es requerido por ley o para 
                  proteger nuestros derechos legales.
                </li>
                <li>
                  <strong>Con tu consentimiento:</strong> Compartimos información cuando nos das tu consentimiento explícito.
                </li>
              </ul>
            </section>

            {/* Seguridad */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 sm:text-3xl">8. Seguridad de los Datos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger tu información 
                personal contra acceso no autorizado, alteración, divulgación o destrucción. Sin embargo, ningún 
                método de transmisión por Internet o almacenamiento electrónico es 100% seguro, por lo que no podemos 
                garantizar una seguridad absoluta.
              </p>
            </section>

            {/* Retención de datos */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 sm:text-3xl">9. Retención de Datos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Conservamos tu información personal durante el tiempo necesario para cumplir con los propósitos 
                descritos en esta política, a menos que la ley requiera o permita un período de retención más largo. 
                Cuando elimines tu cuenta, eliminaremos o anonimizaremos tu información personal, excepto cuando la 
                ley requiera que la conservemos.
              </p>
            </section>

            {/* Cambios a la política */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 sm:text-3xl">10. Cambios a esta Política</h2>
              <p className="text-muted-foreground leading-relaxed">
                Podemos actualizar esta Política de Privacidad ocasionalmente. Te notificaremos sobre cambios 
                significativos publicando la nueva política en esta página y actualizando la fecha de "Última 
                actualización". Te recomendamos que revises esta política periódicamente para estar informado sobre 
                cómo protegemos tu información.
              </p>
            </section>

            {/* Contacto */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 sm:text-3xl">11. Contacto</h2>
              <p className="text-muted-foreground leading-relaxed">
                Si tienes preguntas, inquietudes o solicitudes relacionadas con esta Política de Privacidad o el 
                tratamiento de tus datos personales, puedes contactarnos en:
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:reiko.cartatech@gmail.com"
                  className="text-primary hover:underline"
                >
                  reiko.cartatech@gmail.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

