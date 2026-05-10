# Nequi — Pagos con Notificaciones Push

Resumen de la documentación de implementación para pagos mediante notificaciones push en Nequi.

## 1. Flujo General del Pago
El proceso es asíncrono y sigue estos pasos:
1.  **Iniciación**: El comercio invoca el servicio `unregisteredPayment`. Nequi envía una notificación push al celular del cliente vinculado a su cuenta.
2.  **Acción del Cliente**: El cliente abre la aplicación Nequi, revisa los detalles del pago y decide **aceptar** o **rechazar** la transacción.
3.  **Consulta de Estado**: Dado que la notificación es asíncrona, el comercio debe consultar el estado del pago mediante el servicio `getStatusPayment` para confirmar si fue exitoso.
4.  **Liquidación**: Si el pago es aprobado, el dinero se debita de la cuenta del cliente y se transfiere a la cuenta del comercio (generalmente al día siguiente).

---

## 2. Endpoints de la API

### A. Iniciar Pago (unregisteredPayment)
*   **URL**: `POST /payments/v2/-services-paymentservice-unregisteredpayment`
*   **Propósito**: Envía la solicitud de pago al cliente.
*   **Ejemplo de Request Body**:
    ```json
    {
      "RequestMessage": {
        "RequestHeader": {
          "Channel": "PNP04-C001",
          "RequestDate": "2017-06-21T20:26:12.654Z",
          "MessageID": "1234567890",
          "ClientID": "ABC12345",
          "Destination": {
            "ServiceName": "PaymentsService",
            "ServiceOperation": "unregisteredPayment",
            "ServiceRegion": "C001",
            "ServiceVersion": "1.0.0"
          }
        },
        "RequestBody": {
          "any": {
            "unregisteredPaymentRQ": {
              "phoneNumber": "3004455667",
              "value": "100",
              "reference1": "Referencia 1",
              "reference2": "Referencia 2",
              "reference3": "Referencia 3"
            }
          }
        }
      }
    }
    ```

### B. Consultar Estado (getStatusPayment)
*   **URL**: `POST /payments/v2/-services-paymentservice-getstatuspayment`
*   **Códigos de Estado comunes**:
    *   `33`: Pendiente (Aún no ha sido aceptado/rechazado).
    *   `35`: Realizado (Pago exitoso).
    *   `10-455`: Cancelado o rechazado por el cliente.
    *   `10-454`: Caducada (El cliente no respondió a tiempo).
    *   `71`: Fallida.

### C. Cancelar Pago (cancelUnregisteredPayment)
*   **URL**: `POST /payments/v2/-services-paymentservice-cancelunregisteredpayment`
*   **Propósito**: Permite al comercio cancelar una solicitud de pago que aún está pendiente.

### D. Reversar Transacción (reverseTransaction)
*   **URL**: `POST /payments/v2/-services-reverseservices-reversetransaction`
*   **Requisito Crítico**: El reverso debe solicitarse el **mismo día** en que se realizó la transacción original.

---

## 3. Requisitos Específicos
*   **Autenticación**: Es obligatorio incluir un token Bearer en el encabezado `Authorization` y una `x-api-key` válida obtenida desde el portal de Nequi Conecta.
*   **Campos de Referencia**: Permite hasta 3 referencias (`reference1`, `reference2`, `reference3`) para identificar el pedido en el sistema del comercio.
*   **Ambiente**: Los ejemplos utilizan el canal `PNP04-C001`, que es estándar para este tipo de integración.
