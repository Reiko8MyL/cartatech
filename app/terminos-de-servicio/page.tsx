import type { Metadata } from "next";
import Link from "next/link";
import { generateMetadata as genMeta } from "@/lib/metadata";
import { Footer } from "@/components/home/footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = genMeta({
  title: "Términos de Servicio",
  description:
    "Términos de Servicio de CartaTech. Condiciones de uso de la plataforma, derechos y responsabilidades de los usuarios.",
  keywords: ["términos de servicio", "condiciones de uso", "términos y condiciones"],
  path: "/terminos-de-servicio",
});

export default function TerminosServicioPage() {
  return (
    <>
      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <Link href="/registro">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver al Registro
              </Button>
            </Link>
          </div>

          <h1 className="text-4xl font-bold mb-6 sm:text-5xl">Términos de Servicio</h1>
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
              <h2 className="text-2xl font-semibold mb-4 sm:text-3xl">Aceptación de los Términos</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Bienvenido a <strong>CartaTech</strong>. Al acceder, navegar o utilizar nuestro sitio web y servicios, 
                aceptas cumplir con estos Términos de Servicio y todas las leyes y regulaciones aplicables. Estos 
                términos constituyen un acuerdo legalmente vinculante entre tú y CartaTech.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Si no estás de acuerdo con alguno de estos términos, no debes utilizar nuestro servicio. Tu uso 
                continuado del servicio después de cualquier modificación a estos términos constituye tu aceptación 
                de los términos modificados.
              </p>
            </section>

            {/* Uso del Servicio */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 sm:text-3xl">Uso del Servicio</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                CartaTech es una plataforma web diseñada para construir, compartir, explorar y gestionar mazos del 
                juego de cartas Mitos y Leyendas en formato Primer Bloque. Nuestro servicio incluye constructor de mazos 
                interactivo con base de datos completa de cartas, almacenamiento y gestión de mazos personales y públicos, 
                sistema de favoritos y likes para mazos de la comunidad, sistema de comentarios y discusión sobre mazos, 
                galería de cartas con modo coleccionista, perfiles de usuario y estadísticas, y sistema de votación comunitaria.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-2">
                <strong>Al utilizar nuestro servicio, te comprometes a:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-2">
                <li>Proporcionar información precisa, actualizada y completa al crear tu cuenta</li>
                <li>Mantener la seguridad y confidencialidad de tu cuenta y contraseña</li>
                <li>No compartir tu cuenta con terceros ni permitir que otros accedan a tu cuenta</li>
                <li>Utilizar el servicio únicamente para fines legales y de acuerdo con estos términos</li>
                <li>No realizar actividades que puedan dañar, deshabilitar, sobrecargar o interferir con el funcionamiento del sitio</li>
                <li>No intentar acceder no autorizadamente a áreas restringidas del sitio o a otros sistemas o redes conectados</li>
                <li>No usar robots, scripts automatizados o métodos similares para acceder al servicio sin autorización</li>
                <li>Respetar los derechos de propiedad intelectual de CartaTech y de terceros</li>
                <li>No utilizar el servicio para transmitir spam, correo no deseado o comunicaciones no solicitadas</li>
                <li>Notificarnos inmediatamente de cualquier uso no autorizado de tu cuenta o cualquier otra violación de seguridad</li>
              </ul>
            </section>

            {/* Cuentas de Usuario */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 sm:text-3xl">Cuentas de Usuario</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Para utilizar ciertas funcionalidades de CartaTech, debes crear una cuenta proporcionando información 
                precisa y completa. Al crear una cuenta, aceptas y entiendes que eres completamente responsable de mantener 
                la confidencialidad de tu contraseña y de todas las actividades que ocurran bajo tu cuenta, ya sean 
                autorizadas o no. Debes usar una contraseña segura que incluya al menos 8 caracteres, una letra mayúscula 
                y un número, y no debes compartir tu contraseña con nadie.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Debes notificarnos inmediatamente si sospechas que tu cuenta ha sido comprometida o si detectas cualquier 
                actividad no autorizada. Debes tener la edad legal mínima requerida en tu jurisdicción para crear una cuenta 
                y utilizar nuestros servicios. No puedes crear múltiples cuentas para eludir restricciones o límites del 
                servicio. Debes mantener tu información de cuenta actualizada y precisa en todo momento.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                CartaTech se reserva el derecho de suspender o terminar tu cuenta si determinamos que has violado estos 
                términos o si tu cuenta está siendo utilizada de manera fraudulenta o perjudicial.
              </p>
            </section>

            {/* Contenido del Usuario */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 sm:text-3xl">Contenido del Usuario y Licencias</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Al publicar, subir, compartir o crear contenido en CartaTech (incluyendo pero no limitado a mazos, 
                comentarios, descripciones, etiquetas y cualquier otro material), conservas todos los derechos de propiedad 
                intelectual que tengas sobre ese contenido. Al publicar contenido en CartaTech, otorgas a CartaTech una 
                licencia mundial, no exclusiva, gratuita, transferible y sublicenciable para usar, reproducir, modificar, 
                adaptar y distribuir tu contenido en nuestra plataforma, mostrarlo a otros usuarios, incluirlo en funciones 
                de búsqueda, recomendaciones y descubrimiento, y promocionarlo dentro de la plataforma. Esta licencia 
                continúa incluso si dejas de usar nuestro servicio, excepto cuando elimines específicamente tu contenido 
                de la plataforma.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-2">
                <strong>Te comprometes a no publicar, compartir o crear contenido que:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-2">
                <li>Sea ilegal, fraudulento, engañoso o que viole cualquier ley o regulación aplicable</li>
                <li>Sea difamatorio, calumnioso, abusivo, acosador, amenazante, obsceno, profano o de otra manera objetable</li>
                <li>Infrinja los derechos de propiedad intelectual, privacidad, publicidad u otros derechos de terceros</li>
                <li>Contenga virus, malware, troyanos, gusanos, bombas lógicas u otro código malicioso o dañino</li>
                <li>Sea spam, correo no deseado, contenido promocional no autorizado o esquemas de pirámide</li>
                <li>Contenga información personal de terceros sin su consentimiento explícito</li>
                <li>Simule o se haga pasar por otra persona, entidad o representante de CartaTech</li>
                <li>Interfiera con el funcionamiento normal del servicio o afecte negativamente la experiencia de otros usuarios</li>
                <li>Contenga enlaces a sitios web maliciosos o que violen estos términos</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                CartaTech se reserva el derecho de revisar, editar, eliminar o bloquear cualquier contenido que viole 
                estos términos, sin previo aviso y a nuestra sola discreción.
              </p>
            </section>

            {/* Propiedad Intelectual */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 sm:text-3xl">Propiedad Intelectual</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Todo el contenido, diseño, funcionalidad, código, gráficos, logos, iconos, imágenes, textos, software 
                y otros materiales de CartaTech (colectivamente, el "Contenido del Servicio") son propiedad de CartaTech 
                o sus proveedores de contenido y están protegidos por leyes de propiedad intelectual, incluyendo derechos 
                de autor, marcas registradas, patentes y otras leyes de propiedad intelectual.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-2">
                <strong>No puedes:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-2">
                <li>Copiar, reproducir, distribuir, modificar, crear obras derivadas, mostrar públicamente o realizar ingeniería inversa del Contenido del Servicio sin nuestro permiso explícito por escrito</li>
                <li>Usar nuestras marcas, logos o nombres comerciales sin nuestro consentimiento previo</li>
                <li>Eliminar, alterar u ocultar cualquier aviso de derechos de autor, marca registrada u otra propiedad intelectual incluido en el servicio</li>
                <li>Usar el servicio para crear un producto o servicio competitivo</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                <strong>Nota sobre Mitos y Leyendas:</strong> El contenido relacionado con el juego Mitos y Leyendas, 
                incluyendo nombres de cartas, imágenes, reglas y otros elementos del juego, es propiedad de sus respectivos 
                dueños. CartaTech no reclama propiedad sobre este contenido y lo utiliza únicamente para fines informativos 
                y educativos relacionados con la construcción de mazos.
              </p>
            </section>

            {/* Conducta del Usuario */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 sm:text-3xl">Conducta del Usuario y Moderación</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                CartaTech se compromete a mantener una comunidad respetuosa y positiva. Esperamos que todos los usuarios 
                se comporten de manera civilizada y respetuosa hacia otros miembros de la comunidad. Está estrictamente 
                prohibido acosar, intimidar, amenazar o dañar a otros usuarios; publicar comentarios ofensivos, 
                discriminatorios o que inciten al odio; hacer spam o publicidad no autorizada; intentar manipular votos, 
                likes, vistas o cualquier métrica del sistema; usar múltiples cuentas para evadir restricciones o límites; 
                reportar falsamente contenido o usuarios; o interferir con el funcionamiento técnico del sitio.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                CartaTech tiene un sistema de moderación que incluye administradores y moderadores. Estos tienen la 
                autoridad de revisar, editar, eliminar contenido y tomar medidas disciplinarias, incluyendo la suspensión 
                o terminación de cuentas, cuando sea necesario para mantener la calidad y seguridad de la comunidad.
              </p>
            </section>

            {/* Limitación de Responsabilidad */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 sm:text-3xl">Limitación de Responsabilidad</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                CartaTech se proporciona "tal cual" y "según disponibilidad", sin garantías de ningún tipo, ya sean 
                expresas o implícitas. No garantizamos que el servicio esté libre de errores, interrupciones, defectos 
                o virus; que el servicio satisfaga tus requisitos específicos; que los resultados obtenidos del uso del 
                servicio sean precisos o confiables; que cualquier error en el servicio será corregido; o que el servicio 
                esté disponible de forma ininterrumpida o segura.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-2">
                En la medida máxima permitida por la ley aplicable, CartaTech, sus afiliados, directores, empleados, 
                agentes y proveedores de servicios no serán responsables de ningún daño directo, indirecto, incidental, 
                especial, consecuente o punitivo, incluyendo pero no limitado a pérdida de datos, información o contenido; 
                pérdida de beneficios, ingresos o oportunidades comerciales; interrupción del negocio; daños a la reputación; 
                o cualquier otro daño intangible.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Esta limitación de responsabilidad se aplica independientemente de la teoría legal en la que se base 
                la reclamación (contrato, agravio, negligencia u otra) y aunque CartaTech haya sido advertido de la 
                posibilidad de tales daños.
              </p>
            </section>

            {/* Modificaciones */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 sm:text-3xl">Modificaciones del Servicio</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Nos reservamos el derecho de modificar, actualizar, suspender, discontinuar o restringir cualquier 
                aspecto del servicio en cualquier momento, con o sin previo aviso, incluyendo agregar, modificar o eliminar 
                funcionalidades; cambiar la interfaz de usuario o el diseño; modificar políticas, términos o condiciones; 
                implementar límites de uso o restricciones; o realizar mantenimiento programado o de emergencia.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-2">
                No seremos responsables ante ti ni ante ningún tercero por cualquier modificación, suspensión o 
                discontinuación del servicio. Es tu responsabilidad hacer copias de seguridad de cualquier contenido 
                importante que hayas creado en la plataforma.
              </p>
            </section>

            {/* Terminación */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 sm:text-3xl">Terminación de Cuenta</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                <strong>Terminación por tu parte:</strong> Puedes terminar tu cuenta en cualquier momento eliminando 
                tu cuenta a través de la configuración de tu perfil o contactándonos directamente. Al terminar tu cuenta, 
                perderás acceso a todos los datos asociados con tu cuenta, aunque podemos conservar cierta información 
                según lo requerido por la ley o según se describe en nuestra Política de Privacidad.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-2">
                <strong>Terminación por nuestra parte:</strong> Nos reservamos el derecho de terminar o suspender tu 
                cuenta y acceso al servicio inmediatamente, sin previo aviso, por cualquier motivo, incluyendo pero no 
                limitado a violación de estos Términos de Servicio; uso fraudulento, abusivo o ilegal del servicio; 
                actividades que dañen o perjudiquen a otros usuarios o al servicio; inactividad prolongada de la cuenta; 
                requisitos legales o regulatorios; o razones de seguridad o protección de la comunidad.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-2">
                En caso de terminación, no tendrás derecho a ningún reembolso y podemos eliminar o retener tu contenido 
                según lo consideremos apropiado.
              </p>
            </section>

            {/* Ley Aplicable */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 sm:text-3xl">Ley Aplicable y Jurisdicción</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Estos Términos de Servicio se rigen e interpretan de acuerdo con las leyes de la República de Chile, 
                sin dar efecto a ningún principio de conflictos de leyes. Cualquier disputa, controversia o reclamación 
                que surja de o esté relacionada con estos términos o con el uso del servicio será resuelta exclusivamente 
                en los tribunales competentes de Chile, y tú y CartaTech aceptan someterse a la jurisdicción personal 
                de dichos tribunales.
              </p>
            </section>

            {/* Cambios en los Términos */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 sm:text-3xl">Cambios en los Términos</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Nos reservamos el derecho de modificar, actualizar o cambiar estos Términos de Servicio en cualquier 
                momento a nuestra sola discreción. Los cambios entrarán en vigor inmediatamente después de su publicación 
                en esta página. Te notificaremos sobre cambios significativos mediante publicación de los nuevos términos 
                en esta página con la fecha de "Última actualización" actualizada, notificación en la plataforma cuando 
                sea apropiado, o email a la dirección asociada con tu cuenta para cambios importantes.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Es tu responsabilidad revisar periódicamente estos términos para estar informado de cualquier cambio. 
                Tu uso continuado del servicio después de la publicación de cambios constituye tu aceptación de los 
                términos modificados. Si no estás de acuerdo con los cambios, debes dejar de usar el servicio y 
                terminar tu cuenta.
              </p>
            </section>

            {/* Disposiciones Generales */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 sm:text-3xl">Disposiciones Generales</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                <strong>Acuerdo completo:</strong> Estos términos, junto con nuestra Política de Privacidad, constituyen 
                el acuerdo completo entre tú y CartaTech respecto al uso del servicio y reemplazan todos los acuerdos 
                anteriores o contemporáneos.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-2">
                <strong>Divisibilidad:</strong> Si alguna disposición de estos términos se considera inválida o 
                inaplicable, las disposiciones restantes permanecerán en pleno vigor y efecto.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-2">
                <strong>Renuncia:</strong> El hecho de que CartaTech no ejerza o haga valer cualquier derecho o 
                disposición de estos términos no constituirá una renuncia a tal derecho o disposición.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                <strong>Transferencia:</strong> No puedes transferir o asignar estos términos o tus derechos bajo estos 
                términos sin nuestro consentimiento previo por escrito. CartaTech puede transferir o asignar estos términos 
                o nuestros derechos y obligaciones sin restricción.
              </p>
            </section>

            {/* Contacto */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 sm:text-3xl">Contacto y Soporte</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Si tienes preguntas, comentarios, inquietudes o solicitudes relacionadas con estos Términos de Servicio, 
                puedes contactarnos a través de{" "}
                <a
                  href="mailto:reiko.cartatech@gmail.com"
                  className="text-primary hover:underline"
                >
                  reiko.cartatech@gmail.com
                </a>
                .
              </p>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Nos comprometemos a responder a tus consultas en un plazo razonable y a trabajar contigo para resolver 
                cualquier problema que puedas tener con nuestro servicio.
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t">
            <Link href="/registro">
              <Button variant="outline" className="w-full sm:w-auto gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver al Registro
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
