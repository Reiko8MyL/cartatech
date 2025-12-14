import type { Metadata } from "next";
import Link from "next/link";
import { generateMetadata as genMeta } from "@/lib/metadata";
import { Footer } from "@/components/home/footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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
          <div className="mb-6">
            <Link href="/registro">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver al Registro
              </Button>
            </Link>
          </div>

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
              <h2 className="text-2xl font-semibold mb-4 sm:text-3xl">Introducción</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Bienvenido a <strong>CartaTech</strong>. Esta Política de Privacidad describe detalladamente cómo 
                recopilamos, usamos, almacenamos, protegemos y compartimos la información personal que nos proporcionas 
                cuando utilizas nuestro sitio web y servicios.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Tu privacidad es importante para nosotros. Nos comprometemos a proteger tu información personal y a 
                ser transparentes sobre nuestras prácticas de privacidad. Al acceder y utilizar CartaTech, aceptas 
                las prácticas descritas en esta política.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Si no estás de acuerdo con alguna parte de esta política, por favor no utilices nuestro servicio. 
                Te recomendamos leer esta política completa para entender cómo manejamos tu información.
              </p>
            </section>

            {/* Recopilación de datos */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 sm:text-3xl">Información que Recopilamos</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Recopilamos diferentes tipos de información para proporcionar, mejorar y personalizar nuestros servicios.
              </p>
              
              <h3 className="text-xl font-semibold mb-2 mt-4">Información que Proporcionas Directamente</h3>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-2">
                <li>
                  <strong>Información de cuenta:</strong> Cuando creas una cuenta, recopilamos tu nombre de usuario, 
                  dirección de correo electrónico y contraseña (que almacenamos de forma encriptada usando bcrypt con 12 rounds de hashing).
                </li>
                <li>
                  <strong>Contenido que creas:</strong> Los mazos que construyes, guardas y publicas, incluyendo nombres, 
                  descripciones, cartas seleccionadas, formatos y etiquetas.
                </li>
                <li>
                  <strong>Interacciones sociales:</strong> Comentarios que publicas, respuestas a comentarios, mazos que marcas 
                  como favoritos, likes que das, y votos que realizas.
                </li>
                <li>
                  <strong>Colección personal:</strong> Si utilizas el modo coleccionista, almacenamos información sobre las 
                  cartas que has marcado como coleccionadas y sus cantidades.
                </li>
                <li>
                  <strong>Comunicaciones:</strong> Cualquier información que nos envíes cuando contactas con nuestro soporte 
                  o nos envías comentarios.
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-2 mt-4">Información Recopilada Automáticamente</h3>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-2">
                <li>
                  <strong>Datos de navegación:</strong> Información sobre cómo interactúas con nuestro sitio, incluyendo 
                  páginas visitadas, tiempo de permanencia, enlaces en los que haces clic, y patrones de navegación.
                </li>
                <li>
                  <strong>Información del dispositivo:</strong> Tipo de dispositivo, sistema operativo, navegador web, 
                  resolución de pantalla, y configuración de idioma.
                </li>
                <li>
                  <strong>Dirección IP:</strong> Recopilamos tu dirección IP para propósitos de seguridad, prevención 
                  de fraude, y análisis de uso.
                </li>
                <li>
                  <strong>Cookies y tecnologías similares:</strong> Utilizamos cookies, píxeles, web beacons y otras 
                  tecnologías de seguimiento para mejorar tu experiencia, analizar el tráfico del sitio, personalizar 
                  el contenido y mostrar publicidad relevante.
                </li>
                <li>
                  <strong>Datos de uso:</strong> Información sobre cómo utilizas nuestras funcionalidades, como los mazos 
                  que visualizas, los que compartes, y las búsquedas que realizas.
                </li>
                <li>
                  <strong>Logs del servidor:</strong> Información técnica sobre tus solicitudes al servidor, incluyendo 
                  timestamps, URLs accedidas, y códigos de respuesta HTTP.
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-2 mt-4">Información de Terceros</h3>
              <p className="text-muted-foreground leading-relaxed">
                Podemos recibir información sobre ti de proveedores de servicios de terceros, como servicios de análisis 
                (Google Analytics) y servicios de publicidad (Google AdSense), que nos ayudan a entender cómo los 
                usuarios interactúan con nuestro sitio.
              </p>
            </section>

            {/* Uso de la información */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 sm:text-3xl">Cómo Utilizamos tu Información</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Utilizamos la información recopilada para diversos propósitos legítimos relacionados con la operación, 
                mejora y personalización de nuestros servicios.
              </p>
              
              <h3 className="text-xl font-semibold mb-2 mt-4">Provisión y Mejora del Servicio</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Utilizamos tu información para proporcionar, mantener, operar y mejorar nuestros servicios; procesar y 
                completar tus solicitudes y transacciones; permitirte crear, guardar, editar y compartir mazos; facilitar 
                la interacción social entre usuarios (comentarios, likes, favoritos); personalizar tu experiencia en el sitio 
                según tus preferencias; desarrollar nuevas funcionalidades y características; y realizar análisis y investigación 
                para mejorar nuestros servicios.
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">Comunicación</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Enviamos notificaciones sobre interacciones en tus mazos (comentarios, likes, respuestas); proporcionamos 
                soporte técnico y respondemos a tus consultas; enviamos comunicaciones importantes sobre cambios en nuestros 
                términos o políticas; enviamos actualizaciones sobre nuevas funcionalidades o mejoras del servicio; y nos 
                comunicamos contigo sobre tu cuenta o uso del servicio.
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">Seguridad y Prevención de Fraude</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Utilizamos tu información para detectar, prevenir y abordar problemas técnicos, de seguridad o fraude; 
                proteger los derechos, propiedad o seguridad de CartaTech, nuestros usuarios o terceros; verificar tu identidad 
                y prevenir acceso no autorizado a tu cuenta; e implementar medidas de seguridad y rate limiting para proteger 
                contra abuso.
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">Análisis y Publicidad</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Analizamos el uso del sitio para entender cómo los usuarios interactúan con nuestros servicios; medimos la 
                efectividad de nuestras funcionalidades y contenido; mostramos publicidad relevante y personalizada (a través 
                de Google AdSense); y generamos estadísticas agregadas y anónimas sobre el uso del servicio.
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">Cumplimiento Legal</h3>
              <p className="text-muted-foreground leading-relaxed">
                Utilizamos tu información para cumplir con obligaciones legales, regulatorias o de cumplimiento; responder a 
                solicitudes legales válidas de autoridades gubernamentales; hacer cumplir nuestros términos de servicio y políticas; 
                y proteger nuestros derechos legales y los de nuestros usuarios.
              </p>
            </section>

            {/* Cookies y tecnologías de seguimiento */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 sm:text-3xl">Cookies y Tecnologías de Seguimiento</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Utilizamos cookies y tecnologías similares para mejorar tu experiencia, analizar el uso del sitio y 
                mostrar publicidad relevante. Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo 
                cuando visitas nuestro sitio.
              </p>
              
              <h3 className="text-xl font-semibold mb-2 mt-4">Tipos de Cookies que Utilizamos</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Utilizamos cookies esenciales necesarias para el funcionamiento básico del sitio, como mantener tu sesión 
                iniciada y recordar tus preferencias. También utilizamos cookies de funcionalidad que permiten que el sitio 
                recuerde tus elecciones (como idioma o región) para proporcionar características mejoradas y personalizadas. 
                Las cookies de análisis nos ayudan a entender cómo los visitantes interactúan con el sitio, proporcionando 
                información sobre las áreas visitadas, el tiempo de permanencia y cualquier problema encontrado. Finalmente, 
                utilizamos cookies de publicidad para mostrar anuncios relevantes y medir la efectividad de las campañas publicitarias.
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">Google AdSense y Publicidad</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                <strong>CartaTech utiliza Google AdSense, un servicio de publicidad proporcionado por Google LLC.</strong> 
                Google AdSense utiliza cookies y tecnologías similares para mostrar anuncios relevantes basados en tus 
                intereses y actividad de navegación previa; medir la efectividad de los anuncios y optimizar la experiencia 
                publicitaria; limitar la cantidad de veces que ves un anuncio específico; y proporcionar informes agregados 
                sobre el rendimiento de los anuncios.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-2">
                <strong>El uso de cookies de publicidad permite a Google y a sus socios mostrar anuncios basados en la 
                navegación del usuario en nuestro sitio y en otros sitios web.</strong> Estas cookies recopilan información 
                sobre tus visitas a este y otros sitios web para proporcionarte anuncios sobre productos y servicios 
                que puedan ser de tu interés. Google y sus socios utilizan cookies de publicidad (como las cookies de 
                DoubleClick) para personalizar anuncios, medir interacciones, proporcionar informes de rendimiento y evitar 
                mostrar anuncios duplicados.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                <strong>Control de Cookies:</strong> Puedes gestionar tus preferencias de cookies a través de la 
                configuración de tu navegador. También puedes optar por no recibir publicidad personalizada de Google 
                visitando la{" "}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  página de Configuración de anuncios de Google
                </a>
                {" "}o{" "}
                <a
                  href="https://www.google.com/policies/technologies/ads/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  las políticas de cookies de Google
                </a>
                . Ten en cuenta que desactivar ciertas cookies puede afectar la funcionalidad de nuestro sitio.
              </p>
            </section>

            {/* Compartir información */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 sm:text-3xl">Compartir Información con Terceros</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                <strong>No vendemos, alquilamos ni comercializamos tu información personal a terceros.</strong> Sin 
                embargo, podemos compartir información en ciertas circunstancias.
              </p>
              
              <h3 className="text-xl font-semibold mb-2 mt-4">Proveedores de Servicios</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Compartimos información con proveedores de servicios de confianza que nos ayudan a operar nuestro sitio 
                y proporcionar nuestros servicios. Esto incluye servicios de hosting y almacenamiento como Vercel (hosting), 
                PostgreSQL (base de datos), y Cloudinary (almacenamiento de imágenes); servicios de análisis como Google 
                Analytics para analizar el uso del sitio y mejorar nuestros servicios; servicios de publicidad como Google 
                AdSense para mostrar anuncios relevantes; y servicios de monitoreo como Vercel Analytics y Speed Insights 
                para monitorear el rendimiento del sitio.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Estos proveedores de servicios están contractualmente obligados a proteger tu información y solo pueden 
                usarla para los fines específicos para los que la proporcionamos.
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">Cumplimiento Legal y Protección</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Podemos divulgar información si creemos de buena fe que es necesario para cumplir con una obligación legal, 
                proceso legal o solicitud gubernamental válida; hacer cumplir nuestros términos de servicio y políticas; 
                proteger los derechos, propiedad o seguridad de CartaTech, nuestros usuarios o terceros; detectar, prevenir 
                o abordar problemas de seguridad, fraude o abuso técnico; o responder a una emergencia que creemos que 
                requiere divulgación para prevenir daños físicos o financieros.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">Con tu Consentimiento</h3>
              <p className="text-muted-foreground leading-relaxed">
                Compartimos información cuando nos das tu consentimiento explícito para hacerlo. Por ejemplo, si eliges 
                compartir un mazo públicamente, esa información será visible para otros usuarios.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">Transferencias de Negocio</h3>
              <p className="text-muted-foreground leading-relaxed">
                En el caso de una fusión, adquisición, reorganización, quiebra u otra transacción de venta o transferencia 
                de activos, tu información puede ser transferida como parte de esa transacción. Te notificaremos de 
                cualquier cambio en la propiedad o uso de tu información personal.
              </p>
            </section>

            {/* Seguridad */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 sm:text-3xl">Seguridad de tus Datos</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                La seguridad de tu información personal es una prioridad para nosotros. Implementamos medidas de seguridad 
                técnicas, administrativas y físicas apropiadas para proteger tu información contra acceso no autorizado, 
                alteración, divulgación o destrucción.
              </p>
              
              <h3 className="text-xl font-semibold mb-2 mt-4">Medidas de Seguridad Técnicas</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Todas las contraseñas se almacenan usando bcrypt con 12 rounds de hashing, lo que hace prácticamente 
                imposible recuperar la contraseña original incluso si alguien accede a nuestra base de datos. Utilizamos 
                HTTPS (SSL/TLS) para encriptar todas las comunicaciones entre tu navegador y nuestros servidores. Validamos 
                y sanitizamos todos los datos de entrada para prevenir inyecciones SQL, XSS y otros ataques de seguridad. 
                Implementamos límites de velocidad en nuestras APIs para prevenir abuso y ataques de fuerza bruta. Configuramos 
                headers de seguridad HTTP (X-Content-Type-Options, X-Frame-Options) para proteger contra ciertos tipos de 
                ataques. Realizamos copias de seguridad regulares de nuestros datos para prevenir pérdida de información.
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">Medidas de Seguridad Administrativas</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Restringimos el acceso a información personal solo para personal autorizado que necesita acceder para realizar 
                su trabajo. Proporcionamos capacitación regular del personal sobre prácticas de seguridad y privacidad. 
                Implementamos políticas estrictas de contraseñas y autenticación para el personal. Realizamos monitoreo regular 
                de sistemas para detectar actividades sospechosas.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">Limitaciones de Seguridad</h3>
              <p className="text-muted-foreground leading-relaxed">
                Aunque implementamos medidas de seguridad robustas, ningún método de transmisión por Internet o almacenamiento 
                electrónico es 100% seguro. No podemos garantizar una seguridad absoluta de tu información. Te recomendamos 
                que uses una contraseña única y segura, no compartas tus credenciales con nadie, y cierres sesión cuando uses 
                dispositivos compartidos.
              </p>
            </section>

            {/* Retención de datos */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 sm:text-3xl">Retención de Datos</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Conservamos tu información personal durante el tiempo necesario para cumplir con los propósitos descritos 
                en esta política, a menos que la ley requiera o permita un período de retención más largo. Conservamos 
                tu información de cuenta mientras tu cuenta esté activa y durante un período razonable después de que la 
                cierres, para cumplir con obligaciones legales y resolver disputas. Si publicas contenido (como mazos públicos 
                o comentarios), podemos conservar ese contenido incluso después de que cierres tu cuenta, a menos que solicites 
                específicamente su eliminación. Conservamos datos agregados y anónimos de uso para análisis y mejora del servicio 
                de forma indefinida. Conservamos logs del servidor y registros de seguridad por períodos limitados según sea 
                necesario para seguridad y cumplimiento legal.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Cuando elimines tu cuenta, eliminaremos o anonimizaremos tu información personal identificable, excepto 
                cuando la ley requiera que la conservemos (por ejemplo, para cumplir con obligaciones legales, resolver 
                disputas o hacer cumplir nuestros acuerdos).
              </p>
            </section>

            {/* Derechos del usuario */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 sm:text-3xl">Tus Derechos y Opciones</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Tienes varios derechos respecto a tu información personal. Estamos comprometidos a respetar estos derechos 
                y a ayudarte a ejercerlos.
              </p>
              
              <h3 className="text-xl font-semibold mb-2 mt-4">Derechos de Acceso y Control</h3>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-2">
                <li>
                  <strong>Acceso:</strong> Puedes acceder y ver la información personal que tenemos sobre ti a través 
                  de tu perfil de usuario. También puedes solicitar una copia completa de tus datos personales.
                </li>
                <li>
                  <strong>Rectificación:</strong> Puedes corregir, actualizar o modificar tu información personal en 
                  cualquier momento a través de la configuración de tu cuenta o contactándonos directamente.
                </li>
                <li>
                  <strong>Eliminación:</strong> Puedes solicitar la eliminación de tu cuenta y datos personales en 
                  cualquier momento. Procesaremos tu solicitud de acuerdo con nuestras políticas de retención y 
                  obligaciones legales.
                </li>
                <li>
                  <strong>Portabilidad:</strong> Puedes solicitar una copia de tus datos en un formato estructurado y 
                  de uso común para transferirlos a otro servicio.
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-2 mt-4">Derechos de Oposición y Restricción</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Puedes oponerte al procesamiento de tus datos personales en ciertas circunstancias, como cuando se procesan 
                para marketing directo. Puedes solicitar que restrinjamos el procesamiento de tu información personal en ciertas 
                situaciones. Si has dado tu consentimiento para el procesamiento de tus datos, puedes retirarlo en cualquier momento.
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">Control de Publicidad y Cookies</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                <strong>Desactivar publicidad personalizada:</strong> Puedes desactivar la publicidad personalizada de 
                Google visitando la{" "}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  página de Configuración de anuncios de Google
                </a>
                {" "}o{" "}
                <a
                  href="https://www.google.com/policies/technologies/ads/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  las políticas de cookies de Google
                </a>
                . Puedes gestionar las cookies en tu navegador a través de la configuración de preferencias. La mayoría 
                de los navegadores te permiten rechazar o aceptar cookies, o recibir una notificación antes de que se almacene 
                una cookie. Ten en cuenta que desactivar ciertas cookies puede afectar la funcionalidad de nuestro sitio.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">Ejercer tus Derechos</h3>
              <p className="text-muted-foreground leading-relaxed">
                Para ejercer cualquiera de estos derechos, puedes contactarnos a través del email proporcionado al final 
                de esta política. Responderemos a tu solicitud dentro de un plazo razonable y de acuerdo con la ley aplicable. 
                Podemos solicitar información adicional para verificar tu identidad antes de procesar tu solicitud.
              </p>
            </section>

            {/* Privacidad de menores */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 sm:text-3xl">Privacidad de Menores</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                CartaTech no está dirigido intencionalmente a menores de edad. No recopilamos conscientemente información 
                personal de menores sin el consentimiento de los padres o tutores legales. Si descubrimos que hemos recopilado 
                información personal de un menor sin el consentimiento apropiado, tomaremos medidas para eliminar esa información 
                de nuestros servidores lo antes posible. Si eres padre o tutor y crees que tu hijo nos ha proporcionado información 
                personal, por favor contáctanos inmediatamente.
              </p>
            </section>

            {/* Transferencias internacionales */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 sm:text-3xl">Transferencias Internacionales de Datos</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Tu información puede ser transferida y procesada en países distintos al tuyo. Nuestros proveedores de 
                servicios pueden estar ubicados en diferentes jurisdicciones. Vercel (servicios de hosting y análisis) puede 
                estar ubicado en Estados Unidos y otras jurisdicciones. Google (servicios de análisis y publicidad) está 
                operado por Google LLC, que puede procesar datos en múltiples países. Cloudinary (servicios de almacenamiento 
                de imágenes) puede estar ubicado en diferentes regiones.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Al utilizar nuestro servicio, consientes la transferencia de tu información a estos países. Nos aseguramos 
                de que cualquier transferencia internacional de datos se realice de acuerdo con las leyes de protección 
                de datos aplicables y con las salvaguardas apropiadas.
              </p>
            </section>

            {/* Cambios a la política */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 sm:text-3xl">Cambios a esta Política de Privacidad</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Podemos actualizar esta Política de Privacidad ocasionalmente para reflejar cambios en nuestras prácticas, 
                servicios, requisitos legales u otros factores. Cuando realicemos cambios significativos, te notificaremos 
                mediante publicación de la política actualizada en esta página con la fecha de "Última actualización" modificada, 
                notificación prominente en nuestro sitio web cuando sea apropiado, o email a la dirección asociada con tu cuenta 
                para cambios importantes que afecten tus derechos.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Te recomendamos que revises esta política periódicamente para estar informado sobre cómo protegemos tu 
                información. Tu uso continuado del servicio después de la publicación de cambios constituye tu aceptación 
                de la política modificada.
              </p>
            </section>

            {/* Contacto */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 sm:text-3xl">Contacto y Ejercicio de Derechos</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Si tienes preguntas, inquietudes, solicitudes o comentarios relacionados con esta Política de Privacidad, 
                el tratamiento de tus datos personales, o si deseas ejercer tus derechos de privacidad, puedes contactarnos 
                a través de{" "}
                <a
                  href="mailto:reiko.cartatech@gmail.com"
                  className="text-primary hover:underline"
                >
                  reiko.cartatech@gmail.com
                </a>
                .
              </p>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Nos comprometemos a responder a tus consultas y solicitudes de manera oportuna y de acuerdo con la ley 
                aplicable. Si no estás satisfecho con nuestra respuesta, también tienes el derecho de presentar una 
                queja ante la autoridad de protección de datos competente en tu jurisdicción.
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
