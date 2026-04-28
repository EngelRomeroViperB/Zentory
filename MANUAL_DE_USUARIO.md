# 📘 Manual de Usuario y Flujos del Sistema Zentory

Este documento describe el funcionamiento de los flujos de negocio actualmente implementados en **Zentory** y sirve como manual de referencia para los usuarios del sistema (Administradores, Bodegueros y Vendedores).

---

## 👥 Roles de Usuario

El sistema cuenta con un control de acceso basado en roles (RBAC) para mantener la integridad de los datos y asegurar que cada empleado solo vea lo que necesita:

1. **Vendedor**: Solo tiene acceso al módulo de **POS (Punto de Venta)** para facturar a los clientes.
2. **Bodeguero**: Tiene acceso a **Inventario y Compras**. Puede crear productos, registrar ingresos de inventario de proveedores y administrar el Kardex, pero no puede vender ni anular facturas.
3. **Administrador (Admin)**: Acceso total. Puede hacer todo lo anterior, además de ver reportes de ventas, anular facturas, crear usuarios, asignar roles y configurar los datos del negocio.

---

## 🛒 1. Flujo de Punto de Venta (POS) - *Vendedores y Admin*

Este es el módulo principal de operación diaria de cara al cliente.

### ¿Cómo hacer una venta?
1. **Selección de Productos**:
   - Ingresa al módulo **"POS"** en el menú.
   - **Búsqueda Rápida**: Utiliza el escáner de código de barras o escribe el nombre del producto en el buscador.
   - Al agregar un producto, este aparece en la lista de la izquierda (Carrito). El sistema **bloqueará automáticamente** el agregar más cantidad si se excede el stock disponible en bodega.
2. **Edición del Carrito**:
   - Puedes cambiar la cantidad manualmente (ej. si el cliente lleva 5 unidades del mismo producto).
   - Puedes aplicar un porcentaje de descuento (%) directamente a un ítem específico.
   - Puedes eliminar un producto de la lista usando el ícono de la papelera roja.
3. **Checkout (Cobro)**:
   - En el panel derecho verás el subtotal, el IVA y el total a cobrar calculado automáticamente.
   - Haz clic en **"Ir a Pagar"**.
   - Si lo deseas, puedes seleccionar un cliente registrado o dejarlo como "Cliente Ocasional".
   - Al dar clic en **"Confirmar Venta"**, el sistema descuenta automáticamente el inventario (bajo el método FIFO, descontando primero los lotes más viejos) y genera la venta.
4. **Impresión**: 
   - Se mostrará una pantalla de éxito con el número de factura. Podrás imprimir el comprobante (Ticket PDF) para entregarlo al cliente.

---

## 📦 2. Flujo de Gestión de Inventario - *Bodegueros y Admin*

Aquí es donde se administran los productos y se ingresa la mercancía.

### A. Creación de Productos
1. Ve a **Inventario > Productos** y haz clic en "Nuevo producto".
2. **Código de Barras**: Puedes escanear un código existente o hacer clic en "Generar" para que el sistema cree un estándar numérico automático de 13 dígitos.
3. **Precios**: Al ingresar el *Costo Unitario* y el *Precio de Venta*, el sistema calculará en tiempo real el porcentaje de margen de ganancia. Te alertará (en rojo) si tu margen es muy bajo.
4. **Nota**: Un producto nuevo nace con **Stock Cero**. Para agregarle stock, debes hacer una "Compra".

### B. Ingreso de Mercancía (Compras)
No se puede simplemente "editar" el número de stock de un producto para evitar robos. Toda entrada debe estar justificada.
1. Ve a **Inventario > Compras** y haz clic en "Nueva Compra".
2. Selecciona el proveedor e ingresa el número de factura (opcional).
3. Añade los productos recibidos, su costo de compra y cantidad. Si el producto es perecedero, puedes asignarle una **Fecha de Caducidad** y una Ubicación.
4. Al "Registrar Compra", el stock de esos productos subirá automáticamente y el costo de la compra se sumará a los reportes de egresos.

### C. Kardex y Ajustes (Mermas)
El Kardex es el historial intocable de cada producto.
1. Al ver los detalles de un producto, podrás acceder a su **Kardex**.
2. Allí verás exactamente qué facturas descontaron stock y qué compras lo aumentaron.
3. **Ajustes**: Si un producto se dañó, se venció o se perdió, el Administrador puede hacer un "Ajuste de Inventario", justificando el motivo (ej. "Merma por producto roto"). Esto restará el stock de forma legal y dejará un registro auditable.

---

## ⚙️ 3. Flujos Administrativos - *Solo Admin*

### Anulación de Ventas
Si un vendedor cometió un error o un cliente devolvió un producto:
1. Ve al historial de **Ventas**.
2. Entra al detalle de la factura y usa el botón **"Anular Venta"**.
3. **Obligatorio**: Debes escribir un motivo de anulación detallado (mínimo 10 caracteres).
4. Al confirmar, el sistema automáticamente devolverá todos los productos de esa factura al inventario (Kardex) y la venta ya no sumará a los reportes de ganancias.

### Configuración del Negocio
1. En **Admin > Configuración**, puedes cambiar el Nombre del Negocio, NIT, Dirección, Teléfono, y el Porcentaje de IVA por defecto.
2. **Importante**: Todo cambio aquí se reflejará inmediatamente en el encabezado de todos los tickets y facturas PDF que impriman los vendedores en el POS a partir de ese momento.

### Gestión de Usuarios
1. En **Admin > Usuarios**, puedes invitar a tus empleados usando su correo electrónico y asignarles una contraseña.
2. Al crearlos, debes definir si serán `admin`, `vendedor` o `bodeguero`. Si alguien cambia de puesto, puedes editar su rol fácilmente desde esta misma pantalla.

---
*Este sistema está protegido contra errores matemáticos comunes (asegurando precisión exacta de centavos en la contabilidad) y restringe las operaciones destructivas para proteger tu información empresarial.*
