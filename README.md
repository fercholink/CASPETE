# CASPETE - Ecosistema Digital Escolar

**Eslogan:** Nutrición segura, futuro digital.

Este repositorio contiene el código fuente completo del ecosistema CASPETE, una plataforma SaaS B2B2C diseñada para digitalizar la economía de las tiendas escolares, controlar la nutrición de los estudiantes (Ley 2120) y conectar tenderos con proveedores locales.

## 🏗️ Arquitectura del Proyecto (Stack Moderno)

El proyecto está estructurado con una arquitectura Headless (API separada de las vistas):

*   **Backend (API Central):** Laravel (PHP). Encargado de la lógica de negocio, validaciones complejas de la Ley 2120, integración con pasarelas de pago y seguridad.
*   **Base de Datos & Realtime:** Supabase (PostgreSQL). Laravel se conecta a Supabase de forma nativa. Usaremos las capacidades Realtime de Supabase para que el POS del tendero se actualice instantáneamente cuando un padre recargue saldo.
*   **Web POS & Admin (B2B):** React.js / Next.js. Consume la API de Laravel y usa el cliente de Supabase para eventos en tiempo real.
*   **Mobile App (B2C):** React Native (Expo) para padres y estudiantes.

## 📋 Requisitos Previos

Antes de comenzar con el despliegue local o en producción, asegúrate de tener instalados los siguientes elementos:

*   **PHP** (8.2 o superior) y **Composer**.
*   **Node.js** (v18.x o superior) para compilar los frontends.
*   **Supabase CLI** (Opcional para desarrollo local, o usar el proyecto directo en Supabase Cloud).

### Cuentas de Terceros necesarias:

*   **Supabase:** Proyecto creado para obtener las credenciales de base de datos.
*   **Pasarela de Pagos:** ePayco o Mercado Pago.
*   **Servidor PHP:** Laravel Forge, Vapor, o un VPS (DigitalOcean/AWS).
*   **Vercel / Expo:** Para los despliegues de Frontend y Mobile.

## ⚙️ Variables de Entorno (.env)

### 1. BACKEND - Laravel (`.env`)

Laravel se conectará directamente a la cadena de conexión de PostgreSQL proporcionada por Supabase.

```env
APP_NAME=Caspete
APP_ENV=production
APP_KEY=base64:tu_llave_laravel_aqui
APP_DEBUG=false
APP_URL=https://api.caspete.com

# ==========================================
# CONEXIÓN A SUPABASE (PostgreSQL)
# ==========================================
DB_CONNECTION=pgsql
DB_HOST=aws-0-us-east-1.pooler.supabase.com
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres.tu_project_id
DB_PASSWORD=tu_password_de_supabase

# Pasarela de Pagos
MP_ACCESS_TOKEN="APP_USR-123456789-XXXXXX"

# Notificaciones (Ej: Firebase o Pusher)
PUSH_AUTH_KEY="tu_llave_aqui"
```

### 2. FRONTEND WEB / MOBILE (`.env.local`)

Los clientes frontend consumirán la API de Laravel y el cliente de Supabase (para webhooks o realtime).

```env
# API de Laravel
NEXT_PUBLIC_API_URL="https://api.caspete.com/api/v1"

# Supabase (Para Realtime UI y Auth delegada)
NEXT_PUBLIC_SUPABASE_URL="https://tu_project_id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="tu_anon_key_aqui"
```

## 🚀 Guía de Despliegue

### 1. Configuración Inicial (Supabase & Laravel)

1.  Crea un nuevo proyecto en Supabase.
2.  Ve a **Configuración de Base de Datos** y copia la Connection String (URI).
3.  En la raíz de tu proyecto Laravel, ejecuta las migraciones para crear las tablas en Supabase:

```bash
cd backend-laravel
composer install
php artisan migrate
php artisan db:seed # Opcional: para cargar productos y alergias de prueba
```

### 2. Despliegue del Backend (Laravel API)

Para producción, se recomienda una plataforma gestionada para PHP:

**Opción A (Laravel Forge - Recomendado):**

1.  Conecta tu VPS (DigitalOcean, AWS, Linode) a Laravel Forge.
2.  Crea un nuevo sitio apuntando a la carpeta `/public` del repositorio.
3.  Instala el certificado SSL (Let's Encrypt).
4.  Configura el script de despliegue (`git pull`, `composer install`, `php artisan migrate --force`).

### 3. Despliegue del Frontend Web (Next.js)

1.  Conecta tu repositorio a Vercel.
2.  Selecciona el directorio raíz de la aplicación web B2B.
3.  Configura las variables de entorno de la API de Laravel y Supabase.
4.  Haz clic en **Deploy**.

### 4. Despliegue de la App Móvil (React Native)

Utilizamos Expo y EAS para generar los binarios:

```bash
# Instala la CLI de EAS:
npm install -g eas-cli

# Configura el proyecto e inicia el build:
cd apps/mobile
eas build --platform android --profile production
eas build --platform ios --profile production
```

## 🛡️ Consideraciones Críticas (Producción)

*   **Gestión de Redes en Colegios (Sincronización POS):** Para mitigar caídas de red en las tiendas escolares, el POS en Next.js debe cachear el inventario localmente. Es vital recordar que Caspete cuenta con la alianza de **Netslink SAS** para asegurar conectividad. Se debe tener en cuenta contractualmente que el servicio de Netslink no es un servicio dedicado por defecto (el precio cambia si se requiere uno), no se entrega con IP /30 (tiene costo adicional), y al ser banda ancha, se gestiona con control de reúso. Cualquiera de las partes puede terminar el contrato en cualquier momento.
*   **Supabase Realtime:** Configura el dashboard de Supabase para activar **Replication** únicamente en las tablas de `transactions` y `wallet_balances`. Esto evitará sobrecargar el servidor con eventos innecesarios y permitirá que la pantalla del tendero se actualice mágicamente cuando el padre recargue por PSE.
*   **Seguridad (Laravel Sanctum):** Ya que usaremos una API separada, asegúrate de configurar **Laravel Sanctum** para manejar la autenticación de la App Móvil y el panel Web mediante tokens (API Tokens).
