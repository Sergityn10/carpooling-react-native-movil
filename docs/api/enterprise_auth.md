# Autenticación de Empresas (`/api/enterprise/auth`)

Endpoints para gestión de cuentas de organización/empresa (`role_id: 3`, rol `"enterprise"`), auto-registro corporativo público, autenticación, cambio de contraseñas y compatibilidad con el inicio de sesión unificado.

> **Nota de Arquitectura:**
> - Las organizaciones disponen de un flujo de acceso y registro totalmente separado e independiente al de los usuarios particulares:
>   - Registro web: `/enterprise/register`
>   - Inicio de sesión web: `/enterprise/login`
>   - Onboarding corporativo: `/enterprise/onboarding`
> - Para gestionar a los empleados, colaboradores e invitaciones corporativas de la organización, consulta [Gestión de Miembros e Invitaciones](enterprise_members.md).
> - Para la implementación en la Webapp y App Móvil, consulta la [Guía de Integración Frontend para Empresas](../frontend-enterprise-guide.md).

---

## 1. Auto-Registro Público de Organización / Empresa

**URL:** `POST /api/enterprise/auth/register`

**Autenticación:** No requerida (Pública).

**Descripción:** Da de alta una nueva organización corporativa en la plataforma de forma ágil. Para maximizar la facilidad de registro, únicamente se exige **correo corporativo** y **contraseña** (el nombre es opcional en esta fase y puede asignarse en el Onboarding). 
Tras crearse en base de datos con `onboarding_ended: false`, el servidor inicia sesión inmediatamente, emite el JWT correspondiente y establece la cookie segura `enterprise_access_token`.

**Entrada (body JSON):**
```json
{
  "email": "movilidad@empresa.com",
  "password": "Password123!#",
  "name": "Empresa Opcional S.L."
}
```

*Nota sobre campos:*
- `email`: Obligatorio. Formato email corporativo válido y único en el sistema.
- `password`: Obligatorio. Mínimo 8 caracteres, al menos una mayúscula, una minúscula, un número y un símbolo especial (`@$!%*?&_-#`).
- `name`: Opcional. Si se omite, se asigna temporalmente el alias del correo hasta que la empresa complete el onboarding.

**Salida (201 Created):**
```json
{
  "status": "Success",
  "message": "Organización registrada exitosamente.",
  "token": "<JWT_access_token>",
  "role": "enterprise",
  "enterprise": {
    "id": "ent-uuid-999",
    "name": "Empresa Opcional S.L.",
    "email": "movilidad@empresa.com",
    "description": null,
    "location": null,
    "phone": null,
    "cif": null,
    "website": null,
    "logo": null,
    "contactPerson": null,
    "sector": null,
    "employeeCount": null,
    "country": "ES",
    "verified": false,
    "onboarding_ended": false,
    "isActive": true,
    "role": "enterprise",
    "createdAt": "2026-11-06T08:30:00.000Z"
  }
}
```

**Cookies establecidas:** `enterprise_access_token` (`httpOnly`, `path: /`).

**Errores:**
- `400` — Validación de esquema fallida (contraseña débil o formato de email incorrecto).
- `409` — Ya existe una empresa registrada con ese correo electrónico.

---

## 2. Login Directo de Empresa

**URL:** `POST /api/enterprise/auth/login`

**Autenticación:** No requerida.

**Descripción:** Autentica una empresa con email y contraseña corporativa. Valida que la empresa no haya sido eliminada lógicamente (`is_deleted: false`) y que esté activa (`is_active: true`). Emite un JWT con `role: "enterprise"` y establece la cookie `enterprise_access_token`.

**Entrada (body JSON):**
```json
{
  "email": "movilidad@empresa.com",
  "password": "Password123!#"
}
```

**Salida (200 OK):**
```json
{
  "status": "Success",
  "message": "Inicio de sesión correcto.",
  "token": "<JWT_access_token>",
  "role": "enterprise",
  "enterprise": {
    "id": "ent-uuid-999",
    "name": "Iberdrola S.A.",
    "email": "movilidad@empresa.com",
    "sector": "Energía",
    "location": "Bilbao / Madrid",
    "onboarding_ended": true,
    "role": "enterprise",
    "isActive": true
  }
}
```

**Regla de Redirección Frontend:**
- Si `enterprise.onboarding_ended === false` ➔ Redirigir inmediatamente a `/enterprise/onboarding`.
- Si `enterprise.onboarding_ended === true` ➔ Redirigir al panel principal `/enterprise/dashboard`.

**Errores:**
- `400` — Validación de esquema fallida.
- `401` — Credenciales incorrectas.
- `403` — Organización dada de baja o suspendida temporalmente.

---

## 3. Alta Administrativa de Empresas (Solo SuperAdmin)

**URL:** `POST /api/admin/enterprises`

**Autenticación:** Requerida (Solo Super Administrador de la plataforma con token Bearer o cookie de admin).

**Descripción:** Permite a los administradores de YouConnext crear directamente entidades completas y pre-configuradas con datos de sede, CIF y auditoría.

**Entrada (body JSON):**
```json
{
  "name": "Iberdrola S.A.",
  "email": "movilidad@iberdrola.com",
  "password": "Password123!#",
  "description": "Líder global en sostenibilidad y movilidad compartida",
  "location": "Bilbao / Madrid",
  "phone": "+34910000000",
  "cif": "A48010611",
  "website": "https://www.iberdrola.com",
  "sector": "Energía",
  "employee_count": 35000,
  "city": "Madrid",
  "province": "Madrid",
  "country": "ES"
}
```

**Salida (201 Created):** Retorna la entidad creada con código 201.

---

## 4. Cambio de Contraseña de Empresa

**URL:** `PATCH /api/enterprise/auth/change-password`

**Autenticación:** Requerida (`isEnterpriseLoged`).

**Descripción:** Permite a la propia organización actualizar su clave corporativa en sesión. Valida la contraseña actual, exige complejidad de seguridad y previene reutilización inmediata.

**Entrada (body JSON):**
```json
{
  "current_password": "OldPassword123!#",
  "new_password": "NewStrongPassword2026@",
  "confirm_password": "NewStrongPassword2026@"
}
```

**Salida (200 OK):**
```json
{
  "status": "Success",
  "message": "Contraseña modificada correctamente con las directivas de seguridad requeridas."
}
```

---

## 5. Logout de Empresa

**URL:** `GET /api/enterprise/auth/logout`

**Autenticación:** No requerida.

**Descripción:** Cierra la sesión corporativa eliminando la cookie `enterprise_access_token`.

**Salida (200 OK):**
```json
{
  "status": "Success",
  "message": "Sesión cerrada correctamente."
}
```

---

## 6. Validar Token de Empresa

**URL:** `GET /api/enterprise/auth/validate`

**Autenticación:** Bearer Token o Cookie `enterprise_access_token` requerida.

**Descripción:** Valida la sesión activa de la empresa y devuelve los datos corporativos actualizados, incluyendo el estado de `onboarding_ended`.

**Salida (200 OK):**
```json
{
  "status": "Success",
  "message": "Token válido.",
  "token": "<JWT>",
  "role": "enterprise",
  "enterprise": {
    "id": "ent-uuid-999",
    "name": "Mi Empresa S.L.",
    "email": "info@empresa.com",
    "cif": "B12345678",
    "website": "https://miempresa.com",
    "description": "Compromiso con el carpooling corporativo",
    "location": "Cáceres",
    "onboarding_ended": true,
    "role": "enterprise"
  }
}
```

**Errores:**
- `401` — Token no válido, expirado o cuenta inactiva.

---

## 7. Login y Registro Corporativo con Google (`/api/enterprise/auth/google`)

**URL:** `POST /api/enterprise/auth/google`

**Autenticación:** No requerida.

**Descripción:** Autentica o crea una cuenta de entidad jurídica / empresa (`role_id: 3`, rol `"enterprise"`) usando el token de Google (`id_token`) obtenido desde el cliente Web o SDK Móvil. Si la empresa no existe en el sistema, se crea automáticamente una nueva organización (`role: "enterprise"`, `onboarding_ended: false`, `is_new: true`). Si ya existe, valida que esté activa e inicia su sesión corporativa.

**Entrada (body JSON):**
```json
{
  "id_token": "<google_id_token>",
  "method": "auto" // Opcional: "auto" (default), "login", "register"
}
```

**Salida (200 OK / 201 Created):**
```json
{
  "status": "Success",
  "message": "Autenticación corporativa exitosa.",
  "token": "<JWT_enterprise_access_token>",
  "role": "enterprise",
  "enterprise": {
    "id": "ent-uuid-999",
    "name": "Mi Empresa S.L.",
    "email": "movilidad@empresa.com",
    "onboarding_ended": false,
    "role": "enterprise",
    "isActive": true
  },
  "is_new": true
}
```

**Cookies establecidas:** `enterprise_access_token` (`httpOnly`, `path: /`).

**Regla de Redirección Frontend / Móvil:**
- Si `enterprise.onboarding_ended === false` ➔ Redirigir a `/enterprise/onboarding` (Wizard de Sede en 3 pasos).
- Si `enterprise.onboarding_ended === true` ➔ Redirigir a `/enterprise/dashboard` (Panel corporativo).

