# Documentación de Integración Frontend — Microservicio de Tracking

Esta guía explica **cómo consumir el microservicio de Tracking desde el
frontend** (web o móvil): qué hace cada funcionalidad, qué eventos hay que
escuchar, qué eventos hay que emitir y ejemplos de código listos para usar.

---

## Tabla de contenidos

1. [Visión general](#1-visión-general)
2. [Instalación del cliente](#2-instalación-del-cliente)
3. [URL del servicio](#3-url-del-servicio)
4. [Autenticación (JWT RS256)](#4-autenticación-jwt-rs256)
5. [Conexión al socket](#5-conexión-al-socket)
6. [Gestión de salas (rooms)](#6-gestión-de-salas-rooms)
7. [Eventos — referencia completa](#7-eventos--referencia-completa)
8. [Flujo del conductor](#8-flujo-del-conductor)
9. [Flujo del pasajero](#9-flujo-del-pasajero)
10. [Recuperación de estado al reconectar](#10-recuperación-de-estado-al-reconectar)
11. [Manejo de errores](#11-manejo-de-errores)
12. [Reconexión automática](#12-reconexión-automática)
13. [Health-check (HTTP)](#13-health-check-http)
14. [Ejemplo completo en TypeScript](#14-ejemplo-completo-en-typescript)
15. [Checklist de integración](#15-checklist-de-integración)

---

## 1. Visión general

El microservicio de Tracking expone **dos canales**:

| Canal     | Tecnología | Uso                                      |
| --------- | ---------- | ---------------------------------------- |
| HTTP      | Express    | Solo health-check (`GET /health`)        |
| WebSocket | Socket.io  | Todo el flujo de tracking en tiempo real |

**El frontend NO hace llamadas HTTP para tracking**. Toda la comunicación
es por WebSocket (Socket.io). El único endpoint HTTP es `/health`, útil para
monitorización pero no para la app.

### Roles

El comportamiento depende del **rol** que venga en el JWT:

- **conductor** → puede **emitir** su ubicación y **finalizar** el tracking.
- **pasajero** → solo **recibe** la ubicación del conductor.

El rol lo determina el JWT (firmado por tu auth-service), **no** el frontend.
El frontend no decide quién es conductor; solo envía el token que recibió al
loguearse.

### ¿Qué hace el servidor por ti?

| Funcionalidad                          | ¿Quién la hace? | Notas                                                  |
| -------------------------------------- | --------------- | ------------------------------------------------------ |
| Validar el JWT                         | Servidor        | Rechaza la conexión si es inválido/expirado            |
| Validar permisos sobre el trayecto     | Servidor        | Consulta al microservicio de Trayectos por HTTP        |
| Unir al usuario a la sala del trayecto | Servidor        | Sala = `trayecto:<trayectoId>`                         |
| Cachear última ubicación en Redis      | Servidor        | TTL de 60s (configurable)                              |
| Broadcast a los pasajeros              | Servidor        | Al recibir `update_location` del conductor             |
| Enviar última ubicación al reconectar  | Servidor        | Cuando un pasajero se conecta, lee Redis y se la envía |

El frontend **solo** tiene que: conectarse, escuchar eventos y (si es
conductor) emitir `update_location`.

---

## 2. Instalación del cliente

### Web (React, Vue, Angular, vanilla JS)

```bash
npm install socket.io-client
```

### React Native

```bash
npm install socket.io-client
```

> Socket.io-client funciona en web y en React Native sin configuración extra.
> Para Flutter/Native se necesita una librería equivalente que hable el
> protocolo Socket.io (p.ej. `socket_io_client` en Dart).

---

## 3. URL del servicio

| Entorno        | URL                                         |
| -------------- | ------------------------------------------- |
| Local (docker) | `http://localhost:4003`                     |
| Local (node)   | `http://localhost:4003`                     |
| Producción     | `https://tracking.tu-dominio.com` (definir) |

> **Nota:** el puerto se configura con `PORT` en el `.env` del servicio.
> En tu configuración local está en **4003**.

---

## 4. Autenticación (JWT RS256)

El microservicio **verifica** tokens JWT firmados con **RS256**. Tu
auth-service los firma con su clave privada; este microservicio los verifica
con la clave pública correspondiente.

### Qué necesita el frontend

1. El **token JWT** del usuario logueado (lo obtienes al hacer login contra tu
   auth-service, igual que para el resto de microservicios).
2. El **`trayecto_id`** del trayecto en curso que se quiere trackear.

### Formato del JWT (payload)

El token debe contener **al menos** estos claims:

```json
{
  "sub": "user-123",                       // id del usuario
  "rol": "conductor" | "pasajero",         // rol del usuario
  "iat": 1690000000,
  "exp": 1690003600
}
```

- `sub` → id del usuario.
- `rol` → `"conductor"` o `"pasajero"`.
- El `trayecto_id` **no** va en el JWT; se pasa al conectar (ver §5).

### El token va con prefijo "Bearer " (opcional)

El servidor acepta el token **con o sin** el prefijo `Bearer `:

```js
// Ambas formas funcionan:
{ token: "eyJhbGciOi..." }              // sin prefijo
{ token: "Bearer eyJhbGciOi..." }       // con prefijo
```

Recomendado: **sin prefijo** dentro del campo `auth.token` (el prefijo es una
convención de HTTP, no de Socket.io).

---

## 5. Conexión al socket

### Forma recomendada: `auth` en el handshake

```js
import { io } from "socket.io-client";

const TRACKING_URL = "http://localhost:4003";
const token = "eyJhbGciOi...";           // JWT del usuario logueado
const trayectoId = "tray-123";           // id del trayecto en curso

const socket = io(TRACKING_URL, {
  auth: {
    token,                                // JWT (sin "Bearer ")
    trayecto_id: trayectoId,              // id del trayecto a trackear
  },
});
```

### Forma alternativa: `query` string

Útil si tu cliente no permite enviar `auth` (algunas librerías nativas):

```js
const socket = io(TRACKING_URL, {
  query: {
    token,
    trayecto_id: trayectoId,
  },
});
```

> El servidor soporta **ambas**. Si se envían las dos, gana `auth`.

### ¿Qué pasa al conectar?

El servidor ejecuta en orden:

1. **Verifica el JWT** (RS256 con la clave pública). Si falla → `connect_error`
   y la conexión se rechaza. El socket **no** se conecta.
2. **Valida permisos** sobre el trayecto consultando al microservicio de
   Trayectos. Si el usuario no es conductor/pasajero del trayecto, o el
   trayecto no está "En curso" → `error` + desconexión.
3. **Une al socket a la sala** `trayecto:<trayectoId>`.
4. **Si es pasajero**: lee Redis y le envía la última ubicación conocida
   inmediatamente (evento `location_updated` con `recovered: true`), o
   `no_location` si no hay ninguna.

Por eso **no necesitas un evento "join" explícito**: con enviar `trayecto_id`
en el handshake basta.

---

## 6. Gestión de salas (rooms)

El frontend **no gestiona salas manualmente**. El servidor:

- Crea la sala `trayecto:<trayectoId>` automáticamente.
- Une al usuario al conectar (si tiene permisos).
- Lo saca al desconectar.

El frontend solo indica **qué trayecto** quiere trackear vía `trayecto_id` en
el handshake. No hay que llamar a `socket.join()` ni emitir ningún evento de
"join room".

---

## 7. Eventos — referencia completa

### Eventos que el frontend **escucha** (server → client)

#### `location_updated`

Llega cuando hay una nueva ubicación del conductor, **o** cuando se recupera
la última cacheada al reconectar.

```ts
{
  trayectoId: string,
  lat: number,
  lng: number,
  conductorId: string,
  updatedAt: string,        // ISO 8601
  recovered?: boolean       // true = era estado cacheado, no un update live
}
```

- `recovered: true` → el pasajero se acaba de conectar y el servidor le manda
  la última posición que tenía Redis (puede tener varios segundos/minutos).
- `recovered` ausente o `false` → es un update **en vivo** del conductor.

**Cuándo llega:** a los **pasajeros**. Al conductor **no** le llega su propia
ubicación (el servidor no hace eco al emisor).

#### `no_location`

```ts
{ trayectoId: string }
```

Llega a un **pasajero** al conectarse si **no hay** ninguna ubicación
cacheada en Redis (el conductor todavía no ha emitido, o la cache expiró por
TTL). El frontend debería mostrar un estado "Esperando ubicación del
conductor…".

#### `tracking_ended`

```ts
{ trayectoId: string }
```

Lo emite el servidor cuando el conductor dispara `end_tracking`. Los
pasajeros deben dejar de pintar el mapa y mostrar "Trayecto finalizado".

#### `error`

```ts
{ message: string }
```

Error genérico de validación (p.ej. "Sin permiso para este trayecto",
"Falta trayecto_id en el handshake", "Solo el conductor puede emitir
ubicación"). Suele ir seguido de una desconexión del servidor.

---

### Eventos que el frontend **emite** (client → server)

#### `update_location`  — **solo conductor**

```ts
// Payload:
{ lat: number, lng: number }

// Ack (opcional, recomendado):
socket.emit("update_location", { lat, lng }, (ack) => {
  // ack = { ok: true, updatedAt: string } | { ok: false, error: string }
});
```

El conductor envía su posición actual. El servidor:

1. La cachea en Redis (clave `tracking:location:<trayectoId>`, TTL renovado).
2. Hace broadcast a los pasajeros de la sala (evento `location_updated`).

**Recomendación:** usa el **ack** (callback) para confirmar que el servidor
recibió y retransmitió. Si `ack.ok === false`, revisa `ack.error`.

**Frecuencia sugerida:** cada **3-5 segundos** (no más frecuente de lo
necesario; cada update renueva el TTL y dispara un broadcast).

#### `end_tracking`  — **solo conductor**

```ts
socket.emit("end_tracking");
// Sin payload, sin ack.
```

El conductor lo emite cuando finaliza el trayecto. El servidor:

1. Avisa a los pasajeros con `tracking_ended`.
2. Borra la cache de Redis.

Después de esto, los pasajeros deben desconectar su socket también.

---

## 8. Flujo del conductor

```js
// 1. Conectar
const socket = io(TRACKING_URL, {
  auth: { token, trayecto_id: trayectoId },
});

socket.on("connect", () => {
  console.log("Conectado como conductor");
});

socket.on("error", (err) => {
  console.error("Error:", err.message);
});

// 2. Emitir ubicación periódicamente
//    (usa el GPS del dispositivo: navigator.geolocation, expo-location, etc.)
function enviarUbicacion(lat, lng) {
  socket.emit("update_location", { lat, lng }, (ack) => {
    if (ack?.ok) {
      console.log("Ubicación enviada a las", ack.updatedAt);
    } else {
      console.warn("No se pudo enviar:", ack?.error);
    }
  });
}

// Ejemplo con navigator.geolocation (web):
const watchId = navigator.geolocation.watchPosition(
  (pos) => enviarUbicacion(pos.coords.latitude, pos.coords.longitude),
  (err) => console.error("GPS error:", err),
  { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 },
);

// 3. Finalizar el trayecto
function finalizarTrayecto() {
  socket.emit("end_tracking");
  socket.disconnect();
  navigator.geolocation.clearWatch(watchId);
}
```

### Reglas para el conductor

- **Solo** el conductor puede emitir `update_location` y `end_tracking`. Si un
  pasajero lo intenta, el servidor responde con `error` ("Solo el conductor
  puede emitir ubicación") y **no** propaga nada.
- El conductor **no** recibe `location_updated` de sí mismo.
- Si el conductor deja de emitir más de `LOCATION_TTL_SECONDS` (60s por
  defecto), la cache de Redis expira y los pasajeros que se conecten después
  recibirán `no_location`.

---

## 9. Flujo del pasajero

```js
// 1. Conectar
const socket = io(TRACKING_URL, {
  auth: { token, trayecto_id: trayectoId },
});

socket.on("connect", () => {
  console.log("Conectado como pasajero");
});

// 2. Escuchar ubicación (live + recuperada)
socket.on("location_updated", (data) => {
  if (data.recovered) {
    console.log("Estado recuperado del conductor:", data.lat, data.lng);
    // Mostrar en el mapa, pero quizás con un indicador "última known"
  } else {
    console.log("Nueva posición live:", data.lat, data.lng);
    // Actualizar el marcador del conductor en el mapa
  }
  // data.updatedAt te sirve para mostrar "hace X segundos"
});

// 3. No hay ubicación todavía
socket.on("no_location", (data) => {
  console.log("Esperando a que el conductor empiece a emitir...");
  // Mostrar estado "Esperando ubicación del conductor…"
});

// 4. El conductor finalizó
socket.on("tracking_ended", (data) => {
  console.log("El trayecto finalizó");
  socket.disconnect();
});

// 5. Errores
socket.on("error", (err) => {
  console.error("Error:", err.message);
});
```

### Reglas para el pasajero

- **No** emite `update_location` ni `end_tracking`.
- Al conectarse, recibe **inmediatamente** la última ubicación cacheada (si la
  hay) con `recovered: true`. Esto cubre el caso de reconexión tras una
  desconexión temporal (ver §10).
- Si no hay cache, recibe `no_location` y debe esperar al primer
  `location_updated` live.

---

## 10. Recuperación de estado al reconectar

Escenario típico: el pasajero pierde señal (entra a un túnel, cambia de red,
la app pasa a segundo plano). El socket se desconecta. Cuando vuelve la
conexión:

1. Socket.io **reconecta automáticamente** (ver §12).
2. El servidor vuelve a ejecutar el handshake: valida JWT + permisos + lo une
   a la sala.
3. El servidor lee Redis y le envía `location_updated` con `recovered: true`
   inmediatamente, **sin** esperar al próximo `update_location` del conductor.

El frontend **no tiene que hacer nada especial**: el mismo handler de
`location_updated` ya cubre el caso, gracias al flag `recovered`.

### Cómo pintar la diferencia (sugerencia UX)

```js
socket.on("location_updated", (data) => {
  if (data.recovered) {
    // Marcador en gris/azul con etiqueta "Última posición conocida"
    // + timestamp data.updatedAt
    mostrarMarcador(data, { estilo: "cacheado" });
  } else {
    // Marcador verde en movimiento, animación suave hasta la nueva posición
    mostrarMarcador(data, { estilo: "live" });
  }
});
```

---

## 11. Manejo de errores

### Errores de conexión (`connect_error`)

Se disparan **antes** de que el socket se conecte, cuando el handshake falla.
El servidor envía mensajes con **códigos prefijados** para que el frontend
pueda reaccionar:

| Código                      | Significado                             | Qué hacer en el frontend                    |
| --------------------------- | --------------------------------------- | ------------------------------------------- |
| `AUTH_NO_TOKEN`             | No se envió token                       | Redirigir a login                           |
| `AUTH_EXPIRED`              | Token expirado                          | Refrescar token o redirigir a login         |
| `AUTH_INVALID`              | Token inválido (firma mala, malformado) | Redirigir a login                           |
| `AUTH_SERVER_MISCONFIGURED` | El servidor no tiene la clave pública   | Error del backend; mostrar mensaje genérico |
| (sin prefijo)               | "Sin permiso para este trayecto" etc.   | Mostrar mensaje; el servidor desconectará   |

```js
socket.on("connect_error", (err) => {
  const msg = err.message; // p.ej. "AUTH_EXPIRED: token expirado"
  const code = msg.split(":")[0]; // "AUTH_EXPIRED"

  if (code === "AUTH_EXPIRED" || code === "AUTH_INVALID" || code === "AUTH_NO_TOKEN") {
    // Refrescar token o redirigir a login
    redirigirALogin();
  } else {
    // Otro error de permisos / configuración
    mostrarToast(msg);
  }
});
```

### Errores en runtime (`error`)

Llegan **después** de conectar, cuando algo falla en el ciclo de vida (p.ej.
el usuario intenta emitir `update_location` siendo pasajero):

```js
socket.on("error", (err) => {
  // err.message ej: "Solo el conductor puede emitir ubicación"
  mostrarToast(err.message);
});
```

### Errores de validación de coordenadas

Si el conductor envía `lat`/`lng` inválidas (no numéricas, fuera de rango), el
servidor:

- Emite `error` con mensaje "Coordenadas inválidas".
- Devuelve `ack` con `{ ok: false, error: "coordenadas inválidas" }` (si se
  usó callback).

```js
socket.emit("update_location", { lat, lng }, (ack) => {
  if (!ack.ok) {
    console.warn("Servidor rechazó la coordenada:", ack.error);
  }
});
```

---

## 12. Reconexión automática

Socket.io-client **reconecta solo** por defecto. No necesitas implementar
lógica de reconexión. Parámetros por defecto:

- `reconnection: true`
- `reconnectionAttempts: Infinity`
- `reconnectionDelay: 1000` (backoff exponencial)
- `reconnectionDelayMax: 5000`

Puedes ajustarlos:

```js
const socket = io(TRACKING_URL, {
  auth: { token, trayecto_id: trayectoId },
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});
```

### Eventos útiles de reconexión

```js
socket.on("disconnect", (reason) => {
  console.log("Desconectado:", reason);
  // "transport error", "ping timeout", "transport close", "io server disconnect"
});

socket.on("connect_error", (err) => {
  // Ver §11
});

socket.io.on("reconnect_attempt", (attempt) => {
  console.log("Reintento #", attempt);
});

socket.io.on("reconnect", (attempt) => {
  console.log("Reconectado tras", attempt, "intentos");
  // El servidor ya enviará location_updated con recovered=true si aplica
});
```

### Importante: el token al reconectar

Socket.io reutiliza el `auth` original al reconectar. **Si el token expira**
mientras el socket está abierto, la reconexión fallará con `AUTH_EXPIRED`.

**Solución:** refrescar el token antes de que expire, o al detectar
`AUTH_EXPIRED` en `connect_error`, obtener un token nuevo y reconectar:

```js
socket.on("connect_error", async (err) => {
  if (err.message.startsWith("AUTH_EXPIRED")) {
    const nuevoToken = await refrescarToken(); // tu lógica de refresh
    socket.auth = { token: nuevoToken, trayecto_id: trayectoId };
    socket.connect(); // reintentar con el token nuevo
  }
});
```

> `socket.auth` es mutable: actualizarlo y llamar `socket.connect()` reusa el
> nuevo `auth` en el próximo handshake.

---

## 13. Health-check (HTTP)

Único endpoint HTTP. **No** es necesario para la app, pero útil para
monitorización / k8s probes.

```bash
GET http://localhost:4003/health
```

```json
{
  "status": "ok",
  "redis": "PONG",
  "uptime": 35.55
}
```

Si Redis está caído:

```json
{
  "status": "degraded",
  "redis": "down",
  "error": "..."
}
```

(HTTP 503 en ese caso.)

---

## 14. Ejemplo completo en TypeScript

```ts
// trackingClient.ts
import { io, Socket } from "socket.io-client";

export type Rol = "conductor" | "pasajero";

export interface LocationUpdated {
  trayectoId: string;
  lat: number;
  lng: number;
  conductorId: string;
  updatedAt: string;
  recovered?: boolean;
}

export interface NoLocation {
  trayectoId: string;
}

export interface TrackingEnded {
  trayectoId: string;
}

export interface ServerError {
  message: string;
}

export interface UpdateAck {
  ok: boolean;
  updatedAt?: string;
  error?: string;
}

export interface TrackingClientOptions {
  url: string;
  token: string;
  trayectoId: string;
  onLocationUpdated?: (data: LocationUpdated) => void;
  onNoLocation?: (data: NoLocation) => void;
  onTrackingEnded?: (data: TrackingEnded) => void;
  onError?: (err: ServerError) => void;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onConnectError?: (err: Error) => void;
  onTokenExpired?: () => Promise<string>; // devuelve token nuevo
}

export class TrackingClient {
  private socket: Socket;
  private opts: TrackingClientOptions;

  constructor(opts: TrackingClientOptions) {
    this.opts = opts;
    this.socket = io(opts.url, {
      auth: { token: opts.token, trayecto_id: opts.trayectoId },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.bindEvents();
  }

  private bindEvents() {
    this.socket.on("connect", () => this.opts.onConnect?.());
    this.socket.on("disconnect", (r) => this.opts.onDisconnect?.(r));
    this.socket.on("location_updated", (d: LocationUpdated) => this.opts.onLocationUpdated?.(d));
    this.socket.on("no_location", (d: NoLocation) => this.opts.onNoLocation?.(d));
    this.socket.on("tracking_ended", (d: TrackingEnded) => this.opts.onTrackingEnded?.(d));
    this.socket.on("error", (e: ServerError) => this.opts.onError?.(e));

    this.socket.on("connect_error", async (err: Error) => {
      if (err.message.startsWith("AUTH_EXPIRED") && this.opts.onTokenExpired) {
        const nuevoToken = await this.opts.onTokenExpired();
        this.socket.auth = { token: nuevoToken, trayecto_id: this.opts.trayectoId };
        this.socket.connect();
        return;
      }
      this.opts.onConnectError?.(err);
    });
  }

  /** Solo conductor. Envía una posición. */
  updateLocation(lat: number, lng: number): Promise<UpdateAck> {
    return new Promise((resolve) => {
      this.socket.emit("update_location", { lat, lng }, (ack: UpdateAck) => resolve(ack));
    });
  }

  /** Solo conductor. Finaliza el tracking del trayecto. */
  endTracking(): void {
    this.socket.emit("end_tracking");
  }

  disconnect(): void {
    this.socket.disconnect();
  }

  get connected(): boolean {
    return this.socket.connected;
  }
}
```

### Uso desde un componente React

```tsx
import { useEffect, useRef } from "react";
import { TrackingClient } from "./trackingClient";

function TripMap({ token, trayectoId, rol }: { token: string; trayectoId: string; rol: Rol }) {
  const clientRef = useRef<TrackingClient | null>(null);

  useEffect(() => {
    const client = new TrackingClient({
      url: "http://localhost:4003",
      token,
      trayectoId,
      onConnect: () => console.log("Conectado a tracking"),
      onLocationUpdated: (data) => {
        // Actualizar estado del mapa con data.lat / data.lng
        // data.recovered indica si es estado cacheado o live
      },
      onNoLocation: () => {
        // Mostrar "Esperando ubicación del conductor…"
      },
      onTrackingEnded: () => {
        // Mostrar "Trayecto finalizado"
      },
      onError: (err) => console.error(err.message),
      onConnectError: (err) => console.error("connect_error:", err.message),
      onTokenExpired: async () => {
        const nuevo = await refreshToken(); // tu función
        return nuevo;
      },
    });

    clientRef.current = client;

    // Si soy conductor, empezar a emitir GPS
    if (rol === "conductor") {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => client.updateLocation(pos.coords.latitude, pos.coords.longitude),
        (err) => console.error(err),
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 },
      );
      return () => {
        navigator.geolocation.clearWatch(watchId);
        client.disconnect();
      };
    }

    return () => client.disconnect();
  }, [token, trayectoId, rol]);

  return <div id="map">{/* tu mapa */}</div>;
}
```

---

## 15. Checklist de integración

Antes de dar por cerrada la integración del frontend, verifica:

- [ ] **Token JWT** obtenido del auth-service y pasado en `auth.token`.
- [ ] **`trayecto_id`** pasado en `auth.trayecto_id` (no en el JWT).
- [ ] **`connect_error`** manejado: códigos `AUTH_*` → redirigir a login o
      refrescar token.
- [ ] **`location_updated`** manejado, distinguiendo `recovered: true` (cache)
      vs `false`/ausente (live).
- [ ] **`no_location`** manejado (estado "esperando al conductor").
- [ ] **`tracking_ended`** manejado (desconectar y mostrar "finalizado").
- [ ] **`error`** manejado (toast / log).
- [ ] **Conductor**: `update_location` emitido con `watchPosition` y **ack**
      verificado.
- [ ] **Conductor**: `end_tracking` emitido al finalizar el trayecto.
- [ ] **Reconexión**: token refrescado al recibir `AUTH_EXPIRED` y
      `socket.connect()` reintentado.
- [ ] **Limpieza**: `socket.disconnect()` al desmontar el componente / salir
      de la pantalla del trayecto.
- [ ] **Frecuencia de envío** (conductor): 3-5s, no más frecuente de lo
      necesario.

---

## Resumen rápido (chuleta)

```
Conectar:    io(URL, { auth: { token, trayecto_id } })

Conductor emite:
  socket.emit("update_location", { lat, lng }, ack => ...)
  socket.emit("end_tracking")

Pasajero escucha:
  location_updated  -> { trayectoId, lat, lng, conductorId, updatedAt, recovered? }
  no_location       -> { trayectoId }
  tracking_ended    -> { trayectoId }

Todos escuchan:
  error             -> { message }
  connect_error     -> err.message empieza por "AUTH_*"
```
