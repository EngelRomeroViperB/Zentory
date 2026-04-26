# Zentory - Sistema de Gestión de Inventario y POS

Zentory es un sistema robusto de facturación e inventario web construido sobre Next.js 14 y Supabase. Está diseñado para garantizar cálculos monetarios de precisión (usando dinero.js), sincronización en tiempo real para terminales de impresión (PC Bridge), un estricto control de acceso basado en roles (RLS) y reportes offline en el lado del cliente.

## Stack Tecnológico

- **Frontend:** Next.js 14 (App Router), React, TypeScript.
- **UI:** Tailwind CSS, componentes personalizados (Button, Dialog, Table, Badge).
- **Gestión Monetaria:** dinero.js.
- **Backend & Auth:** Supabase (PostgreSQL, Realtime, Edge Functions).
- **Exportaciones:** jsPDF, SheetJS (xlsx), CSV (client-side).
- **Escáner:** html5-qrcode (cámara para códigos de barras/QR).
- **Seguridad:** next-safe-action, Sentry.
- **Testing:** Playwright (E2E).

## Requisitos Previos

- Node.js >= 18.17.0
- CLI de Supabase (`npm i -g supabase`)
- Cuenta de Supabase (Plan Free/Pro)
- Cuenta de Vercel (Para despliegue en producción)

## Setup Local (Paso a Paso)

1. **Clonar el Repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/zentory.git
   cd zentory
   ```

2. **Instalar Dependencias:**
   ```bash
   npm install
   ```

3. **Configurar Variables de Entorno:**
   Copia la plantilla de `.env`:
   ```bash
   cp .env.local.example .env.local
   ```
   
   **Variables obligatorias:**
   - `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (de Supabase)
   - `SUPABASE_SERVICE_ROLE_KEY` (solo servidor)
   
   **Variables de negocio (para facturas):**
   - `NEXT_PUBLIC_BUSINESS_NAME` - Nombre de la empresa
   - `NEXT_PUBLIC_BUSINESS_NIT` - NIT
   - `NEXT_PUBLIC_BUSINESS_ADDRESS` - Dirección
   - `NEXT_PUBLIC_BUSINESS_PHONE` - Teléfono
   - `NEXT_PUBLIC_BUSINESS_EMAIL` - Correo electrónico (nuevo)
   - `NEXT_PUBLIC_BUSINESS_MESSAGE` - Mensaje personalizado en facturas (nuevo)

4. **Ejecutar Migraciones:**
   Garantiza que tu instancia local/remota de Supabase reciba todas las estructuras, funciones y políticas:
   ```bash
   supabase db push
   ```
   
   **Migraciones incluidas:** 8 archivos (001_schema.sql a 008_purchase_atomic.sql)

5. **Crear Usuario Admin Inicial:**
   Desde el panel SQL de tu Supabase, ejecuta lo siguiente:
   ```sql
   -- Registrar un usuario manual o por la UI web, luego:
   INSERT INTO user_roles (user_id, role)
   VALUES ('el-id-uuid-del-auth-users', 'admin');
   ```

6. **Iniciar el Entorno de Desarrollo:**
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:3000`.

## Estructura de Carpetas (Fases 0 - 4)

- `src/app/`: Rutas, Hubs y Componentes Server (App Router).
- `src/components/`: Componentes UI y modulares aislados (POS, Reportes, Inventario).
- `src/lib/`:
  - `actions/`: Server Actions asíncronas para las mutaciones.
  - `queries/`: Queries para lectura de Supabase (Lecturas).
  - `exports/`: Lógica de utilidades (Generación PDF/Excel).
  - `store/`: Estado global del cliente manejado por Zustand.
  - `validations/`: Validadores formales Zod.
- `supabase/migrations/`: Versiones progresivas del Schema (001 a 007), funciones atómicas, RLS y triggers de auditoría.

## Roles y Permisos

| Rol | Descripción | Acceso Principal |
| --- | --- | --- |
| **Admin** | Acceso total al sistema. | Panel Admin, Anulaciones, Config, Libros Contables. |
| **Vendedor** | Personal de mostrador. | Módulo POS, Clientes. |
| **Bodeguero** | Personal de inventario. | Kardex, Lotes, Reorden, Entradas de stock. |

## Flujo de Impresión Térmica

Para la generación de recibos en tiendas físicas, el sistema usa un **PC Bridge**.
1. Abrir la URL `/bridge` en la PC físicamente conectada a la impresora de recibos.
2. Esta página queda en escucha constante usando **Supabase Realtime**.
3. Al cobrar en el POS desde cualquier terminal, el sistema inserta el registro en `print_queue`.
4. El PC Bridge recibe la alerta, renderiza el comprobante vía `iframe` silencioso y acciona `window.print()`.

## Proceso de Archivado de Datos

A través de GitHub Actions y la RPC `archive_old_data`, Zentory purga facturas cerradas (`status` = 'DELETED' o de mucha antigüedad) hacia la tabla inactiva de `sales_archive` sin RLS para aligerar la carga transaccional, automatizado el día 1 de cada mes.

---
Para más información de despliegue en Vercel y Rollbacks, consulta `DEPLOYMENT.md`.
