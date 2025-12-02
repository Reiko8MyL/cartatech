# 📚 Guía Completa para Principiantes: Configurar Base de Datos en Vercel

Esta guía está diseñada para **principiantes**. Te explicaré cada paso de forma muy clara y simple, sin asumir conocimientos previos.

---

## 🎯 ¿Qué Vamos a Hacer?

Vamos a conectar tu aplicación CartaTech con una base de datos real. Esto permitirá que:
- Los usuarios se registren y guarden sus datos
- Los mazos se guarden en la nube (no solo en el navegador)
- Todo funcione igual en cualquier dispositivo

**Tiempo estimado:** 15-20 minutos

---

## 📋 Resumen de los 6 Pasos

1. ✅ **Ya hiciste esto**: Creaste la base de datos Postgres en Vercel
2. ✅ **Ya hiciste esto**: Creaste `DATABASE_URL` en Vercel con la URL de conexión
3. ⏳ **Ahora**: Crear archivo `.env` localmente con la misma URL
4. ⏳ **Ahora**: Generar el código de Prisma
5. ⏳ **Ahora**: Crear las tablas en la base de datos
6. ⏳ **Ahora**: Probar que todo funciona

---

## 📖 Conceptos Básicos (Para Entender)

### ¿Qué es una Base de Datos?
Imagina una base de datos como un **archivo Excel gigante** en la nube donde guardas información:
- Usuarios registrados
- Mazos guardados
- Favoritos

**Diferencia con localStorage:**
- **localStorage**: Solo guarda en TU navegador (si borras el navegador, se pierde)
- **Base de datos**: Guarda en la nube (permanece siempre, funciona en todos los dispositivos)

### ¿Qué es Prisma?
Prisma es una herramienta que te ayuda a trabajar con la base de datos usando código TypeScript. Es como un "traductor" entre tu código y la base de datos.

### ¿Qué es una Variable de Entorno?
Es una forma segura de guardar información secreta (como la contraseña de la base de datos) sin ponerla en el código.

**Ejemplo:**
- ❌ **Malo**: Poner la URL de la base de datos directamente en el código
- ✅ **Bueno**: Guardarla en una variable de entorno

---

## ✅ Paso 1: Verificar que Tienes la URL de Conexión

### ¿Qué es esto?
La URL de conexión es como la "dirección" de tu base de datos. Le dice a tu aplicación dónde está la base de datos y cómo conectarse.

### Cómo encontrarla:

1. **Abre tu navegador** y ve a https://vercel.com
2. **Inicia sesión** con tu cuenta
3. **Haz clic en tu proyecto** "cartatech"
4. **Ve a la pestaña "Settings"** (Configuración) - está en el menú superior
5. **Haz clic en "Environment Variables"** (Variables de Entorno) - está en el menú lateral izquierdo
6. **Busca la variable `DATABASE_URL`** en la lista
7. **Haz clic en el ícono del ojo** 👁️ para ver el valor
8. **Copia el valor completo** - se ve algo así:
   ```
   postgres://default:abc123xyz@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

### ✅ Verificación:
- [si] ¿Encontraste `DATABASE_URL` en Vercel?
- [si] ¿Copiaste el valor completo?

**Si no la encuentras:**
- Ve a Storage → tu base de datos Postgres
- Busca "Connection String" o "Connection URL"
- Copia esa URL

---

## ✅ Paso 2: Crear Archivo `.env` Localmente

### ¿Qué es esto?
El archivo `.env` es donde guardas las configuraciones secretas para tu computadora. Es como tener una "copia" de las configuraciones de Vercel, pero para cuando trabajas en tu computadora.

### Cómo hacerlo:

#### Opción A: Desde el Explorador de Archivos (Más Fácil)

1. **Abre el Explorador de Archivos** de Windows
2. **Navega a esta carpeta:**
   ```
   C:\Users\crist\OneDrive\Escritorio\CartaTech\cartatech
   ```
3. **Haz clic derecho** en un espacio vacío de la carpeta
4. **Selecciona "Nuevo"** → **"Documento de texto"**
5. **Renombra el archivo** a exactamente: `.env`
   - ⚠️ **Importante**: Debe empezar con un punto (.)
   - Si Windows te dice que no puedes usar punto, escribe: `.env.` (con punto al final)
   - Windows lo guardará como `.env`

#### Opción B: Desde la Terminal (Alternativa)

1. **Abre PowerShell** o la Terminal
2. **Navega a la carpeta:**
   ```powershell
   cd C:\Users\crist\OneDrive\Escritorio\CartaTech\cartatech
   ```
3. **Crea el archivo:**
   ```powershell
   New-Item -Path .env -ItemType File
   ```

### Agregar Contenido al Archivo `.env`

1. **Abre el archivo `.env`** con el Bloc de Notas o cualquier editor de texto
2. **Pega exactamente esto** (reemplaza la URL con la que copiaste de Vercel):
   ```env
   DATABASE_URL="postgres://default:abc123xyz@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
   NODE_ENV="development"
   ```
3. **Reemplaza la URL**: Cambia `postgres://default:abc123xyz@...` por la URL real que copiaste de Vercel
4. **Guarda el archivo** (Ctrl + S)

### ⚠️ Importante:
- La URL debe estar entre comillas dobles `"`
- No debe tener espacios antes o después del `=`
- Debe ser exactamente igual a la que tienes en Vercel

### ✅ Verificación:
- [si] ¿Creaste el archivo `.env` en la carpeta `cartatech`?
- [si] ¿Agregaste `DATABASE_URL` con la URL correcta?
- [si] ¿Guardaste el archivo?

---

## ✅ Paso 3: Generar el Código de Prisma

### ¿Qué es esto?
Prisma necesita "generar" código TypeScript basado en tu esquema de base de datos. Es como compilar un programa antes de usarlo.

### Cómo hacerlo:

1. **Abre PowerShell** o la Terminal
2. **Navega a la carpeta del proyecto:**
   ```powershell
   cd C:\Users\crist\OneDrive\Escritorio\CartaTech\cartatech
   ```
3. **Ejecuta este comando:**
   ```powershell
   npx prisma generate
   ```
4. **Espera a que termine** - puede tardar 10-30 segundos
5. **Verifica que funcionó** - deberías ver un mensaje como:
   ```
   ✔ Generated Prisma Client (v7.0.1) to ./node_modules/.prisma/client
   ```

### ¿Qué hace este comando?
- Lee el archivo `prisma/schema.prisma` (el "plan" de tu base de datos)
- Genera código TypeScript que puedes usar en tu aplicación
- Crea tipos TypeScript para que tengas autocompletado

### ❌ Si sale un error:
- **Error: "Can't find module"**: Ejecuta primero `npm install`
- **Error: "Can't reach database"**: Verifica que la URL en `.env` sea correcta

### ✅ Verificación:
- [ ] ¿Ejecutaste `npx prisma generate`?
- [ ] ¿Viste el mensaje de éxito (✔)?

---

## ✅ Paso 4: Crear las Tablas en la Base de Datos

### ¿Qué es esto?
Las "tablas" son como las hojas de un Excel. Cada tabla guarda un tipo de información:
- Tabla `users`: Guarda los usuarios
- Tabla `decks`: Guarda los mazos
- Tabla `deck_versions`: Guarda el historial de versiones
- Tabla `favorite_decks`: Guarda los favoritos

Este paso **crea estas tablas** en tu base de datos real.

### Cómo hacerlo:

1. **Asegúrate de estar en la carpeta correcta:**
   ```powershell
   cd C:\Users\crist\OneDrive\Escritorio\CartaTech\cartatech
   ```
2. **Ejecuta este comando:**
   ```powershell
   npx prisma db push
   ```
3. **Espera a que termine** - puede tardar 10-20 segundos
4. **Verifica que funcionó** - deberías ver un mensaje como:
   ```
   ✔ Your database is now in sync with your Prisma schema.
   ```
   Y deberías ver algo como:
   ```
   The following migration(s) have been created and applied:
   
   migrations/
     └─ 20240101120000_init/
       └─ migration.sql
   ```

### ¿Qué hace este comando?
- Conecta a tu base de datos usando la URL de `.env`
- Lee el archivo `prisma/schema.prisma`
- Crea las 4 tablas: `users`, `decks`, `deck_versions`, `favorite_decks`
- Configura las relaciones entre las tablas

### ❌ Si sale un error:
- **Error: "Can't reach database server"**: 
  - Verifica que la URL en `.env` sea correcta
  - Verifica que no tenga espacios extra
  - Verifica que esté entre comillas dobles
- **Error: "Table already exists"**: 
  - No es un problema, significa que las tablas ya existen
  - Puedes continuar

### ✅ Verificación:
- [ ] ¿Ejecutaste `npx prisma db push`?
- [ ] ¿Viste el mensaje de éxito (✔)?

---

## ✅ Paso 5: Verificar que Todo Funciona

### Opción A: Ver las Tablas con Prisma Studio (Recomendado)

Prisma Studio es una herramienta visual que te permite ver tu base de datos como si fuera una página web.

1. **Ejecuta este comando:**
   ```powershell
   npx prisma studio
   ```
2. **Espera unos segundos** - se abrirá automáticamente en tu navegador
3. **Deberías ver una página** en `http://localhost:5555`
4. **En el menú lateral izquierdo**, deberías ver 4 tablas:
   - `users` (vacía por ahora)
   - `decks` (vacía por ahora)
   - `deck_versions` (vacía por ahora)
   - `favorite_decks` (vacía por ahora)

**✅ Si ves las 4 tablas, ¡todo está funcionando correctamente!**

Para cerrar Prisma Studio, presiona `Ctrl + C` en la terminal.

### Opción B: Probar la Aplicación

1. **Abre una nueva terminal** (deja Prisma Studio corriendo en otra si lo usaste)
2. **Navega a la carpeta:**
   ```powershell
   cd C:\Users\crist\OneDrive\Escritorio\CartaTech\cartatech
   ```
3. **Inicia la aplicación:**
   ```powershell
   npm run dev
   ```
4. **Espera a que inicie** - verás un mensaje como:
   ```
   ✓ Ready in 2.3s
   ○ Local: http://localhost:3000
   ```
5. **Abre tu navegador** y ve a http://localhost:3000
6. **Prueba registrar un usuario:**
   - Ve a `/registro` (o haz clic en "Registrarse")
   - Completa el formulario
   - Haz clic en "Registrarse"
   - ✅ **Debería funcionar sin errores**

7. **Prueba iniciar sesión:**
   - Ve a `/inicio-sesion`
   - Ingresa el usuario que acabas de crear
   - ✅ **Debería funcionar**

8. **Prueba crear un mazo:**
   - Ve a `/deck-builder`
   - Agrega algunas cartas
   - Guarda el mazo
   - ✅ **Debería guardarse correctamente**

### ✅ Verificación:
- [SI ] ¿Viste las 4 tablas en Prisma Studio?
- [SI ] ¿Pudiste registrar un usuario?
- [SI ] ¿Pudiste iniciar sesión?
- [NO ] ¿Pudiste guardar un mazo?

---

## ✅ Paso 6: Desplegar a Producción (Opcional por Ahora)

### ¿Qué es esto?
"Desplegar" significa subir tus cambios a internet para que los usuarios puedan usarlos. Como ya configuraste `DATABASE_URL` en Vercel, cuando subas el código, automáticamente usará la base de datos.

### Cómo hacerlo:

1. **Abre PowerShell** o Git Bash
2. **Navega a la carpeta:**
   ```powershell
   cd C:\Users\crist\OneDrive\Escritorio\CartaTech\cartatech
   ```
3. **Agrega los archivos al git:**
   ```powershell
   git add .
   ```
4. **Crea un commit (guarda los cambios):**
   ```powershell
   git commit -m "feat: configurar base de datos con Prisma"
   ```
5. **Sube los cambios a GitHub:**
   ```powershell
   git push origin main
   ```
6. **Espera 1-3 minutos** - Vercel detectará los cambios y desplegará automáticamente
7. **Verifica en Vercel:**
   - Ve a https://vercel.com
   - Entra a tu proyecto
   - Deberías ver un nuevo "Deployment" (despliegue) en proceso
   - Cuando termine, haz clic en tu sitio para probarlo

### ⚠️ Importante:
- Las tablas ya están creadas (las creaste en el Paso 4)
- Vercel usará la variable `DATABASE_URL` que ya configuraste
- No necesitas hacer nada más en Vercel

### ✅ Verificación:
- [ ] ¿Hiciste `git push`?
- [ ] ¿Vercel desplegó correctamente?
- [ ] ¿Puedes probar el sitio en producción?

---

## 📝 Resumen de Comandos (Para Copiar y Pegar)

```powershell
# 1. Navegar a la carpeta
cd C:\Users\crist\OneDrive\Escritorio\CartaTech\cartatech

# 2. Generar código de Prisma
npx prisma generate

# 3. Crear las tablas
npx prisma db push

# 4. Ver las tablas (opcional)
npx prisma studio

# 5. Probar la aplicación
npm run dev

# 6. Desplegar (cuando estés listo)
git add .
git commit -m "feat: configurar base de datos"
git push origin main
```

---

## 🆘 Solución de Problemas

### Problema: "Can't reach database server"
**Solución:**
1. Abre el archivo `.env`
2. Verifica que `DATABASE_URL` tenga la URL correcta
3. Verifica que esté entre comillas dobles `"`
4. Verifica que no tenga espacios antes o después del `=`
5. Guarda el archivo
6. Vuelve a ejecutar `npx prisma db push`

### Problema: "Table does not exist"
**Solución:**
1. Ejecuta `npx prisma db push` de nuevo
2. Verifica que no haya errores en la terminal

### Problema: "Prisma Client has not been generated"
**Solución:**
1. Ejecuta `npx prisma generate`
2. Espera a que termine
3. Vuelve a intentar

### Problema: No puedo crear el archivo `.env`
**Solución:**
1. Abre el Bloc de Notas
2. Pega el contenido:
   ```
   DATABASE_URL="tu-url-aqui"
   NODE_ENV="development"
   ```
3. Guarda como: `.env` (con el punto al inicio)
4. Si Windows no te deja, guarda como `.env.` (con punto al final)
5. Muévelo a la carpeta `cartatech`

### Problema: La aplicación no se conecta a la base de datos
**Solución:**
1. Verifica que el archivo `.env` esté en la carpeta `cartatech` (no en la carpeta padre)
2. Verifica que la URL sea correcta
3. Reinicia la aplicación (`Ctrl + C` y luego `npm run dev`)

---

## ✅ Checklist Final

Antes de considerar que todo está listo, verifica:

- [ ] Creaste el archivo `.env` con `DATABASE_URL`
- [ ] Ejecutaste `npx prisma generate` sin errores
- [ ] Ejecutaste `npx prisma db push` sin errores
- [ ] Viste las 4 tablas en Prisma Studio
- [ ] Probaste registrar un usuario localmente
- [ ] Probaste guardar un mazo localmente
- [ ] (Opcional) Desplegaste a producción

---

## 🎉 ¡Felicidades!

Si completaste todos los pasos, tu aplicación ahora está conectada a una base de datos real. Los usuarios podrán:
- ✅ Registrarse y sus datos se guardarán en la nube
- ✅ Guardar mazos que se sincronizarán entre dispositivos
- ✅ Usar la aplicación desde cualquier lugar

---

## 📚 Próximos Pasos (Opcional)

1. **Probar en producción**: Una vez desplegado, prueba registrar usuarios en el sitio real
2. **Ver datos en Prisma Studio**: Usa `npx prisma studio` para ver los datos guardados
3. **Actualizar componentes**: Gradualmente puedes actualizar los componentes para usar las nuevas funciones (no es urgente)

---

## 💡 Consejos

- **Guarda el archivo `.env`**: No lo subas a GitHub (ya está en `.gitignore`)
- **Usa Prisma Studio**: Es muy útil para ver y editar datos manualmente
- **Prueba localmente primero**: Siempre prueba en tu computadora antes de desplegar
- **Lee los mensajes de error**: Te dicen exactamente qué está mal

---

¿Tienes alguna pregunta? Revisa la sección de "Solución de Problemas" o busca el error específico en Google.
