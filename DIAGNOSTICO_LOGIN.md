# 🔍 Diagnóstico de Problemas de Inicio de Sesión

Si no puedes iniciar sesión en tu sitio desplegado, sigue estos pasos para diagnosticar el problema:

---

## ✅ Paso 1: Verificar Variables de Entorno en Vercel

1. **Ve a tu dashboard de Vercel:**
   - https://vercel.com/dashboard
   - Selecciona tu proyecto "cartatech"

2. **Ve a Settings → Environment Variables:**
   - Busca `DATABASE_URL`
   - Verifica que esté configurada
   - Verifica que esté en "Production", "Preview" y "Development"

3. **Si no está configurada:**
   - Haz clic en "Add New"
   - Name: `DATABASE_URL`
   - Value: Tu connection string de Vercel Postgres
   - Environments: Selecciona todas (Production, Preview, Development)
   - Guarda

4. **Si ya está configurada:**
   - Verifica que la URL sea correcta
   - Copia el valor y verifica que no tenga espacios extra

---

## ✅ Paso 2: Verificar que la Base de Datos Tiene Usuarios

### Opción A: Usar Prisma Studio Localmente

1. **Configura tu `.env.local` con la DATABASE_URL de producción:**
   ```env
   DATABASE_URL="tu-connection-string-de-vercel"
   ```

2. **Abre Prisma Studio:**
   ```bash
   npm run db:studio
   ```

3. **Verifica la tabla `users`:**
   - Abre la tabla `users`
   - Verifica que haya usuarios registrados
   - Si no hay usuarios, necesitas registrarte primero

### Opción B: Usar el Editor SQL de Vercel

1. **Ve a Vercel Dashboard → Storage → Tu base de datos**
2. **Abre el Editor SQL**
3. **Ejecuta:**
   ```sql
   SELECT id, username, email, "createdAt" FROM users LIMIT 10;
   ```
4. **Verifica que haya usuarios**

---

## ✅ Paso 3: Verificar los Logs del Servidor

1. **Ve a Vercel Dashboard → Tu proyecto → Logs**
2. **Intenta iniciar sesión en tu sitio**
3. **Revisa los logs en tiempo real:**
   - Busca errores relacionados con:
     - `DATABASE_URL`
     - `Prisma`
     - `login`
     - `Error en login`

4. **Errores comunes:**
   - `DATABASE_URL no está configurada`: Falta la variable de entorno
   - `Can't reach database server`: Problema de conexión
   - `P2002`: Usuario duplicado (no debería afectar login)
   - `P2025`: Usuario no encontrado (usuario no existe)

---

## ✅ Paso 4: Probar el Registro Primero

Si no puedes iniciar sesión, prueba **registrar un nuevo usuario**:

1. **Ve a:** https://www.cartatech.cl/registro
2. **Registra un nuevo usuario**
3. **Si el registro funciona:**
   - El problema es que no tienes usuarios en la base de datos
   - Usa las credenciales del nuevo usuario para iniciar sesión

4. **Si el registro falla:**
   - Revisa los logs de Vercel
   - Verifica que `DATABASE_URL` esté configurada
   - Verifica que las tablas existan en la base de datos

---

## ✅ Paso 5: Verificar que las Tablas Existan

1. **Usa Prisma Studio localmente** (con la DATABASE_URL de producción):
   ```bash
   npm run db:studio
   ```

2. **Verifica que existan estas tablas:**
   - ✅ `users`
   - ✅ `decks`
   - ✅ `deck_versions`
   - ✅ `favorite_decks`
   - ✅ `deck_likes`
   - ✅ `votes`
   - ✅ `user_collections`

3. **Si faltan tablas:**
   - Ejecuta: `npx prisma db push` (localmente con la DATABASE_URL de producción)
   - O crea las tablas manualmente usando el editor SQL de Vercel

---

## ✅ Paso 6: Verificar la Consola del Navegador

1. **Abre tu sitio:** https://www.cartatech.cl/inicio-sesion
2. **Presiona F12** (abre DevTools)
3. **Ve a la pestaña "Console"**
4. **Intenta iniciar sesión**
5. **Revisa los errores:**
   - Errores de red (Network tab)
   - Errores de JavaScript (Console tab)
   - Errores de CORS

---

## 🔧 Soluciones Comunes

### Problema: "Error al iniciar sesión" (genérico)

**Posibles causas:**
1. `DATABASE_URL` no está configurada en Vercel
2. La base de datos no tiene usuarios
3. Error de conexión a la base de datos

**Solución:**
1. Verifica `DATABASE_URL` en Vercel (Paso 1)
2. Verifica que haya usuarios (Paso 2)
3. Revisa los logs (Paso 3)

### Problema: "Usuario o contraseña incorrectos"

**Posibles causas:**
1. El usuario no existe en la base de datos
2. La contraseña es incorrecta
3. El usuario fue creado en localStorage pero no en la base de datos

**Solución:**
1. Registra un nuevo usuario
2. O verifica que el usuario exista en la base de datos usando Prisma Studio

### Problema: "Error de conexión"

**Posibles causas:**
1. La API no está respondiendo
2. Error de CORS
3. El servidor está caído

**Solución:**
1. Verifica que el deployment esté "Ready" en Vercel
2. Revisa los logs de Vercel
3. Verifica la consola del navegador

---

## 📋 Checklist de Diagnóstico

- [ ] `DATABASE_URL` está configurada en Vercel
- [ ] `DATABASE_URL` está en todos los ambientes (Production, Preview, Development)
- [ ] La base de datos tiene la tabla `users`
- [ ] La base de datos tiene al menos un usuario
- [ ] El deployment está "Ready" en Vercel
- [ ] No hay errores en los logs de Vercel
- [ ] No hay errores en la consola del navegador
- [ ] Puedes registrar un nuevo usuario

---

## 🆘 Si Nada Funciona

1. **Revisa los logs completos en Vercel:**
   - Ve a "Logs" → Filtra por "Error"
   - Copia los errores completos

2. **Verifica la conexión a la base de datos:**
   - Usa Prisma Studio con la DATABASE_URL de producción
   - Intenta hacer una query simple

3. **Verifica que el usuario exista:**
   ```sql
   SELECT * FROM users WHERE username = 'tu-usuario';
   ```

4. **Prueba crear un nuevo usuario:**
   - Si el registro funciona, el problema es específico del login
   - Si el registro falla, el problema es más general (BD, conexión, etc.)

---

## 📞 Información para Debugging

Si necesitas ayuda, comparte:

1. **El error exacto** que ves en la página
2. **Los logs de Vercel** (últimos errores)
3. **Los errores de la consola del navegador** (F12 → Console)
4. **Si puedes registrar usuarios** o no
5. **Si `DATABASE_URL` está configurada** en Vercel

---

**¿Necesitas ayuda?** Comparte la información de debugging y te ayudaré a solucionarlo. 🚀

