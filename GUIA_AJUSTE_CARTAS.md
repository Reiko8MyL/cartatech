# Guía: Ajustar Posición Y de Cartas

## ¿Qué cambió?

**¡Tranquilo! Los datos de tus cartas NO cambiaron.** 

- ✅ `cards.js` y `AAcards.js` siguen igual - puedes seguir actualizándolos desde Excel como siempre
- ✅ Solo agregué una **capa adicional** para ajustes personalizados de posición Y
- ✅ Si no ajustas nada, las cartas usan valores automáticos según su tipo

## ¿Qué es la posición Y?

La posición Y controla qué parte de la imagen de la carta se muestra en la lista del mazo:

- **15-20%**: Muestra más la parte superior (donde está el nombre/arte principal)
- **25-30%**: Posición media (por defecto según tipo)
- **35-45%**: Muestra más la parte inferior

## Cómo usar

### Opción 1: Interfaz Web (Recomendado) 🎨

1. Ve a: `http://localhost:3000/admin/ajustar-cartas` (o en producción: `https://www.cartatech.cl/admin/ajustar-cartas`)
2. Busca la carta por ID o nombre (ej: "MYL-0001" o "Rey Arturo")
3. Selecciona la carta
4. Ajusta el slider o escribe el valor (15-45)
5. Haz clic en "Guardar"
6. ¡Listo! La carta ahora usará esa posición personalizada

### Opción 2: Desde la Consola del Navegador 💻

Abre la consola del navegador (F12) y usa:

```javascript
// Importar las funciones (si estás en el código)
import { updateCardMetadata, getCardMetadata } from "@/lib/api/cards"

// Ajustar una carta específica
await updateCardMetadata("MYL-0001", 25)

// Ver la posición actual
await getCardMetadata("MYL-0001")

// Eliminar ajuste personalizado (volver a por defecto)
await updateCardMetadata("MYL-0001", null)
```

### Opción 3: Desde la Base de Datos 🗄️

Si prefieres hacerlo directamente en la base de datos:

```sql
-- Ver todas las cartas con ajustes personalizados
SELECT * FROM card_metadata;

-- Agregar/actualizar ajuste para una carta
INSERT INTO card_metadata (card_id, background_position_y)
VALUES ('MYL-0001', 25)
ON CONFLICT (card_id) 
DO UPDATE SET background_position_y = 25;

-- Eliminar ajuste personalizado
DELETE FROM card_metadata WHERE card_id = 'MYL-0001';
```

## Valores por Defecto

Si no ajustas una carta, usa estos valores según su tipo:

- **Aliado**: 20%
- **Arma**: 25%
- **Talismán**: 30%
- **Tótem**: 28%
- **Oro**: 35%

## Ejemplos Prácticos

### Ejemplo 1: Carta con arte en la parte superior
Si una carta tiene el arte principal arriba y quieres mostrarlo mejor:
```javascript
await updateCardMetadata("MYL-0001", 18) // Más arriba
```

### Ejemplo 2: Carta con arte en el centro
Si el arte está en el medio:
```javascript
await updateCardMetadata("MYL-0001", 30) // Centro
```

### Ejemplo 3: Volver a valores por defecto
Si quieres que vuelva a usar el valor automático:
```javascript
await updateCardMetadata("MYL-0001", null)
```

## Preguntas Frecuentes

**P: ¿Tengo que ajustar todas las cartas?**
R: No, solo las que quieras. Las demás usarán valores automáticos.

**P: ¿Se pierden los ajustes si actualizo cards.js?**
R: No, los ajustes están en la base de datos, independientes de los archivos JS.

**P: ¿Puedo ajustar muchas cartas a la vez?**
R: Sí, puedes usar la interfaz web o hacer múltiples llamadas a la API.

**P: ¿Cómo sé qué valor usar?**
R: Prueba diferentes valores en la interfaz web y ve cuál se ve mejor. La vista previa te ayuda.

## Resumen

- ✅ Tus archivos `cards.js` y `AAcards.js` siguen igual
- ✅ Solo agregué una forma de ajustar la posición Y personalizada
- ✅ Usa la interfaz web en `/admin/ajustar-cartas` para ajustar visualmente
- ✅ O usa las funciones API si prefieres hacerlo programáticamente


