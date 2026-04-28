# Auditoría Integral del Proyecto Zentory

Tras realizar un análisis estricto y profundo del código fuente del proyecto **Zentory**, he identificado múltiples vulnerabilidades estructurales, fallos de lógica de negocio (especialmente en el manejo financiero), antipatrones y duplicaciones innecesarias. 

A continuación, presento un informe detallado con todo lo que "falla" o requiere reestructuración urgente.

---

## 1. Vulnerabilidad Crítica: Manejo de Cálculos Financieros (Floating-Point Bugs)
**Severidad: ALTA 🚨**

El proyecto tiene una contradicción grave en su arquitectura. En `src/types/database.ts` se establece una excelente regla monetaria: *"todos los campos numeric(12,2) de PostgreSQL se tipan como `string` porque Supabase los serializa como string para preservar la precisión decimal exacta"*.

**El Fallo:**
A pesar de esta regla, en el Frontend se ignoran las precauciones y se convierte este `string` a un `Number` nativo de JavaScript para hacer cálculos aritméticos (`+`, `*`, `/`). 
JavaScript utiliza el estándar IEEE 754 de punto flotante, lo que significa que operaciones simples fallan (ej: `0.1 + 0.2 = 0.30000000000000004`). 

**Dónde ocurre:**
- `PurchaseForm.tsx`: El total se calcula usando `Number()` directamente en un `reduce` y luego se multiplica por 100 y se redondea con `Math.round()`, lo que puede generar pérdida de centavos en compras grandes.
- `ProductForm.tsx`: El margen de ganancia se calcula como `(((sale - cost) / cost) * 100).toFixed(2)`, sufriendo el mismo problema.
- **Uso decorativo de Dinero.js**: Se instaló la librería `dinero.js` (una excelente herramienta para evitar estos problemas), pero **solo se está usando para formatear strings de salida** (`toFormat()`), y no para realizar las sumas/multiplicaciones. Esto anula por completo el propósito de la librería.

---

## 2. Antipatrones de Paginación Mixta
**Severidad: MEDIA 🟡**

Existe una confusión arquitectónica sobre quién es responsable de la paginación de datos. 

**El Fallo:**
En el componente `ProductsTable.tsx`, la tabla recibe por `props` las variables `page` y `totalPages` (lo que indica una paginación del lado del servidor - SSR). Además, tiene botones de "Anterior" y "Siguiente" que ejecutan `onPageChange`.
Sin embargo, al inicializar `@tanstack/react-table`, se incluye el módulo `getPaginationRowModel()`. 

**Impacto:**
`getPaginationRowModel()` habilita la paginación *del lado del cliente* (Client-Side). Si el servidor retorna 50 items (correspondientes a la página 1 del servidor), la tabla intentará paginar internamente esos 50 items si su configuración por defecto es de, por ejemplo, 10 filas. Esto crea un conflicto en el flujo de usuario, donde hay paginación dentro de la paginación.

---

## 3. Generación Débil de Identificadores Únicos (Códigos de Barras)
**Severidad: ALTA 🚨**

**El Fallo:**
En `ProductForm.tsx`, al hacer clic en el botón para autogenerar un código QR o código de barras, se utiliza la siguiente lógica:
```typescript
uuidv4().substring(0,8)
```

**Impacto:**
Un UUID v4 tiene 128 bits de entropía. Al cortar los primeros 8 caracteres (hexadecimales), la entropía se reduce a solo 32 bits (4.29 mil millones de posibilidades). Por la paradoja del cumpleaños, en un sistema de inventarios, la probabilidad de que dos productos generen la misma secuencia es peligrosamente alta. Los códigos de barras comerciales deben seguir estándares como EAN-13, o al menos usar un generador de secuencias alfanuméricas con control de colisiones en la base de datos.

---

## 4. Duplicación de Configuraciones Globales
**Severidad: BAJA 🟢 (Deuda Técnica)**

**El Fallo:**
La configuración global de `dinero.js` está dispersa y duplicada en los archivos de los componentes, en lugar de estar centralizada. 
```typescript
dinero.globalLocale = 'en-US';
```
Esta línea se repite en el scope global de `ProductsTable.tsx` y `PurchaseForm.tsx`.

**Impacto:**
Si el negocio requiere cambiar la configuración regional (por ejemplo, a `es-CO` para pesos colombianos), el desarrollador tendrá que cazar este fragmento de código por todos los componentes. Debería existir un archivo `src/lib/config/dinero.ts` o inicializarse en el layout principal.

---

## 5. Validaciones (Zod) Inconsistentes
**Severidad: MEDIA 🟡**

**El Fallo:**
En `product.schema.ts` y `purchase.schema.ts`, se validan los campos monetarios (`cost_price`, `sale_price`, `unit_cost`) convirtiéndolos de string a Number:
```typescript
z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0)
```

**Impacto:**
1. Esto permite que un usuario introduzca valores como `"0.00001"`. JavaScript lo tomará como un número válido, el schema lo aceptará, pero al llegar a PostgreSQL, que espera un `numeric(12,2)`, el dato será truncado, redondeado o fallará, provocando inconsistencias silenciosas.
2. Permitir el uso de la notación científica como `"1e5"`, que pasa la prueba de `!isNaN()`.

## Recomendaciones Inmediatas:
1. **Refactorizar lógica monetaria:** Usar `dinero.js` o `decimal.js` para *todas* las sumas, restas y multiplicaciones en el cliente (`CartSummary`, `CheckoutDialog`, `PurchaseForm`). Nunca usar `+` o `*` con `Number()` para el dinero.
2. **Remover `getPaginationRowModel()`** de las tablas si los datos ya vienen paginados desde Supabase (Query limits & ranges).
3. **Mejorar el generador de Códigos:** Utilizar `nanoid` con un alfabeto amigable para códigos de barras, o generar códigos secuenciales (ej. `PRD-0001`) consultando el último insertado.
4. **Centralizar Config:** Crear un único punto de entrada para configuraciones de librerías de terceros (Locales, Monedas, etc).
