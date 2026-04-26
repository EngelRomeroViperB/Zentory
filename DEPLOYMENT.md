# Guía de Despliegue en Producción (Zentory)

Zentory está optimizado para su alojamiento en **Vercel** usando Server Actions y componentes SSR, interactuando con **Supabase** como proveedor de base de datos relacional.

## Instrucciones Específicas para Vercel

1. Desde tu panel de Vercel, importa tu repositorio Git.
2. Omite la configuración automática de variables y dirígete al panel de `Environment Variables` antes de desplegar.
3. Asegúrate de que el Node.js Target sea `18.x` o superior.

## Variables de Entorno en Vercel

Asigna las siguientes claves exactamente como están descritas (sin el prefijo `NEXT_PUBLIC_` para los secretos internos):

```env
# URL de la aplicación productiva
NEXT_PUBLIC_APP_URL=https://www.zentory-app.com

# Supabase (Visibles para la web app)
NEXT_PUBLIC_SUPABASE_URL=https://<TU-PROJECT-ID>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Secrets del Servidor
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Negocio
NEXT_PUBLIC_BUSINESS_NAME="Tu Negocio"
NEXT_PUBLIC_BUSINESS_NIT="12345678-9"
NEXT_PUBLIC_BUSINESS_ADDRESS="Av. Principal"
NEXT_PUBLIC_DEFAULT_TAX_RATE=19

# Sentry (Opcional, pero recomendado)
SENTRY_DSN=https://...
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_AUTH_TOKEN=sntrys_...
```

## Configuración de Dominio Custom con SSL

1. En Vercel, ve a **Settings > Domains**.
2. Añade tu dominio o subdominio (ej. `app.midominio.com`).
3. Vercel te proveerá el registro CNAME o A records necesarios para añadir en tu gestor de DNS (Cloudflare, GoDaddy, etc.).
4. El SSL se generará de forma automática y gratuita (Let's Encrypt).

## Configuración de Sentry

1. En tu archivo `next.config.mjs`, envuelve tu configuración con `withSentryConfig`.
2. Sentry reportará errores nativos en la interfaz y capturará excepciones lanzadas por `next-safe-action` omitiendo los stack traces sensibles al usuario final.

## Base de Datos (Migraciones)

Para impactar la base de datos de producción:

1. Asocia tu proyecto local al entorno de la nube:
   ```bash
   supabase link --project-ref <TU-PROJECT-ID>
   ```
2. Ejecuta las migraciones hacia la nube asegurando la clave de la base de datos remota:
   ```bash
   supabase db push
   ```

## Procedimiento de Rollback

En caso de un incidente grave derivado de un despliegue erróneo:

1. **Rollback de Código (Vercel):** En el panel principal del proyecto, pestaña `Deployments`, selecciona el último despliegue exitoso y haz click en los tres puntos > `Promote to Production` o `Redeploy`.
2. **Rollback de Base de Datos:**
   Si corrompiste la BD por un cambio de migración, usa el Point in Time Recovery (PITR) de Supabase (requiere plan Pro) para restaurar la base de datos hasta 1 minuto antes del fallo:
   - Panel Supabase -> Database -> Backups -> PITR -> Seleccionar tiempo.
   Si estás en Plan Free, puedes ejecutar scripts compensatorios para deshacer los cambios estructurales manualmente (usando `DROP TABLE` o revirtiendo columnas).
