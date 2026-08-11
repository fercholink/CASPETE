# Módulo GPS (panel SUPER_ADMIN)

Todo lo relacionado con los localizadores GPS vive en un solo lugar: **`/gps`** en el
panel de administración, con pestañas. Antes eran 4 páginas separadas en el menú
(`/gps-payments`, `/gps-device-orders`, `/gps-gallery`, `/gps-geofences`); esos enlaces
viejos ahora redirigen automáticamente a `/gps`.

## Pestañas

| Pestaña | Qué hace | Archivo |
|---|---|---|
| 🔍 **Diagnóstico** | Buscar un estudiante por nombre y ver/probar/configurar su localizador: batería, señal, ICCID, estado de conexión, posición bajo demanda, SOS, alarma de despertador, configuración avanzada (LBS, sobrevelocidad, vibración, número de monitoreo), vincular a geocerca adicional, apagar, desvincular. | `frontend/src/pages/GpsAdminPage.tsx` (tab `DiagnosticoTab`) |
| 💳 **Pagos** | Aprobar/rechazar pagos de dispositivo y mensualidad del plan "solo GPS" (padres sin colegio afiliado). | `frontend/src/pages/GpsPaymentsPage.tsx` |
| 📦 **Pedidos** | Pedidos de compra del localizador hechos desde la landing (antes de que el padre tenga cuenta): confirmar pago, asignar IMEI real, marcar como enviado. | `frontend/src/pages/GpsDeviceOrdersPage.tsx` |
| 🖼️ **Galería** | Fotos del localizador que se muestran en la landing pública (`kidway.co/funcionalidades`). | `frontend/src/pages/GpsGalleryPage.tsx` |
| ▱ **Geocercas** | Geocercas adicionales (circulares o poligonales) más allá de la que se crea automáticamente por colegio — CRUD completo, dibujadas en un mapa Leaflet. | `frontend/src/pages/GpsGeofencesPage.tsx` |

## Arquitectura

- **`GpsAdminPage.tsx`** es la única página con nav + control de acceso SUPER_ADMIN;
  las 4 páginas anteriores ya no tienen su propio `<nav>` ni su propio gate de rol —
  se renderizan como contenido de pestaña dentro de `GpsAdminPage`.
- **`frontend/src/components/GpsTrackerPanel.tsx`** es el panel completo de un
  localizador (info + todas las acciones), extraído para que sea el mismo componente
  tanto en el modal "📍 GPS" del panel del padre (`StudentsPage.tsx`) como en la
  pestaña Diagnóstico del panel admin — un solo lugar para mantener esa lógica.
- Nada de esto agregó tablas nuevas a la base de datos; es reorganización de UI sobre
  endpoints que ya existían.

## Comandos disponibles (todos por la conexión de datos/TCP, no por SMS)

Ya existían antes de esta consolidación, ahora accesibles también desde Diagnóstico
sin pasar por un estudiante específico en `StudentsPage`:

- Posición bajo demanda, buscar tarjeta (sonido), apagar.
- SOS/papá/mamá, alarma de despertador (hasta 3 horarios).
- Configuración avanzada (solo SUPER_ADMIN): número de monitoreo, LBS on/off, umbral
  de sobrevelocidad, alarma de vibración.
- Vincular a geocerca adicional.

## ⚠️ Hallazgo de seguridad: no hay contraseña SMS en este modelo

Se investigó agregar una contraseña que impida que cualquier número le mande SMS al
dispositivo. **El manual real del fabricante (365GPS, "4G GPS Tracker User Manual")
documenta exactamente 10 comandos SMS — ninguno es para poner/cambiar contraseña:**

```
IMEI#, TIMER,X,Y#, TIMER#, SENDS,X#, STATIC,X#, RESET#, POWEROFF#, INFO#, APN,X,Y,Z#, FACTORY#
```

La gestión de contraseña de este modelo es exclusiva de la app móvil oficial del
fabricante, que depende de su servidor en la nube — y como el dispositivo ya apunta a
nuestro propio servidor (`SERVER,...#`), esa app dejó de aplicar.

**Implicación real:** cualquiera que tenga el número de la SIM podría, en teoría,
mandarle `FACTORY#` (borra la configuración, incluyendo a qué servidor apunta) o
`RESET#`. No hay forma de bloquear esto con contraseña en este modelo específico.

**Mitigación aplicada:**
1. El número de la SIM se trata como dato sensible — solo lo ve SUPER_ADMIN en el panel.

**Mitigación pendiente (no implementada aún, sugerida):**
2. Monitoreo: alertar si un dispositivo se desconecta y no vuelve a conectar en X
   tiempo — sería la señal de un `FACTORY#`/`RESET#` no autorizado, para reconfigurarlo
   rápido en vez de descubrirlo cuando el padre reporta "no veo la ubicación".
