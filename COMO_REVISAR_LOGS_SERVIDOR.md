# 📋 Cómo Revisar los Logs del Servidor

Esta guía te enseñará cómo ver los errores que aparecen en la terminal cuando ejecutas `npm run dev`.

---

## 🎯 Paso 1: Encontrar la Terminal del Servidor

### Opción A: Si ya tienes el servidor corriendo

1. **Busca la ventana de terminal** donde ejecutaste `npm run dev`
2. **Deberías ver algo como esto:**
   ```
   ▲ Next.js 16.0.5
   - Local:        http://localhost:3000
   - Ready in 2.3s
   ```

### Opción B: Si no tienes el servidor corriendo

1. **Abre una terminal** (PowerShell, CMD, o la terminal integrada de VS Code)
2. **Navega a la carpeta del proyecto:**
   ```powershell
   cd C:\Users\crist\OneDrive\Escritorio\CartaTech\cartatech
   ```
3. **Inicia el servidor:**
   ```powershell
   npm run dev
   ```
4. **Espera a que inicie** - verás el mensaje de "Ready"

---

## 🔍 Paso 2: Identificar los Errores

### ¿Qué buscar?

Cuando hay un error, verás mensajes en **rojo** o con el prefijo `Error:` o `✗`. 

### Ejemplo de error típico:

```
Error al obtener colección: PrismaClientKnownRequestError: 
Invalid `prisma.userCollection.findUnique()` invocation in
/app/api/collection/route.ts:18:5

  17 |
> 18 |   let collection = await prisma.userCollection.findUnique({
     |                    ^
  19 |     where: { userId },
  20 |     select: { cardIds: true },
  21 |   });

Error code: P2002
Error message: Unique constraint failed on the fields: (`userId`)
```

---

## 📝 Paso 3: Copiar el Error Completo

### Método 1: Seleccionar y Copiar

1. **En la terminal**, haz clic y arrastra para **seleccionar todo el error**
2. **Presiona `Ctrl + C`** para copiar
3. **Pega el error** en un mensaje o documento

### Método 2: Scroll hacia arriba

1. **Haz scroll hacia arriba** en la terminal para ver errores anteriores
2. Los errores más recientes aparecen al final
3. **Busca líneas que digan:**
   - `Error:`
   - `✗`
   - `PrismaClientKnownRequestError`
   - `Error code:`

---

## 🎨 Paso 4: Entender los Tipos de Errores

### Errores de Prisma (Base de Datos)

**Se ven así:**
```
PrismaClientKnownRequestError: 
Invalid `prisma.userCollection.findUnique()` invocation
Error code: P2002
```

**Códigos comunes:**
- `P2002`: Violación de constraint único (ej: usuario duplicado)
- `P2003`: Foreign key constraint failed (ej: usuario no existe)
- `P2025`: Registro no encontrado

### Errores de Next.js

**Se ven así:**
```
Error: Route "/api/collection" does not exist
```

### Errores de TypeScript

**Se ven así:**
```
Type error: Property 'cardIds' does not exist on type 'UserCollection'
```

---

## 🔧 Paso 5: Filtrar los Logs Importantes

### Buscar errores específicos:

En PowerShell, puedes usar:
```powershell
# Ver solo líneas con "Error"
npm run dev | Select-String "Error"
```

### O simplemente:

1. **Presiona `Ctrl + F`** en la terminal (si tu terminal lo soporta)
2. **Busca:** `Error`, `✗`, o el nombre del archivo que falla (ej: `collection`)

---

## 📸 Paso 6: Capturar una Imagen (Alternativa)

Si es difícil copiar el texto:

1. **Toma una captura de pantalla** de la terminal
2. **Asegúrate de que se vea:**
   - El mensaje de error completo
   - El stack trace (las líneas que muestran dónde ocurrió)
   - El código de error (ej: `P2002`)

---

## 🎯 Ejemplo Práctico: Revisar Error de Colección

### 1. Abre la terminal donde corre `npm run dev`

### 2. Ve a la página de Galería en tu navegador

### 3. Observa la terminal - deberías ver algo como:

```
Error al obtener colección: PrismaClientKnownRequestError: 
Invalid `prisma.userCollection.findUnique()` invocation

Error code: P2003
Error message: Foreign key constraint failed on the field: `userId`
```

### 4. Copia TODO el mensaje de error (incluyendo el código)

### 5. Comparte el error completo para que pueda ayudarte

---

## 💡 Tips Útiles

### Limpiar la terminal:

Si hay mucho texto, puedes:
- **En PowerShell:** `Clear-Host` o `cls`
- **Luego recarga la página** para ver el error nuevo

### Ver logs en tiempo real:

Los logs aparecen **automáticamente** cuando:
- Haces una petición a la API
- Hay un error en el servidor
- Next.js compila algo

### Logs más detallados:

Si quieres ver más información, puedes agregar `console.log` en el código:

```typescript
console.log("DEBUG: userId recibido:", userId);
console.log("DEBUG: Usuario existe?", userExists);
```

---

## 🆘 Si No Ves Errores

### Verifica que:

1. ✅ El servidor está corriendo (`npm run dev`)
2. ✅ Estás viendo la terminal correcta
3. ✅ Recargaste la página después del error
4. ✅ El error ocurrió en el servidor (no solo en el navegador)

### Errores del navegador vs servidor:

- **Errores del navegador:** Aparecen en la **Consola del Navegador** (F12 → Console)
- **Errores del servidor:** Aparecen en la **Terminal** donde corre `npm run dev`

---

## 📚 Recursos Adicionales

- [Next.js Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [Prisma Error Codes](https://www.prisma.io/docs/reference/api-reference/error-reference)

---

## ✅ Checklist Rápido

- [ ] Tengo el servidor corriendo (`npm run dev`)
- [ ] Veo la terminal donde aparecen los logs
- [ ] Recargué la página que causa el error
- [ ] Busqué mensajes con "Error" o "✗"
- [ ] Copié el mensaje de error completo
- [ ] Incluí el código de error (ej: `P2003`)

---

**¿Necesitas ayuda?** Comparte el error completo que ves en la terminal y te ayudaré a solucionarlo. 🚀

