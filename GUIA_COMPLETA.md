# 📚 Guía Completa - CartaTech

Esta guía consolida todas las instrucciones y documentación del proyecto CartaTech. Está organizada por temas para facilitar la consulta.

---

## 📋 Tabla de Contenidos

1. [Configuración Inicial y Deploy](#1-configuración-inicial-y-deploy)
2. [Base de Datos y Prisma](#2-base-de-datos-y-prisma)
3. [Vercel y Hosting](#3-vercel-y-hosting)
4. [Monetización y Analytics](#4-monetización-y-analytics)
5. [Diagnóstico y Solución de Problemas](#5-diagnóstico-y-solución-de-problemas)
6. [Estado del Proyecto](#6-estado-del-proyecto)

---

## 1. Configuración Inicial y Deploy

### 1.1 Deploy en Vercel

#### Pasos Rápidos

1. **Subir código a GitHub:**
```bash
cd cartatech
git add .
git commit -m "Preparar para deploy"
git push origin main
```

2. **Conectar con Vercel:**
   - Ve a https://vercel.com
   - Crea cuenta con GitHub
   - Haz clic en "Add New Project"
   - Selecciona el repositorio "cartatech"
   - Haz clic en "Import"

3. **Configurar Variables de Entorno:**
   - En Settings → Environment Variables, agrega:
     - `NEXT_PUBLIC_SITE_URL` = `https://www.cartatech.cl` (o tu dominio)
     - `DATABASE_URL` = Tu connection string de PostgreSQL
     - `NEXT_PUBLIC_ADSENSE_ID` = `ca-pub-...` (si aplica)
     - `NEXT_PUBLIC_GA_ID` = `G-...` (si aplica)
   - Marca todas las opciones: Production, Preview, Development

4. **Deploy:**
   - Haz clic en "Deploy"
   - Espera 2-5 minutos
   - ¡Listo! Tu sitio estará en línea

#### Configuración de Build

**No necesitas cambiar nada** - Vercel detecta automáticamente Next.js:
- Build Command: `npm run build` (auto-detectado)
- Output Directory: `.next` (auto-detectado)
- Install Command: `npm install` (auto-detectado)

#### Actualizar el Sitio

Cada vez que hagas cambios:
```bash
git add .
git commit -m "Descripción de cambios"
git push origin main
```

Vercel automáticamente hará el deploy.

### 1.2 URLs y Dominios

- **URL de Producción:** https://www.cartatech.cl/
- **URL de Vercel:** https://cartatech.vercel.app/
- **Dashboard:** https://vercel.com/dashboard

---

## 2. Base de Datos y Prisma

### 2.1 Configurar Vercel Postgres

#### Pasos Rápidos

1. **Obtener Connection String:**
   - Ve a Vercel → Tu proyecto → **Storage**
   - Crea una base de datos **Postgres** (o usa la existente)
   - Copia la **Connection String** o usa `POSTGRES_PRISMA_URL` de Environment Variables

2. **Configurar Variables:**
   - **En Vercel:** Ya está configurada automáticamente como `POSTGRES_PRISMA_URL`
   - **Localmente:** Crea `.env` en `cartatech/`:
     ```env
     POSTGRES_PRISMA_URL="postgres://default:xxxxx@xxxxx.vercel-storage.com:5432/verceldb?pgbouncer=true&connect_timeout=15"
     ```

3. **Generar Cliente Prisma:**
```bash
cd cartatech
npx prisma generate
```

4. **Crear Tablas:**
```bash
npx prisma db push
```

5. **Verificar:**
```bash
npx prisma studio
```

### 2.2 Comandos de Prisma

#### Comandos Básicos

```bash
# Generar cliente Prisma
npx prisma generate

# Crear tablas en la base de datos
npx prisma db push

# Ver base de datos en navegador
npx prisma studio

# Ver estado de migraciones
npx prisma migrate status

# Crear migración
npx prisma migrate dev --name nombre_migracion
```

#### Dónde Ejecutar

1. Abre la terminal (PowerShell, CMD, o Terminal integrada)
2. Navega al directorio:
   ```powershell
   cd C:\Users\crist\OneDrive\Escritorio\CartaTech\cartatech
   ```
3. Ejecuta los comandos

### 2.3 Ver la Base de Datos

#### Opción 1: Prisma Studio (Recomendado)

```bash
npx prisma studio
```

Se abrirá en `http://localhost:5555` - Interfaz visual para ver y editar datos.

#### Opción 2: Vercel Dashboard

1. Ve a Vercel → Tu proyecto → **Storage** → Tu base de datos
2. Usa el **Editor SQL** para ejecutar queries

#### Opción 3: Cliente de Base de Datos

- **pgAdmin:** https://www.pgadmin.org/download/
- **DBeaver:** https://dbeaver.io/download/

### 2.4 Solución de Problemas Comunes

#### Error: "Drift detected"

Si Prisma detecta tablas que no están en el historial de migraciones:

**NO ejecutes `prisma migrate reset`** (borraría todos los datos)

**Solución:**
```bash
# Opción 1: Crear migración baseline
mkdir prisma\migrations\0_init
echo "-- Baseline migration" > prisma\migrations\0_init\migration.sql
npx prisma migrate resolve --applied 0_init

# Opción 2: Sincronizar schema
npx prisma db pull
npx prisma migrate dev --name add_cambios
```

#### Error: "Can't reach database server"

1. Verifica que `DATABASE_URL` o `POSTGRES_PRISMA_URL` esté correcta
2. Verifica que no tenga espacios extra
3. Verifica que esté entre comillas dobles en `.env`

#### Error: "Prisma Client has not been generated"

```bash
npx prisma generate
```

### 2.5 Estado de Migración

#### ✅ Completado

- ✅ Esquema de Prisma completo
- ✅ APIs implementadas: `/api/auth/*`, `/api/decks/*`, `/api/favorites/*`, `/api/likes/*`, `/api/votes/*`, `/api/collection/*`
- ✅ Funcionalidades migradas: Mazos, Favoritos, Likes, Vistas, Votos, Colección
- ✅ Fallback a localStorage para usuarios no autenticados

#### 🔄 Pendiente

- Autenticación: NextAuth instalado pero no implementado (actualmente usa sistema personalizado)
- Algunos componentes aún usan funciones de localStorage directamente (pero tienen fallback automático)

---

## 3. Vercel y Hosting

### 3.1 Usar Vercel Dashboard

#### Ver Deployments

1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto "cartatech"
3. Ve a la pestaña **"Deployments"**
4. Cada deployment muestra:
   - Estado: "Ready", "Building", "Error"
   - Fecha y hora
   - Mensaje del commit
   - URL del deployment

#### Ver Logs

1. En el dashboard, ve a **"Logs"** o **"Functions"**
2. O desde un deployment → **"Function Logs"**
3. Filtra por función, nivel de error, fecha/hora

#### Ver Analytics

1. Ve a **"Analytics"** en el dashboard
2. Verás:
   - Visitas y visitantes únicos
   - Páginas más visitadas
   - Tiempo de carga
   - Errores

### 3.2 Preview Deployments

Cuando haces `git push` a una rama que NO es `main`, Vercel crea un **Preview Deployment**:

- ✅ Puedes probar cambios sin afectar producción
- ✅ Cada Pull Request tiene su propia URL
- ✅ Puedes compartir la URL para revisar

### 3.3 Configuración del Proyecto

En **Settings** encontrarás:

- **General:** Nombre, Framework, Build Command
- **Environment Variables:** Variables de entorno
- **Domains:** Dominios configurados
- **Storage:** Bases de datos conectadas

### 3.4 Flujo de Trabajo Recomendado

1. **Desarrollo Local:**
   ```bash
   npm run dev
   ```

2. **Commit y Push:**
   ```bash
   git add .
   git commit -m "feat: nueva funcionalidad"
   git push origin main
   ```

3. **Vercel Automáticamente:**
   - Detecta el push
   - Compila la aplicación
   - Despliega a producción

4. **Revisa en Vercel:**
   - Ve al dashboard
   - Espera a que el deployment esté "Ready"
   - Revisa los logs si hay errores

---

## 4. Monetización y Analytics

### 4.1 Configurar Google AdSense

#### Paso 1: Crear Cuenta de AdSense para Sitios Web

**⚠️ IMPORTANTE:** AdSense para YouTube es diferente de AdSense para sitios web. Necesitas crear una cuenta NUEVA.

1. Ve a: https://www.google.com/adsense/start/
2. Haz clic en "Comenzar"
3. Inicia sesión con tu cuenta de Google
4. Selecciona **"Sitio web"** (NO YouTube)
5. Ingresa la URL: `https://www.cartatech.cl`
6. Completa el formulario (País: Chile, etc.)
7. Acepta términos y condiciones

#### Paso 2: Obtener ID de Cliente

**¿Dónde encontrarlo?**
- Al crear la cuenta, Google te lo muestra inmediatamente
- O ve a AdSense → Configuración → Cuenta → "ID del editor"
- Formato: `ca-pub-XXXXXXXXXXXXXXXX`

#### Paso 3: Verificar tu Sitio

**Opción A: Meta Tag (Recomendado)**

1. Google te dará un código:
   ```html
   <meta name="google-adsense-account" content="ca-pub-XXXXXXXXXXXXXXXX">
   ```

2. **Configura en Vercel:**
   - Ve a Settings → Environment Variables
   - Agrega: `NEXT_PUBLIC_ADSENSE_ID` = `ca-pub-XXXXXXXXXXXXXXXX`
   - Marca: Production, Preview, Development
   - Guarda

3. **El meta tag se agregará automáticamente** (ya está configurado en el código)

4. **Vuelve a AdSense** y haz clic en "Verificar sitio"

#### Paso 4: Esperar Aprobación

- **Tiempo:** 1-7 días
- **Durante este tiempo:** Los anuncios no aparecerán
- **Una vez aprobada:** Los anuncios aparecerán automáticamente

### 4.2 Ubicación de Anuncios

Tu sitio tiene **3 posiciones** para anuncios:

1. **Banner Superior:**
   - Arriba de todo, después del navbar
   - Visible en TODAS las páginas
   - Desktop: 728x90px | Móvil: 320x50px

2. **Sidebar (Lateral):**
   - Lado derecho, fijo
   - Solo en DESKTOP (>1024px)
   - Solo en `/mazos-comunidad`
   - 300px de ancho

3. **Inline (Entre contenido):**
   - Entre mazos en listados
   - Cada 6 mazos (después del mazo 6, 12, 18, etc.)
   - Solo en `/mazos-comunidad` en vista grid
   - Centrado, responsive

### 4.3 Configurar Google Analytics

#### Paso 1: Crear Cuenta

1. Ve a: https://analytics.google.com/
2. Haz clic en "Comenzar"
3. Crea una cuenta:
   - Nombre: `CartaTech`
   - Propiedad: `cartatech.cl`
   - Zona horaria: `(GMT-03:00) Santiago`
   - Moneda: `CLP`

#### Paso 2: Obtener ID de Medición

1. Ve a Administración → Propiedades → Flujo de datos → Web
2. Busca **"ID de medición"** o **"Measurement ID"**
3. Formato: `G-XXXXXXXXXX`

#### Paso 3: Configurar en Vercel

1. Ve a Settings → Environment Variables
2. Agrega: `NEXT_PUBLIC_GA_ID` = `G-XXXXXXXXXX`
3. Marca: Production, Preview, Development
4. Guarda

#### Paso 4: Verificar

1. Espera 24-48 horas para ver datos
2. Ve a Analytics → Informes → Tiempo real
3. Si ves visitantes, ¡está funcionando!

### 4.4 Configurar Vercel Analytics

#### Habilitar en Dashboard

1. Ve a Vercel → Tu proyecto → **"Analytics"**
2. Activa **"Web Analytics"**
3. Activa **"Speed Insights"**

#### Verificar en Código

Ya está configurado en `app/layout.tsx`:
```typescript
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

<Analytics />
<SpeedInsights />
```

#### Ver Datos

- **Analytics:** Visitas, páginas más visitadas, referrers, países, dispositivos
- **Speed Insights:** LCP, FID, CLS, FCP, TTFB

---

## 5. Diagnóstico y Solución de Problemas

### 5.1 Diagnóstico de AdSense

#### Meta Tag No Aparece

1. **Verificar Variable en Vercel:**
   - Settings → Environment Variables
   - Busca `NEXT_PUBLIC_ADSENSE_ID`
   - Verifica que el valor sea correcto (sin espacios)
   - Verifica que esté marcado para **Production**

2. **Forzar Redeploy:**
   - Ve a Deployments
   - Haz clic en los 3 puntos (⋯) del último deploy
   - Selecciona **"Redeploy"**
   - Espera 2-3 minutos

3. **Verificar en el Sitio:**
   - Espera 1-2 minutos adicionales
   - Visita: https://www.cartatech.cl
   - Haz Hard Refresh: `Ctrl + Shift + R`
   - Verifica código fuente: `Ctrl + U` → Busca `google-adsense-account`

### 5.2 Diagnóstico de Login

#### No Puedo Iniciar Sesión

1. **Verificar Variables de Entorno:**
   - Ve a Vercel → Settings → Environment Variables
   - Verifica que `DATABASE_URL` esté configurada
   - Verifica que esté en todos los entornos

2. **Verificar Base de Datos:**
   - Usa Prisma Studio: `npx prisma studio`
   - Verifica que la tabla `users` exista
   - Verifica que haya usuarios registrados

3. **Revisar Logs:**
   - Ve a Vercel → Logs
   - Busca errores relacionados con: `DATABASE_URL`, `Prisma`, `login`

4. **Probar Registro:**
   - Si el registro funciona, el problema es específico del login
   - Si el registro falla, el problema es más general (BD, conexión, etc.)

### 5.3 Revisar Logs del Servidor

#### En Desarrollo Local

1. Abre la terminal donde corre `npm run dev`
2. Los errores aparecen automáticamente cuando ocurren
3. Busca mensajes con "Error", "✗", o códigos de Prisma (P2002, P2025, etc.)

#### En Producción (Vercel)

1. Ve a Vercel → Tu proyecto → **"Logs"**
2. Filtra por:
   - Función (ej: `/api/decks`)
   - Nivel (Error, Warning, Info)
   - Fecha/hora

#### Tipos de Errores Comunes

- **Prisma P2002:** Violación de constraint único (usuario duplicado)
- **Prisma P2003:** Foreign key constraint failed
- **Prisma P2025:** Registro no encontrado
- **Next.js:** Route no existe, Module not found

### 5.4 Problemas Comunes

#### El sitio no carga

1. Revisa el estado del deployment (¿está en "Ready" o "Error"?)
2. Revisa los logs en Vercel
3. Verifica variables de entorno

#### Los cambios no aparecen

1. Espera unos minutos (deploy puede tardar 1-3 minutos)
2. Limpia la caché: `Ctrl + Shift + R` o modo incógnito
3. Verifica que el push fue exitoso en GitHub

#### Errores de base de datos

1. Revisa la connection string en Vercel
2. Revisa los logs de Prisma
3. Verifica que las tablas existan (usa Prisma Studio)

---

## 6. Estado del Proyecto

### 6.1 Información General

- **URL de Producción:** https://www.cartatech.cl/
- **Plataforma:** Vercel
- **Framework:** Next.js 16.0.5 (App Router)
- **Base de Datos:** PostgreSQL con Prisma
- **Estado:** ✅ En producción y funcionando

### 6.2 Funcionalidades Implementadas

#### ✅ Autenticación
- Registro de usuarios con validación de edad
- Login con contraseñas hasheadas (bcrypt)
- Sesión persistente

#### ✅ Mazos
- Guardar mazos en la nube
- Sincronización entre dispositivos
- Historial de versiones automático
- Mazos públicos y privados

#### ✅ Social
- Sistema de favoritos
- Sistema de likes
- Sistema de votación de comunidad
- Vistas de mazos

#### ✅ Colección
- Colección de cartas por usuario
- Sincronización en la nube

### 6.3 APIs Implementadas

- ✅ `/api/auth/register` - Registro
- ✅ `/api/auth/login` - Login
- ✅ `/api/decks` - CRUD de mazos
- ✅ `/api/decks/[id]` - Operaciones individuales
- ✅ `/api/decks/[id]/versions` - Historial
- ✅ `/api/favorites` - Gestión de favoritos
- ✅ `/api/favorites/toggle` - Alternar favoritos
- ✅ `/api/likes` - Sistema de likes
- ✅ `/api/likes/toggle` - Alternar likes
- ✅ `/api/votes` - Sistema de votación
- ✅ `/api/collection` - Colección de cartas

### 6.4 Próximos Pasos Recomendados

#### Fase 1 (Inmediato)
- ✅ Verificar que todo funciona
- ⭐ Configurar dominio personalizado
- ⭐ Agregar Google Analytics
- ⭐ Crear robots.txt y sitemap.xml

#### Fase 2 (Corto plazo)
- Mejorar SEO con Schema.org
- Agregar funcionalidad de exportar mazos
- Mejorar sistema de compartir mazos
- Optimizar rendimiento

#### Fase 3 (Mediano plazo)
- Implementar NextAuth
- Agregar más funcionalidades avanzadas
- Implementar PWA
- Crear API pública
- Sistema de notificaciones

---

## 📝 Notas Importantes

### Seguridad

- Las contraseñas se hashean con bcrypt (12 rounds)
- Validaciones en cliente y servidor
- Usuarios solo pueden editar/eliminar sus propios mazos

### Fallback a localStorage

- Todas las funciones tienen fallback a localStorage para usuarios no autenticados
- Los datos se migran automáticamente cuando el usuario se autentica
- Compatibilidad total con usuarios existentes

### Variables de Entorno

**Producción (Vercel):**
- `DATABASE_URL` o `POSTGRES_PRISMA_URL` - Connection string de PostgreSQL
- `NEXT_PUBLIC_ADSENSE_ID` - ID de AdSense (opcional)
- `NEXT_PUBLIC_GA_ID` - ID de Google Analytics (opcional)
- `NEXT_PUBLIC_SITE_URL` - URL del sitio

**Desarrollo Local (.env):**
```env
POSTGRES_PRISMA_URL="postgres://..."
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_ADSENSE_ID="ca-pub-..." (opcional)
NEXT_PUBLIC_GA_ID="G-..." (opcional)
```

---

## 🆘 ¿Necesitas Ayuda?

Si encuentras problemas:

1. Revisa los logs en Vercel (Deployments → Logs)
2. Revisa la consola del navegador (F12 → Console)
3. Verifica que las variables de entorno estén correctamente escritas
4. Consulta la sección de "Diagnóstico y Solución de Problemas" arriba

---

## 📚 Recursos Adicionales

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Vercel](https://vercel.com/docs)
- [Documentación de Prisma](https://www.prisma.io/docs)
- [Google AdSense](https://www.google.com/adsense/)
- [Google Analytics](https://analytics.google.com/)

---

**Última actualización:** Este documento consolida todas las guías e instrucciones del proyecto CartaTech.











