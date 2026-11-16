# API de Feedback y Buzón de Sugerencias (`/api/feedback` y `/api/admin/feedback`)

Documentación técnica y especificación de contratos de la API REST para el sistema de **Feedback de YouConnext**. Incluye tanto los endpoints de consumo para clientes (App Móvil y Web) como los endpoints de gestión y supervisión para el Panel de Administración (Back-Office).

---

## 1. Arquitectura General y Roles de Acceso

```mermaid
flowchart LR
    subgraph Clientes ["Clientes (Móvil / Web)"]
        App["YouConnextApp"]
    end

    subgraph BackOffice ["Back-Office (Admin Web)"]
        AdminUI["Panel de Administración"]
    end

    subgraph API ["API REST (carpooling-user)"]
        PublicRouter["/api/feedback/*"]
        AdminRouter["/api/admin/feedback/*"]
    end

    subgraph Persistencia ["Base de Datos MySQL"]
        DB[(Tablas Feedback)]
    end

    App -->|Pública / Bearer| PublicRouter
    AdminUI -->|Bearer (onlyAdmin)| AdminRouter
    PublicRouter --> DB
    AdminRouter --> DB
```

### Matriz de Acceso (RBAC)

| Endpoint | Método | Acceso Requerido | Rol Mínimo |
| :--- | :--- | :--- | :--- |
| `/api/feedback/categories` | `GET` | Público | Cualquiera (Sin auth requerida) |
| `/api/feedback` | `POST` | Autenticado | Usuario registrado o Empresa (`user` o `enterprise`) |
| `/api/feedback/mine` | `GET` | Autenticado | Usuario registrado o Empresa (`user` o `enterprise`) |
| `/api/feedback/:id/confirm-resolution` | `POST` | Autenticado | **Solo Usuario Autor** (requiere `pending_verification`) |
| `/api/feedback/:id/reject-resolution` | `POST` | Autenticado | **Solo Usuario Autor** (requiere `pending_verification`) |
| `/api/admin/feedback` | `GET` | Autenticado Admin | `SUPPORT_AGENT`, `ADMIN`, `SUPER_ADMIN` |
| `/api/admin/feedback/:id` | `GET` | Autenticado Admin | `SUPPORT_AGENT`, `ADMIN`, `SUPER_ADMIN` |
| `/api/admin/feedback/:id/status` | `PATCH` | Autenticado Admin | `SUPPORT_AGENT`, `ADMIN`, `SUPER_ADMIN` (Bloqueado para `resolved`) |
| `/api/admin/feedback/:id/notes` | `POST` | Autenticado Admin | `SUPPORT_AGENT`, `ADMIN`, `SUPER_ADMIN` |
| `/api/admin/feedback/metrics` | `GET` | Autenticado Admin | `ADMIN`, `SUPER_ADMIN`, `PRODUCT_MANAGER` |
| `/api/admin/feedback/categories` | `GET, POST, PUT, DELETE`| Autenticado Admin | `ADMIN`, `SUPER_ADMIN` |

---

## 2. Endpoints de Cliente (App Móvil y Web)

### 2.1. Obtener Metadatos y Categorías Dinámicas
Permite a los clientes descubrir el catálogo de categorías vigente y los textos informativos gobernados desde el servidor (*Zero-Deploy Updates*).

- **URL:** `GET /api/feedback/categories`
- **Autenticación:** Opcional / Pública.
- **Cabeceras de Respuesta:** `Cache-Control: public, max-age=3600`

#### Respuesta Exitosa (`200 OK`):
```json
{
  "status": "Success",
  "data": {
    "title": "Buzón de Sugerencias y Feedback",
    "description": "Tu opinión es fundamental para nosotros. Envíanos tus comentarios, reportes de fallos o propuestas de nuevas funciones para seguir mejorando YouConnext.",
    "maxTitleLength": 150,
    "maxMessageLength": 1024,
    "categories": [
      {
        "id": "bug",
        "label": "Reportar un fallo",
        "description": "Informa sobre errores técnicos, pantallas rotas o mal funcionamiento.",
        "icon": "bug",
        "color": "#E74C3C"
      },
      {
        "id": "improvement",
        "label": "Propuesta de mejora",
        "description": "Sugiere nuevas características o ideas para la plataforma.",
        "icon": "lightbulb",
        "color": "#0B7A3B"
      },
      {
        "id": "usability",
        "label": "Experiencia de uso (Diseño)",
        "description": "Comenta sobre la navegación, facilidad de uso o diseño visual.",
        "icon": "sparkles",
        "color": "#0EA5E9"
      },
      {
        "id": "performance",
        "label": "Rendimiento y velocidad",
        "description": "Reporta tiempos de carga lentos o problemas de respuesta.",
        "icon": "gauge",
        "color": "#F2A33C"
      },
      {
        "id": "service",
        "label": "Servicio de Carpooling",
        "description": "Feedback relacionado con reservas, cancelaciones o trayectos.",
        "icon": "car",
        "color": "#8E44AD"
      },
      {
        "id": "organization",
        "label": "Gestión Corporativa",
        "description": "Específico para administradores y empleados de organizaciones.",
        "icon": "building",
        "color": "#2C3E50"
      },
      {
        "id": "other",
        "label": "Otros comentarios",
        "description": "Cualquier otra inquietud o mensaje general.",
        "icon": "message-square",
        "color": "#4A5753"
      }
    ]
  }
}
```

---

### 2.2. Enviar Nuevo Feedback
Registra una incidencia, sugerencia o comentario de un usuario u organización.

- **URL:** `POST /api/feedback`
- **Autenticación:** Obligatoria (`Authorization: Bearer <access_token>`).
- **Rate Limit:** 5 peticiones cada 15 minutos por usuario/IP.
- **Seguridad:** Sanitización automática contra inyección XSS (`<script>`, eventos HTML, etc.).

#### Cuerpo de la Petición (`Request Body`):
```json
{
  "title": "Fallo al validar billete QR",
  "category": "bug",
  "message": "Cuando el pasajero muestra el código QR en un garaje subterráneo sin cobertura, el lector no responde."
}
```

| Campo | Tipo | Requerido | Restricciones |
| :--- | :--- | :--- | :--- |
| `title` | `String` | Opcional / Recomendado | Mínimo 3, máximo 150 caracteres. |
| `category` | `String` | Sí | Debe coincidir con un `id` activo en la base de datos. |
| `message` | `String` | Sí | Mínimo 10, máximo 1024 caracteres. |

#### Respuestas:
- **`201 Created`**:
```json
{
  "status": "Success",
  "message": "Feedback enviado correctamente. Gracias por ayudarnos a mejorar.",
  "data": {
    "id": "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
    "title": "Fallo al validar billete QR",
    "category": "bug",
    "status": "pending",
    "author_type": "user",
    "created_at": "2026-11-16T12:00:00.000Z"
  }
}
```
- **`400 Bad Request`**: Error de validación en los campos enviados.
- **`401 Unauthorized`**: Token ausente, corrupto o expirado.
- **`429 Too Many Requests`**:
```json
{
  "status": "Error",
  "code": "FEEDBACK_RATE_LIMIT",
  "message": "Has superado el límite de envíos de feedback. Por favor, espera 15 minutos antes de enviar un nuevo comentario."
}
```

---

### 2.3. Listar Feedbacks Propios del Usuario
Devuelve la lista de consultas y feedbacks creados por el autor autenticado, indicando el estado del ciclo de vida y si requiere acción de verificación.

- **URL:** `GET /api/feedback/mine`
- **Autenticación:** Obligatoria (`Authorization: Bearer <access_token>`).

#### Respuesta Exitosa (`200 OK`):
```json
{
  "status": "Success",
  "data": {
    "feedbacks": [
      {
        "id": "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
        "title": "Fallo al validar billete QR",
        "category": "bug",
        "message": "Cuando el pasajero muestra el código QR en un garaje subterráneo...",
        "status": "pending_verification",
        "requires_user_action": true,
        "admin_notes": "Hemos desplegado la versión v1.0.1 con validación criptográfica offline.",
        "created_at": "2026-11-16T12:00:00.000Z",
        "updated_at": "2026-11-16T13:30:00.000Z"
      }
    ]
  }
}
```

---

### 2.4. Confirmar Resolución de Feedback (Exclusivo Usuario Autor)
Permite al autor verificar y confirmar que el cambio desplegado en `pending_verification` ha resuelto su problema, transicionando el estado a **`resolved`**.

- **URL:** `POST /api/feedback/:id/confirm-resolution`
- **Autenticación:** Obligatoria (`Authorization: Bearer <access_token>`).
- **Restricción:** Solo el usuario o empresa que creó el feedback puede confirmarlo. Requiere que el feedback esté en estado `pending_verification`.

#### Cuerpo de la Petición (`Request Body`):
```json
{
  "comment": "Comprobado en el garaje subterráneo y ya valida el billete correctamente. ¡Muchas gracias!"
}
```

#### Respuesta Exitosa (`200 OK`):
```json
{
  "status": "Success",
  "message": "Resolución confirmada con éxito. Gracias por colaborar con YouConnext.",
  "data": {
    "id": "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
    "status": "resolved",
    "resolved_at": "2026-11-16T14:15:00.000Z"
  }
}
```

---

### 2.5. Rechazar Resolución de Feedback (Exclusivo Usuario Autor)
Si el cambio desplegado aún no soluciona el problema, el usuario autor puede devolver el feedback a **`in_progress`** aportando una explicación de lo que sigue fallando.

- **URL:** `POST /api/feedback/:id/reject-resolution`
- **Autenticación:** Obligatoria (`Authorization: Bearer <access_token>`).
- **Restricción:** Solo el usuario autor. Requiere estado actual `pending_verification`.

#### Cuerpo de la Petición (`Request Body`):
```json
{
  "reason": "Sigue fallando cuando el teléfono está completamente en modo avión (mínimo 5 caracteres)."
}
```

#### Respuesta Exitosa (`200 OK`):
```json
{
  "status": "Success",
  "message": "Feedback devuelto a 'in_progress'. El equipo continuará investigando.",
  "data": {
    "id": "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
    "status": "in_progress"
  }
}
```


---

## 3. Endpoints del Panel de Administración (`/api/admin/feedback`)

Todos los endpoints descritos en esta sección requieren cabecera `Authorization: Bearer <admin_token>` y rol administrativo verificado mediante middleware `onlyAdmin`.

---

### 3.1. Listar Feedbacks (Bandeja de Gestión)
Consulta filtrada, ordenada y paginada en servidor para la tabla de gestión del Back-Office.

- **URL:** `GET /api/admin/feedback`
- **Autenticación:** `onlyAdmin`

#### Parámetros de Consulta (`Query Parameters`):
| Parámetro | Tipo | Descripción | Default |
| :--- | :--- | :--- | :--- |
| `status` | `String` | Filtrar por estado: `pending`, `in_review`, `in_progress`, `resolved`, `discarded`. | Todos |
| `category` | `String` | Filtrar por categoría (`bug`, `improvement`, etc.). | Todas |
| `author_type` | `String` | Filtrar por tipo de autor (`user` o `enterprise`). | Todos |
| `search` | `String` | Búsqueda por palabra clave en título, mensaje o email del autor. | Vacío |
| `date_from` | `String (ISO 8601)` | Fecha inicial de creación (`YYYY-MM-DD`). | Opcional |
| `date_to` | `String (ISO 8601)` | Fecha final de creación (`YYYY-MM-DD`). | Opcional |
| `page` | `Integer` | Número de página (base 1). | `1` |
| `limit` | `Integer` | Elementos por página (máx. 100). | `20` |
| `sort_by` | `String` | Campo de ordenación (`created_at`, `status`, `category`). | `created_at` |
| `order` | `String` | Dirección (`asc` o `desc`). | `desc` |

#### Ejemplo de Petición:
```http
GET /api/admin/feedback?status=pending&category=bug&page=1&limit=20&sort_by=created_at&order=desc
```

#### Respuesta Exitosa (`200 OK`):
```json
{
  "status": "Success",
  "data": {
    "feedbacks": [
      {
        "id": "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
        "title": "Fallo al validar billete QR",
        "category": "bug",
        "category_label": "Reportar un fallo",
        "message": "Cuando el pasajero muestra el código QR en un garaje subterráneo sin cobertura...",
        "status": "pending",
        "author_type": "user",
        "created_at": "2026-11-16T12:00:00.000Z",
        "updated_at": "2026-11-16T12:00:00.000Z",
        "user": {
          "id": "usr-1234-uuid",
          "name": "Carlos",
          "surname": "Méndez",
          "email": "carlos.mendez@example.com",
          "img_perfil": "https://cdn.youconnext.es/avatars/usr-1234.jpg"
        },
        "enterprise": null,
        "notes_count": 0
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 142,
      "totalPages": 8,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

### 3.2. Detalle Completo de Feedback
Devuelve toda la información de un feedback concreto, incluyendo el historial de auditoría de cambios de estado y las notas internas de trabajo.

- **URL:** `GET /api/admin/feedback/:id`
- **Autenticación:** `onlyAdmin`

#### Respuesta Exitosa (`200 OK`):
```json
{
  "status": "Success",
  "data": {
    "id": "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
    "title": "Fallo al validar billete QR",
    "category": "bug",
    "message": "Cuando el pasajero muestra el código QR en un garaje subterráneo sin cobertura, el lector no responde.",
    "status": "in_review",
    "author_type": "user",
    "device_info": {
      "platform": "Android",
      "app_version": "1.0.0",
      "os_version": "14.0"
    },
    "created_at": "2026-11-16T12:00:00.000Z",
    "updated_at": "2026-11-16T12:15:00.000Z",
    "user": {
      "id": "usr-1234-uuid",
      "name": "Carlos",
      "surname": "Méndez",
      "email": "carlos.mendez@example.com",
      "phone": "+34612345678"
    },
    "enterprise": null,
    "status_history": [
      {
        "id": "log-001",
        "previous_status": "pending",
        "new_status": "in_review",
        "reason": "Revisando trazas de logs en Sentry",
        "changed_by": {
          "id": "admin-01",
          "name": "Laura (Soporte)"
        },
        "created_at": "2026-11-16T12:15:00.000Z"
      }
    ],
    "notes": [
      {
        "id": "note-101",
        "content": "Confirmado: el validador requería conexión HTTP en lugar de decodificar el payload firmado offline.",
        "author": {
          "id": "admin-02",
          "name": "Marcos (Tech Lead)"
        },
        "created_at": "2026-11-16T12:20:00.000Z"
      }
    ]
  }
}
```

---

### 3.3. Cambiar Estado del Feedback (Triage Administrativo)
Permite realizar la transición en el flujo de triage administrativo (`received`, `in_progress`, `pending_verification`, `discarded`).

> **Regla de Gobernanza Asimétrica:**  
> El administrador **no puede** forzar directamente el estado `resolved`. Si lo intenta, la API devolverá `400 Bad Request` con código `FEEDBACK_RESOLVED_REQUIRES_USER_CONFIRMATION` (*"El estado 'resuelto' únicamente puede ser confirmado por el usuario emisor tras probar el cambio realizado"*). El administrador debe transicionar a `pending_verification` para que el usuario verifique la solución desde su app móvil.

- **URL:** `PATCH /api/admin/feedback/:id/status` (o `PATCH /api/feedback/:id/status`)
- **Autenticación:** `onlyAdmin`

#### Cuerpo de la Petición (`Request Body`):
```json
{
  "status": "pending_verification",
  "reason": "Solucionado en el release v1.0.1 con verificación de firma offline.",
  "admin_notes": "Hemos desplegado la corrección en producción. Por favor, compruébalo en la app.",
  "notify_user": true,
  "user_message": "Hola Carlos, te confirmamos que la incidencia reportada con la lectura QR sin cobertura ha sido resuelta en la última actualización."
}
```

| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `status` | `String` | Sí | Valores válidos: `received`, `in_progress`, `pending_verification`, `discarded`. (Bloqueado para `resolved`). |
| `reason` | `String` | Sí | Motivo interno que quedará asentado en el log de auditoría. |
| `admin_notes` | `String` | No | Nota visible para el usuario autor en su app móvil. |
| `notify_user` | `Boolean` | No | Si es `true`, envía notificación push/email al autor del feedback. |
| `user_message` | `String` | No | Mensaje amigable para el usuario si `notify_user` es `true`. |


#### Respuesta Exitosa (`200 OK`):
```json
{
  "status": "Success",
  "message": "Estado actualizado correctamente a 'resolved'.",
  "data": {
    "id": "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
    "status": "resolved",
    "updated_at": "2026-11-16T12:45:00.000Z"
  }
}
```

---

### 3.4. Añadir Nota Interna Privada
Permite a los administradores, técnicos y agentes de soporte colaborar internamente dejando notas visibles únicamente en el panel de administración.

- **URL:** `POST /api/admin/feedback/:id/notes`
- **Autenticación:** `onlyAdmin`

#### Cuerpo de la Petición (`Request Body`):
```json
{
  "content": "Se ha creado la tarea en el backlog técnico con ID JIRA: YCX-482."
}
```

#### Respuesta Exitosa (`201 Created`):
```json
{
  "status": "Success",
  "message": "Nota añadida con éxito.",
  "data": {
    "id": "note-102",
    "feedback_id": "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
    "content": "Se ha creado la tarea en el backlog técnico con ID JIRA: YCX-482.",
    "author_name": "Marcos (Tech Lead)",
    "created_at": "2026-11-16T12:50:00.000Z"
  }
}
```

---

### 3.5. Métricas y KPIs de Feedback
Ofrece datos consolidados para el dashboard de administración.

- **URL:** `GET /api/admin/feedback/metrics`
- **Autenticación:** `onlyAdmin`
- **Query Params:** `period` (`7d`, `30d`, `90d`, `all`; default: `30d`).

#### Respuesta Exitosa (`200 OK`):
```json
{
  "status": "Success",
  "data": {
    "totals": {
      "total": 350,
      "pending": 45,
      "in_review": 30,
      "in_progress": 25,
      "resolved": 220,
      "discarded": 30
    },
    "resolution_rate": 62.85,
    "average_resolution_time_hours": 36.4,
    "by_category": [
      { "category": "bug", "count": 120, "percentage": 34.28 },
      { "category": "improvement", "count": 110, "percentage": 31.42 },
      { "category": "usability", "count": 50, "percentage": 14.28 },
      { "category": "performance", "count": 35, "percentage": 10.00 },
      { "category": "service", "count": 20, "percentage": 5.71 },
      { "category": "organization", "count": 10, "percentage": 2.85 },
      { "category": "other", "count": 5, "percentage": 1.42 }
    ],
    "by_author_type": {
      "user": 310,
      "enterprise": 40
    }
  }
}
```

---

### 3.6. Gestión Dinámica de Categorías (CRUD Admin)
Permite al equipo de producto crear, editar, ordenar o desactivar categorías en caliente.

- **Listar Categorías:** `GET /api/admin/feedback/categories`
- **Crear Categoría:** `POST /api/admin/feedback/categories`
- **Actualizar Categoría:** `PUT /api/admin/feedback/categories/:id`
- **Eliminar/Desactivar:** `DELETE /api/admin/feedback/categories/:id`

#### Payload de Creación (`POST`):
```json
{
  "id": "accessibility",
  "label": "Accesibilidad e Inclusión",
  "description": "Comentarios sobre accesibilidad visual, contraste o lectores de pantalla.",
  "icon": "eye",
  "color": "#10B981",
  "is_active": true,
  "sort_order": 7
}
```
*Al crearse o modificarse, el endpoint público de clientes invalidará su caché y comenzará a servir la nueva categoría inmediatamente a la app móvil y web.*
