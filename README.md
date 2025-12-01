# Carta Tech - MyL Deck Builder

Deck Builder para el TCG chileno Mitos y Leyendas en formato Primer Bloque. Construye, comparte y explora mazos de la comunidad.

## 🚀 Getting Started

### Desarrollo Local

Primero, instala las dependencias:

```bash
npm install
```

Luego, ejecuta el servidor de desarrollo:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver el resultado.

### Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
NEXT_PUBLIC_SITE_URL=https://cartatech.com
```

## 📦 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter

## 🚢 Deploy en Vercel

### Opción 1: Deploy Automático desde GitHub

1. **Preparar el repositorio:**
   - Asegúrate de que tu código esté en GitHub
   - Verifica que el directorio raíz del proyecto sea `cartatech` (si tu repo está en la raíz) o ajusta la configuración en Vercel

2. **Conectar con Vercel:**
   - Ve a [vercel.com](https://vercel.com) e inicia sesión
   - Haz clic en "Add New Project"
   - Importa tu repositorio de GitHub
   - Vercel detectará automáticamente que es un proyecto Next.js

3. **Configurar Variables de Entorno:**
   - En la configuración del proyecto, ve a "Environment Variables"
   - Agrega: `NEXT_PUBLIC_SITE_URL` con el valor de tu dominio (ej: `https://cartatech.com`)

4. **Configurar el Directorio Raíz (si es necesario):**
   - Si tu proyecto Next.js está en la carpeta `cartatech`, en "Root Directory" selecciona `cartatech`
   - O configura el "Build Command" como: `cd cartatech && npm run build`
   - Y el "Output Directory" como: `cartatech/.next`

5. **Deploy:**
   - Haz clic en "Deploy"
   - Vercel construirá y desplegará tu aplicación automáticamente

### Opción 2: Deploy Manual con Vercel CLI

```bash
# Instalar Vercel CLI globalmente
npm i -g vercel

# Desde el directorio del proyecto
cd cartatech

# Iniciar deploy
vercel

# Para producción
vercel --prod
```

### Configuración Recomendada en Vercel

- **Framework Preset:** Next.js
- **Build Command:** `npm run build` (o `cd cartatech && npm run build` si el repo está en la raíz)
- **Output Directory:** `.next` (o `cartatech/.next`)
- **Install Command:** `npm install`
- **Node.js Version:** 20.x o superior

### Variables de Entorno en Vercel

Asegúrate de configurar estas variables en el dashboard de Vercel:

- `NEXT_PUBLIC_SITE_URL` - URL completa de tu sitio (ej: `https://cartatech.com`)

## 🛠️ Tecnologías

- **Next.js 16** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS 4** - Estilos
- **Shadcn UI / Radix UI** - Componentes UI
- **React 19** - Biblioteca UI
- **Sonner** - Notificaciones toast

## 📝 Notas

- El proyecto usa localStorage para la autenticación en el cliente
- Las imágenes se cargan desde Cloudinary
- El proyecto está optimizado para SEO y accesibilidad
- Compatible con pantallas desde móviles hasta 1920x1080px

## 📚 Recursos

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
