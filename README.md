# ðŸŽ’ CASPETE - Loncheras Escolares Inteligentes

![Estado: PlanificaciÃ³n](https://img.shields.io/badge/Estado-Planificaci%C3%B3n-blue)
![VersiÃ³n: 1.0.0](https://img.shields.io/badge/Versi%C3%B3n-1.0.0-green)

## ðŸ“– VisiÃ³n General del Proyecto

**Caspete** es una plataforma SaaS multi-tenant diseÃ±ada para conectar a padres de familia, colegios y tiendas escolares. Su objetivo principal es gestionar la programaciÃ³n, pago y entrega de loncheras de forma digital, segura y sin manejo de efectivo.

### ðŸ’¡ Propuesta de Valor
* **Padres:** ProgramaciÃ³n de loncheras y pago digital anticipado (sin dar efectivo a los niÃ±os).
* **NiÃ±os:** Reclamo de sus loncheras usando su ID + una validaciÃ³n de seguridad (OTP verbal a travÃ©s de sus padres).
* **Tenderos:** PlanificaciÃ³n exacta de inventario y producciÃ³n para los recreos.
* **Colegios:** Control de consumo, salud nutricional y recaudos financieros.

---

## âš™ï¸ Arquitectura y Stack TecnolÃ³gico (Fase 1 - MVP PWA)

Basado en el documento de arquitectura, el proyecto iniciarÃ¡ con una **Plataforma Web / PWA** antes de escalar a aplicaciones mÃ³viles nativas.

### Capa de PresentaciÃ³n (Frontend)
* **Framework:** React 18 + TypeScript + Vite
* **Estilos:** Tailwind CSS (Recomendado para agilizar UI) o CSS Vainilla estructurado
* **Estrategia:** DiseÃ±o Mobile-First (PWA) para Padres/Tenderos, y vista Desktop para Administradores.

### Capa de Servicios (Backend API)
* **Entorno:** Node.js con Express o NestJS
* **Arquitectura:** Microservicios acoplados inicialmente o Monolito Modular (Auth, Users, Schools, Menus, Orders, Payments)
* **AutenticaciÃ³n:** JWT (JSON Web Tokens) + Control de Acceso por Roles (RBAC)

### Capa de Datos e Infraestructura
* **Base de Datos Principal:** PostgreSQL 16 (PatrÃ³n multi-tenant por columna `school_id`)
* **ORM:** Prisma
* **CachÃ© / OTP:** Redis 7
* **Almacenamiento (Fotos/Recibos):** AWS S3 o Cloudflare R2
* **Contenedores:** Docker

---

## ðŸ‘¥ Roles del Sistema

| Rol | CÃ³digo | Responsabilidad |
| :--- | :--- | :--- |
| **Padre / Madre** | `PARENT` | Registrar hijos, recargar saldo, programar loncheras. |
| **Estudiante** | `STUDENT` | (No tiene acceso a la plataforma) Reclama su lonchera en tienda. |
| **Tendero** | `VENDOR` | Ver despachos pendientes, validar ID + OTP, entregar lonchera. |
| **Admin Colegio** | `SCHOOL_ADMIN`| Gestionar tienda, minutas, reportes nutricionales y de recaudo. |
| **Super Admin** | `SUPER_ADMIN` | Administrar colegios, configuraciones globales. |

---

## ðŸš€ Hoja de Ruta - Fase MVP (Semanas 1 a 8)

### Semana 1-2: Base y Estructura
- [ ] InicializaciÃ³n del repositorio y estructura de carpetas.
- [ ] ConfiguraciÃ³n de PostgreSQL + Esquema inicial en Prisma.
- [ ] Setup de variables de entorno y utilidades globales.
- [ ] MÃ³dulo de AutenticaciÃ³n (Registro, Login, ValidaciÃ³n JWT).

### Semana 3-4: GestiÃ³n de Perfiles y MenÃºs
- [ ] MÃ³dulo de Usuarios: RelaciÃ³n Padre-Estudiante.
- [ ] MÃ³dulo de Colegios: GestiÃ³n de Tenants y configuraciÃ³n de tiendas.
- [ ] MÃ³dulo de MenÃºs: CreaciÃ³n de catÃ¡logo de productos y minutas semanales.

### Semana 5-6: NÃºcleo Transaccional (Loncheras)
- [ ] Flujo Web: ProgramaciÃ³n de Loncheras por parte del Padre.
- [ ] Panel Web del Tendero: Vista de Ã³rdenes pendientes del dÃ­a en tiempo real.
- [ ] GestiÃ³n de cÃ³digos OTP para entregas seguras (IntegraciÃ³n con Twilio/SMS o similar).

### Semana 7-8: Pagos y Lanzamiento
- [ ] IntegraciÃ³n con pasarela de pagos (Epayco / Mercado Pago) vÃ­a Webhooks.
- [ ] LÃ³gica de saldo en base de datos (Cargos, Recargas, Reembolsos).
- [ ] Pruebas funcionales E2E.
- [ ] Despliegue del MVP (Staging).

---

## ðŸ’» GuÃ­a para Desarrolladores

*(Esta secciÃ³n se completarÃ¡ conforme se estructuren los subproyectos de frontend y backend)*

```bash
# Ejemplo de inicializaciÃ³n esperada
npm install
npm run dev
```
