# Proyecto CASPETE

Este es un proyecto basado en [Laravel](https://laravel.com/), un framework de aplicaciones web en PHP con una sintaxis expresiva y elegante.

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalados los siguientes componentes en tu sistema:
- PHP >= 8.1
- [Composer](https://getcomposer.org/)
- [Node.js](https://nodejs.org/) y NPM
- Un servidor de base de datos (MySQL, PostgreSQL, SQLite, etc.)

## Instalación

Sigue estos pasos para configurar el proyecto en tu máquina local:

1. **Clona el repositorio** (si aplica) o inicializa tu proyecto.
2. **Instala las dependencias de PHP** mediante Composer:
   ```bash
   composer install
   ```
3. **Instala las dependencias de Frontend** mediante NPM:
   ```bash
   npm install
   npm run build
   ```
4. **Configura el entorno**:
   Copia el archivo de ejemplo para crear tu configuración local:
   ```bash
   cp .env.example .env
   ```
   *Nota: Asegúrate de configurar las credenciales de tu base de datos en el archivo `.env`.*
5. **Genera la clave de la aplicación**:
   ```bash
   php artisan key:generate
   ```
6. **Ejecuta las migraciones** (para preparar tu base de datos):
   ```bash
   php artisan migrate
   ```

## Ejecución en el Entorno Local

Para iniciar el servidor de desarrollo en tu entorno local, ejecuta:
```bash
php artisan serve
```
Y visita `http://localhost:8000` en tu navegador.

## Estructura del Proyecto

La estructura de carpetas estándar de Laravel está organizada de la siguiente manera:
- `app/`: Lógica central de la aplicación (Modelos, Controladores).
- `routes/`: Definición de las rutas web (`web.php`) y del API (`api.php`).
- `database/`: Migraciones y seeders de la base de datos.
- `resources/`: Vistas (Blade), archivos SCSS/CSS en crudo y JavaScript.
- `public/`: Archivos accesibles públicamente e index de la aplicación.

## Licencia

[Describe aquí la licencia bajo la que se publicará el Proyecto CASPETE]
