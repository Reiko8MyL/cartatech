# 🌐 Cómo Usar Vercel para Revisar tu Página en la Web

Esta guía te enseñará cómo acceder y revisar tu sitio web CartaTech que está desplegado en Vercel.

---

## 🎯 Acceso Rápido a tu Sitio

### URL de Producción
Tu sitio está disponible en:
**https://www.cartatech.cl/**

Simplemente abre esta URL en tu navegador para ver tu página en producción.

---

## 📊 Dashboard de Vercel

### Paso 1: Acceder al Dashboard

1. **Ve a Vercel:**
   - Abre tu navegador y ve a: https://vercel.com
   - O directamente: https://vercel.com/dashboard

2. **Inicia sesión:**
   - Usa tu cuenta de GitHub (si conectaste el proyecto desde GitHub)
   - O inicia sesión con el email que usaste para crear la cuenta

3. **Selecciona tu proyecto:**
   - En el dashboard verás una lista de proyectos
   - Busca y haz clic en **"cartatech"** (o el nombre que le diste)

---

## 🚀 Ver Deployments (Despliegues)

### ¿Qué son los Deployments?

Cada vez que haces `git push` a la rama `main`, Vercel automáticamente:
1. Detecta los cambios
2. Compila tu aplicación
3. La despliega en producción
4. Crea un nuevo "deployment"

### Cómo Ver los Deployments:

1. **En el dashboard de tu proyecto**, verás la sección **"Deployments"**
2. **Cada deployment muestra:**
   - ✅ Estado: "Ready" (listo), "Building" (construyendo), "Error" (error)
   - 🕐 Fecha y hora del despliegue
   - 📝 Mensaje del commit (ej: "feat: agregar nueva funcionalidad")
   - 👤 Autor del commit
   - 🌍 URL del deployment

3. **Haz clic en un deployment** para ver:
   - Logs del build (qué pasó durante la compilación)
   - Errores si los hay
   - Tiempo de build
   - Variables de entorno usadas

### Estados de Deployment:

- **✅ Ready (Listo)**: El sitio está desplegado y funcionando
- **🔄 Building (Construyendo)**: Vercel está compilando tu app
- **❌ Error**: Hubo un error durante el build
- **⏸️ Canceled**: El deployment fue cancelado

---

## 🔍 Ver Logs en Producción

### ¿Por qué ver los logs?

Los logs te muestran:
- Errores que ocurren en producción
- Peticiones a las APIs
- Problemas de conexión a la base de datos
- Errores de Prisma

### Cómo Ver los Logs:

1. **En el dashboard de tu proyecto**, ve a la pestaña **"Logs"** o **"Functions"**
2. **O desde un deployment específico:**
   - Haz clic en un deployment
   - Busca la sección **"Function Logs"** o **"Runtime Logs"**
3. **Filtra los logs:**
   - Por función (ej: `/api/decks`)
   - Por nivel (Error, Warning, Info)
   - Por fecha/hora

### Ejemplo de Logs:

```
[2024-01-15 10:30:45] POST /api/decks 200 OK
[2024-01-15 10:30:46] Error: PrismaClientKnownRequestError
[2024-01-15 10:30:47] Error code: P2002
```

### Ver Logs en Tiempo Real:

1. Ve a **"Logs"** en el dashboard
2. Los logs se actualizan automáticamente
3. Puedes hacer scroll para ver logs anteriores

---

## 🌍 URLs y Dominios

### URL de Producción Principal:

**https://www.cartatech.cl/**

Esta es la URL que tus usuarios ven.

### URL de Vercel (Alternativa):

También tienes una URL de Vercel:
**https://cartatech.vercel.app/**

Esta URL también funciona, pero la principal es `cartatech.cl`.

### Ver Todas las URLs:

1. En el dashboard de tu proyecto
2. Ve a **"Settings"** → **"Domains"**
3. Verás todas las URLs configuradas

---

## 🔄 Preview Deployments (Previsualizaciones)

### ¿Qué son los Preview Deployments?

Cuando haces un `git push` a una rama que NO es `main` (ej: `feature/nueva-funcionalidad`), Vercel crea un **Preview Deployment**.

### Ventajas:

- ✅ Puedes probar cambios sin afectar producción
- ✅ Cada Pull Request tiene su propia URL
- ✅ Puedes compartir la URL con otros para revisar

### Cómo Ver Preview Deployments:

1. **En el dashboard**, verás deployments marcados como **"Preview"**
2. **Cada preview tiene su propia URL:**
   - Ejemplo: `https://cartatech-git-feature-nueva.vercel.app`
3. **Haz clic en la URL** para ver la versión preview

### Usar Preview Deployments:

1. Crea una nueva rama:
   ```bash
   git checkout -b feature/mi-nueva-funcion
   ```

2. Haz cambios y commit:
   ```bash
   git add .
   git commit -m "feat: nueva funcionalidad"
   ```

3. Push a la rama:
   ```bash
   git push origin feature/mi-nueva-funcion
   ```

4. Vercel automáticamente crea un preview
5. Revisa la URL del preview antes de hacer merge a `main`

---

## 📈 Analytics y Métricas

### Ver Analytics:

1. En el dashboard de tu proyecto
2. Ve a la pestaña **"Analytics"**
3. Verás:
   - **Visitas**: Cuántas personas visitan tu sitio
   - **Páginas más visitadas**: Qué páginas son más populares
   - **Tiempo de carga**: Qué tan rápido carga tu sitio
   - **Errores**: Cuántos errores hay

### Métricas Importantes:

- **Page Views**: Número de páginas vistas
- **Unique Visitors**: Visitantes únicos
- **Top Pages**: Páginas más visitadas
- **Performance**: Velocidad de carga

---

## 🔧 Configuración del Proyecto

### Ver Configuración:

1. En el dashboard, ve a **"Settings"**
2. Verás varias secciones:

#### **General:**
- Nombre del proyecto
- Framework (Next.js)
- Build Command
- Output Directory

#### **Environment Variables:**
- Variables de entorno (ej: `DATABASE_URL`)
- Variables para Production, Preview, Development

#### **Domains:**
- Dominios configurados
- SSL/TLS (certificados de seguridad)

#### **Storage:**
- Bases de datos conectadas
- Vercel Postgres (si lo estás usando)

---

## 🗄️ Ver Base de Datos en Vercel

### Acceder a Vercel Postgres:

1. En el dashboard de tu proyecto
2. Ve a la pestaña **"Storage"** o busca **"Postgres"**
3. Haz clic en tu base de datos
4. Verás:
   - **Connection String**: URL de conexión
   - **Editor SQL**: Para ejecutar queries
   - **Tablas**: Estructura de las tablas
   - **Datos**: Ver registros (limitado)

### Ejecutar Queries SQL:

1. En la página de tu base de datos
2. Busca **"SQL Editor"** o **"Query"**
3. Escribe tu query:
   ```sql
   SELECT * FROM users LIMIT 10;
   ```
4. Ejecuta la query
5. Verás los resultados

**⚠️ Nota:** Para una mejor experiencia, usa Prisma Studio localmente con la connection string de producción.

---

## 🐛 Debugging en Producción

### Si Algo No Funciona:

1. **Revisa los Logs:**
   - Ve a "Logs" en el dashboard
   - Busca errores recientes
   - Copia el mensaje de error completo

2. **Revisa el Último Deployment:**
   - Ve a "Deployments"
   - Haz clic en el último deployment
   - Revisa si el build fue exitoso
   - Revisa los logs del build

3. **Verifica Variables de Entorno:**
   - Ve a "Settings" → "Environment Variables"
   - Verifica que `DATABASE_URL` esté configurada
   - Verifica que esté en "Production"

4. **Prueba la URL:**
   - Abre https://www.cartatech.cl/
   - Abre la consola del navegador (F12)
   - Busca errores en la consola

---

## 🔄 Flujo de Trabajo Recomendado

### Desarrollo → Producción:

1. **Desarrollo Local:**
   ```bash
   npm run dev
   ```
   - Prueba cambios en `http://localhost:3000`

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

5. **Verifica en Producción:**
   - Abre https://www.cartatech.cl/
   - Prueba la nueva funcionalidad
   - Revisa que todo funcione

---

## 📱 Acceso Móvil

### Ver tu Sitio en el Móvil:

1. **Abre la URL en tu móvil:**
   - https://www.cartatech.cl/

2. **O usa el modo de desarrollo móvil:**
   - En Chrome/Edge: F12 → Toggle device toolbar (Ctrl+Shift+M)
   - Selecciona un dispositivo móvil
   - Recarga la página

---

## 🎯 Checklist de Revisión

Antes de considerar que un deployment está listo:

- [ ] El deployment muestra estado "Ready" (no "Error")
- [ ] No hay errores en los logs
- [ ] La URL principal carga correctamente
- [ ] Las APIs responden (prueba registrar un usuario)
- [ ] La base de datos está conectada
- [ ] No hay errores en la consola del navegador
- [ ] El sitio se ve bien en móvil

---

## 🆘 Problemas Comunes

### El sitio no carga:

1. **Revisa el estado del deployment:**
   - ¿Está en "Ready" o "Error"?
   - Si está en "Error", revisa los logs

2. **Revisa los logs:**
   - Busca mensajes de error
   - Copia el error completo

3. **Verifica variables de entorno:**
   - ¿`DATABASE_URL` está configurada?
   - ¿Está en el ambiente correcto (Production)?

### Los cambios no aparecen:

1. **Espera unos minutos:**
   - Los deployments pueden tardar 1-3 minutos

2. **Limpia la caché del navegador:**
   - Ctrl+Shift+R (recarga forzada)
   - O abre en modo incógnito

3. **Verifica que el push fue exitoso:**
   - Ve a GitHub y verifica el commit
   - Ve a Vercel y verifica que hay un nuevo deployment

### Errores de base de datos:

1. **Revisa la connection string:**
   - Ve a "Storage" → Tu base de datos
   - Verifica que la URL sea correcta

2. **Revisa los logs:**
   - Busca errores de Prisma
   - Busca errores de conexión

3. **Verifica que las tablas existan:**
   - Usa Prisma Studio localmente con la connection string de producción
   - O ejecuta queries en el editor SQL de Vercel

---

## 📚 Recursos Adicionales

- **Dashboard de Vercel**: https://vercel.com/dashboard
- **Documentación de Vercel**: https://vercel.com/docs
- **Guía de Logs**: Ver `COMO_REVISAR_LOGS_SERVIDOR.md`
- **Guía de Base de Datos**: Ver `COMO_VER_BASE_DATOS.md`

---

## ✅ Resumen Rápido

**Para ver tu sitio:**
1. Abre https://www.cartatech.cl/

**Para revisar deployments:**
1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto "cartatech"
3. Revisa la pestaña "Deployments"

**Para ver logs:**
1. En el dashboard, ve a "Logs"
2. O haz clic en un deployment → "Function Logs"

**Para hacer cambios:**
1. Haz cambios localmente
2. `git push origin main`
3. Vercel despliega automáticamente
4. Revisa el nuevo deployment en el dashboard

---

**¿Necesitas ayuda?** Si encuentras algún problema, revisa los logs en Vercel y comparte el error para que pueda ayudarte. 🚀

