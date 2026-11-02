// YouConnext - Enterprise Service (Gestión B2B de Organizaciones, Eventos y Miembros)
import httpClient from "./httpClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { safeSetItem } from "./storageManager";

const STORAGE_KEYS = {
  EVENTS: "@youconnext_enterprise_events",
  MEMBERS: "@youconnext_enterprise_members",
  METRICS: "@youconnext_enterprise_metrics",
  PROFILE: "@youconnext_enterprise_profile",
  CHECKINS: "@youconnext_enterprise_checkins",
};

// Datos semilla de demostración para alta disponibilidad y pruebas
const DEFAULT_MEMBERS = [
  {
    id: "mem-001",
    name: "Carlos Gómez",
    email: "carlos.gomez@empresa.com",
    role: "Manager",
    corporate_role: "MANAGER",
    corporate_role_title: "Gestor de Movilidad",
    department: "Sostenibilidad y RSC",
    employee_code: "IB-902",
    status: "Activo",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    joined_at: "2026-01-15T09:00:00Z",
  },
  {
    id: "mem-002",
    name: "Elena Ramos",
    email: "elena.ramos@empresa.com",
    role: "Admin",
    corporate_role: "ADMIN",
    corporate_role_title: "Directora de Operaciones",
    department: "Operaciones",
    employee_code: "IB-104",
    status: "Activo",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
    joined_at: "2025-11-20T10:30:00Z",
  },
  {
    id: "mem-003",
    name: "Alejandro Sanz",
    email: "alejandro.sanz@empresa.com",
    role: "Empleado",
    corporate_role: "EMPLOYEE",
    corporate_role_title: "Ingeniero de Software",
    department: "Tecnología / IT",
    employee_code: "IB-433",
    status: "Activo",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    joined_at: "2026-03-01T08:00:00Z",
  },
  {
    id: "mem-004",
    name: "Lucía Morales",
    email: "lucia.morales@empresa.com",
    role: "Empleado",
    corporate_role: "EMPLOYEE",
    corporate_role_title: "Coordinadora de Personas",
    department: "Recursos Humanos",
    employee_code: "IB-552",
    status: "Pendiente",
    avatar: null,
    joined_at: "2026-10-10T14:15:00Z",
  },
];

const DEFAULT_EVENTS = [
  {
    id: "ent-ev-101",
    name: "Convención Anual de Sostenibilidad 2026",
    title: "Convención Anual de Sostenibilidad 2026",
    description: "Encuentro de equipos corporativos para planificar los objetivos de reducción de huella de carbono y carpooling corporativo.",
    start_date: "2026-11-15T09:00:00.000Z",
    end_date: "2026-11-15T18:00:00.000Z",
    location: "Sede Central YouConnext, Madrid",
    address_line1: "Calle Gran Vía 28, Madrid",
    status: "active",
    capacity: 250,
    registered_attendees: 134,
    checked_in_count: 89,
    carpool_routes_count: 32,
    co2_saved_kg: 420.5,
    tags: ["Sostenibilidad", "Convención", "Oficial"],
    unique_code: "SOST2026-MAD",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "ent-ev-102",
    name: "Team Building Otoño & Reforestación",
    title: "Team Building Otoño & Reforestación",
    description: "Jornada de voluntariado ambiental y carpooling hacia la Sierra de Guadarrama.",
    start_date: "2026-11-28T08:30:00.000Z",
    end_date: "2026-11-28T16:00:00.000Z",
    location: "Parque Nacional Guadarrama, Cercedilla",
    address_line1: "Carretera de las Dehesas s/n, Cercedilla",
    status: "upcoming",
    capacity: 80,
    registered_attendees: 58,
    checked_in_count: 0,
    carpool_routes_count: 14,
    co2_saved_kg: 185.0,
    tags: ["Team Building", "Voluntariado"],
    unique_code: "REFOR2026-GUAD",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "ent-ev-103",
    name: "Hackathon de Movilidad Compartida",
    title: "Hackathon de Movilidad Compartida",
    description: "48 horas ideando soluciones de transporte eficiente entre campus universitarios y sedes.",
    start_date: "2026-10-12T10:00:00.000Z",
    end_date: "2026-10-14T17:00:00.000Z",
    location: "Campus de Innovación Tecnológica",
    address_line1: "Av. Complutense 4, Madrid",
    status: "completed",
    capacity: 120,
    registered_attendees: 115,
    checked_in_count: 110,
    carpool_routes_count: 28,
    co2_saved_kg: 345.8,
    tags: ["Hackathon", "Tecnología"],
    unique_code: "HACK2026-INNOV",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
  },
];

// 1. Obtener perfil de la empresa autenticada
async function getMyEnterpriseProfile() {
  try {
    const res = await httpClient.request("/api/enterprise/me");
    if (res?.enterprise) {
      await safeSetItem(STORAGE_KEYS.PROFILE, JSON.stringify(res.enterprise));
      return res.enterprise;
    }
  } catch (error) {
    console.warn("[EnterpriseService] getMyEnterpriseProfile fallo, usando datos en cache:", error?.message);
  }

  const cached = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
  if (cached) {
    return JSON.parse(cached);
  }

  return {
    id: "ent-01",
    name: "Empresa YouConnext",
    cif: "B12345678",
    email: "corporativo@youconnext.es",
    phone: "+34 910 123 456",
    address_line1: "Calle Gran Vía 28",
    city: "Madrid",
    country: "ES",
    sector: "Movilidad & Sostenibilidad",
    verified: 1,
  };
}

// 2. Actualizar perfil de empresa
async function updateEnterpriseProfile(data) {
  try {
    const res = await httpClient.request("/api/enterprise/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    if (res?.enterprise) {
      await safeSetItem(STORAGE_KEYS.PROFILE, JSON.stringify(res.enterprise));
      return res.enterprise;
    }
  } catch (error) {
    console.error("[EnterpriseService] updateEnterpriseProfile API error:", error?.message);
    throw error;
  }

  const current = (await getMyEnterpriseProfile()) || {};
  const updated = { ...current, ...data, updated_at: new Date().toISOString() };
  await safeSetItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
  return updated;
}

// 3. Obtener eventos de la empresa (con soporte para service-events y platform-events corporativos)
async function getEnterpriseEvents(params = {}) {
  try {
    const limit = params.limit || 50;
    const offset = params.offset || 0;
    const page = params.page || 1;

    // Recuperar eventos de servicio (endpoint canónico de la empresa)
    // y eventos de plataforma asignados a la organización
    const fetchServiceEvents = async () => {
      try {
        return await httpClient.request(`/api/enterprise/service-events?limit=${limit}&offset=${offset}`);
      } catch (e1) {
        try {
          return await httpClient.request("/api/enterprise/service-events");
        } catch (e2) {
          console.warn("[EnterpriseService] Error obteniendo service-events:", e2?.message);
          return null;
        }
      }
    };

    const fetchCorporateEvents = async () => {
      try {
        return await httpClient.request(`/api/enterprise/events?limit=${limit}&page=${page}`);
      } catch (e1) {
        try {
          return await httpClient.request("/api/enterprise/events");
        } catch (e2) {
          return null;
        }
      }
    };

    const [serviceEventsRes, corporateEventsRes] = await Promise.allSettled([
      fetchServiceEvents(),
      fetchCorporateEvents(),
    ]);

    const serviceData =
      serviceEventsRes.status === "fulfilled" && serviceEventsRes.value
        ? serviceEventsRes.value?.service_events ||
          serviceEventsRes.value?.events ||
          serviceEventsRes.value?.data ||
          (Array.isArray(serviceEventsRes.value) ? serviceEventsRes.value : [])
        : [];

    const corporateData =
      corporateEventsRes.status === "fulfilled" && corporateEventsRes.value
        ? corporateEventsRes.value?.events ||
          corporateEventsRes.value?.service_events ||
          corporateEventsRes.value?.data ||
          (Array.isArray(corporateEventsRes.value) ? corporateEventsRes.value : [])
        : [];

    const serviceList = Array.isArray(serviceData) ? serviceData : [];
    const corporateList = Array.isArray(corporateData) ? corporateData : [];

    // Combinar ambas fuentes deduplicando por ID
    const mergedMap = new Map();
    [...serviceList, ...corporateList].forEach((ev) => {
      if (ev && ev.id) {
        const key = String(ev.id);
        const existing = mergedMap.get(key);
        if (existing) {
          mergedMap.set(key, { ...existing, ...ev });
        } else {
          mergedMap.set(key, ev);
        }
      }
    });

    const combinedList = Array.from(mergedMap.values());

    if (combinedList.length > 0) {
      // Normalizar campos para asegurar que name, title, start_date, start_at, total_participants y status estén presentes
      const normalized = combinedList.map((ev) => {
        const count =
          ev.total_participants ??
          ev.participants_count ??
          ev.inscribed_count ??
          ev._count?.participants ??
          ev.registered_attendees ??
          0;

        const startDate = ev.start_date || ev.start_at || ev.startDate || null;
        const endDate = ev.end_date || ev.end_at || ev.endDate || null;
        const name = ev.name || ev.title || "Evento Corporativo";
        const title = ev.title || ev.name || "Evento Corporativo";
        const location =
          ev.location ||
          ev.address_line1 ||
          (ev.city ? `${ev.city}${ev.country ? `, ${ev.country}` : ""}` : "Sede Corporativa");
        const addressLine1 = ev.address_line1 || ev.location || location;

        const rawStatus = (ev.status || "requested").toLowerCase();
        let normalizedStatus = "upcoming";
        if (["active", "in_progress", "ongoing"].includes(rawStatus)) {
          normalizedStatus = "active";
        } else if (["completed", "finished"].includes(rawStatus)) {
          normalizedStatus = "completed";
        } else if (["canceled", "cancelled", "rejected"].includes(rawStatus)) {
          normalizedStatus = "completed";
        } else {
          normalizedStatus = "upcoming";
        }

        return {
          ...ev,
          id: String(ev.id),
          name,
          title,
          start_date: startDate,
          start_at: startDate,
          end_date: endDate,
          end_at: endDate,
          location,
          address_line1: addressLine1,
          city: ev.city || "",
          country: ev.country || "ES",
          status: normalizedStatus,
          original_status: ev.status || "requested",
          total_participants: count,
          participants_count: count,
          inscribed_count: count,
          registered_attendees: count,
          _count: {
            ...(ev._count || {}),
            participants: count,
          },
          checked_in_count: ev.checked_in_count || 0,
          carpool_routes_count: ev.carpool_routes_count || 0,
          co2_saved_kg: ev.co2_saved_kg || 0,
          capacity: Number(ev.capacity) || 100,
          unique_code: ev.unique_code || "",
          image: ev.image || null,
        };
      });

      // Guardar en almacenamiento local
      await safeSetItem(STORAGE_KEYS.EVENTS, JSON.stringify(normalized));
      return normalized;
    }
  } catch (error) {
    console.warn("[EnterpriseService] getEnterpriseEvents fallback local:", error?.message);
  }

  const stored = await AsyncStorage.getItem(STORAGE_KEYS.EVENTS);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }

  await safeSetItem(STORAGE_KEYS.EVENTS, JSON.stringify(DEFAULT_EVENTS));
  return DEFAULT_EVENTS;
}

// 3.1. Obtener evento específico de la empresa por ID (/api/enterprise/service-events/:id)
async function getEnterpriseEventById(id) {
  if (!id) return null;
  try {
    const res = await httpClient.request(`/api/enterprise/service-events/${id}`);
    const ev = res?.service_event || res?.event || res?.data;
    if (ev) {
      const count =
        ev.total_participants ??
        ev.participants_count ??
        ev.inscribed_count ??
        ev._count?.participants ??
        ev.registered_attendees ??
        0;

      const startDate = ev.start_date || ev.start_at || ev.startDate || null;
      const endDate = ev.end_date || ev.end_at || ev.endDate || null;
      const name = ev.name || ev.title || "Evento Corporativo";
      const title = ev.title || ev.name || "Evento Corporativo";
      const location =
        ev.location ||
        ev.address_line1 ||
        (ev.city ? `${ev.city}${ev.country ? `, ${ev.country}` : ""}` : "Sede Corporativa");
      const addressLine1 = ev.address_line1 || ev.location || location;

      return {
        ...ev,
        id: String(ev.id),
        name,
        title,
        start_date: startDate,
        start_at: startDate,
        end_date: endDate,
        end_at: endDate,
        location,
        address_line1: addressLine1,
        city: ev.city || "",
        country: ev.country || "ES",
        total_participants: count,
        participants_count: count,
        inscribed_count: count,
        registered_attendees: count,
        _count: {
          ...(ev._count || {}),
          participants: count,
        },
      };
    }
  } catch (error) {
    console.warn(`[EnterpriseService] getEnterpriseEventById(${id}) fallback:`, error?.message);
  }

  const events = await getEnterpriseEvents();
  return events.find((e) => String(e.id) === String(id)) || null;
}

// 4. Crear evento corporativo
async function createEnterpriseEvent(eventData) {
  const newEventId = "ent-ev-" + Date.now();
  const startDateStr = eventData.startDate || eventData.start_date || new Date().toISOString();
  const endDateStr = eventData.endDate || eventData.end_date || new Date(Date.now() + 86400000).toISOString();
  const locationStr = eventData.location || "Sede Corporativa";
  const titleStr = eventData.name || eventData.title || "Nuevo Evento Corporativo";

  const createdObj = {
    id: newEventId,
    name: titleStr,
    title: titleStr,
    description: eventData.description || "",
    start_date: startDateStr,
    start_at: startDateStr,
    end_date: endDateStr,
    end_at: endDateStr,
    location: locationStr,
    address_line1: locationStr,
    capacity: Number(eventData.capacity) || 100,
    registered_attendees: 0,
    total_participants: 0,
    participants_count: 0,
    inscribed_count: 0,
    _count: { participants: 0 },
    checked_in_count: 0,
    carpool_routes_count: 0,
    co2_saved_kg: 0,
    status: "upcoming",
    original_status: "requested",
    unique_code: (titleStr).slice(0, 4).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase(),
    tags: eventData.tags || ["Corporativo"],
    image: eventData.image || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
    created_at: new Date().toISOString(),
  };

  const payload = {
    name: createdObj.name,
    description: createdObj.description,
    startDate: createdObj.start_date,
    endDate: createdObj.end_date,
    location: createdObj.location,
  };
  if (eventData.latitude !== undefined && eventData.latitude !== null) {
    payload.latitude = Number(eventData.latitude);
  }
  if (eventData.longitude !== undefined && eventData.longitude !== null) {
    payload.longitude = Number(eventData.longitude);
  }

  try {
    const res = await httpClient.request("/api/enterprise/service-events", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (res?.service_event) {
      createdObj.id = String(res.service_event.id);
      if (res.service_event.title) {
        createdObj.name = res.service_event.title;
        createdObj.title = res.service_event.title;
      }
      if (res.service_event.address_line1) {
        createdObj.location = res.service_event.address_line1;
        createdObj.address_line1 = res.service_event.address_line1;
      }
      if (res.service_event.start_at) {
        createdObj.start_date = res.service_event.start_at;
        createdObj.start_at = res.service_event.start_at;
      }
      if (res.service_event.end_at) {
        createdObj.end_date = res.service_event.end_at;
        createdObj.end_at = res.service_event.end_at;
      }
      if (res.service_event.status) {
        createdObj.original_status = res.service_event.status;
        createdObj.status = ["active", "in_progress"].includes(res.service_event.status) ? "active" : "upcoming";
      }
    }
  } catch (error) {
    console.error("[EnterpriseService] createEnterpriseEvent API error:", error?.message);
    throw error;
  }

  // Guardar en almacenamiento local únicamente tras éxito en backend
  const currentEvents = await getEnterpriseEvents();
  const updatedList = [createdObj, ...currentEvents.filter((e) => String(e.id) !== String(createdObj.id))];
  await safeSetItem(STORAGE_KEYS.EVENTS, JSON.stringify(updatedList));
  return createdObj;
}

// 5. Actualizar evento corporativo
async function updateEnterpriseEvent(id, updateData) {
  const payload = { ...updateData };
  if (updateData.startDate || updateData.start_date) {
    payload.startDate = updateData.startDate || updateData.start_date;
  }
  if (updateData.endDate || updateData.end_date) {
    payload.endDate = updateData.endDate || updateData.end_date;
  }
  if (updateData.latitude !== undefined && updateData.latitude !== null) {
    payload.latitude = Number(updateData.latitude);
  }
  if (updateData.longitude !== undefined && updateData.longitude !== null) {
    payload.longitude = Number(updateData.longitude);
  }

  try {
    await httpClient.request(`/api/enterprise/service-events/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("[EnterpriseService] updateEnterpriseEvent API error:", error?.message);
    throw error;
  }

  const currentEvents = await getEnterpriseEvents();
  const updatedList = currentEvents.map((ev) => {
    if (String(ev.id) === String(id)) {
      return {
        ...ev,
        ...updateData,
        title: updateData.name || updateData.title || ev.title,
        name: updateData.name || updateData.title || ev.name,
        address_line1: updateData.location || ev.address_line1,
        location: updateData.location || ev.location,
        latitude: updateData.latitude !== undefined ? updateData.latitude : ev.latitude,
        longitude: updateData.longitude !== undefined ? updateData.longitude : ev.longitude,
        updated_at: new Date().toISOString(),
      };
    }
    return ev;
  });

  await safeSetItem(STORAGE_KEYS.EVENTS, JSON.stringify(updatedList));
  const updated = updatedList.find((ev) => String(ev.id) === String(id));
  return updated;
}

// 6. Eliminar evento corporativo
async function deleteEnterpriseEvent(id) {
  try {
    await httpClient.request(`/api/enterprise/service-events/${id}`, {
      method: "DELETE",
    });
  } catch (error) {
    console.error("[EnterpriseService] deleteEnterpriseEvent API error:", error?.message);
    throw error;
  }

  const currentEvents = await getEnterpriseEvents();
  const filtered = currentEvents.filter((ev) => String(ev.id) !== String(id));
  await safeSetItem(STORAGE_KEYS.EVENTS, JSON.stringify(filtered));
  return true;
}

// 7. Métricas analíticas de eventos de organización
async function getEnterpriseEventsMetrics() {
  const events = await getEnterpriseEvents();
  const totalEvents = events.length;
  const activeEvents = events.filter((e) => {
    const s = (e.status || e.original_status || "").toLowerCase();
    return s === "active" || s === "upcoming" || s === "requested" || s === "approved" || s === "in_progress";
  }).length;
  const totalAttendees = events.reduce((acc, curr) => {
    const count =
      curr.total_participants ??
      curr.participants_count ??
      curr.inscribed_count ??
      curr._count?.participants ??
      curr.registered_attendees ??
      0;
    return acc + (Number(count) || 0);
  }, 0);
  const totalCheckedIn = events.reduce((acc, curr) => acc + (Number(curr.checked_in_count) || 0), 0);
  const totalCarpoolRoutes = events.reduce((acc, curr) => acc + (Number(curr.carpool_routes_count) || 0), 0);
  const totalCo2Saved = events.reduce((acc, curr) => acc + (Number(curr.co2_saved_kg) || 0), 0);
  const checkInRate = totalAttendees > 0 ? Math.round((totalCheckedIn / totalAttendees) * 100) : 0;

  return {
    totalEvents,
    activeEvents,
    totalAttendees,
    totalCheckedIn,
    checkInRate,
    totalCarpoolRoutes,
    totalCo2Saved: Number(totalCo2Saved.toFixed(1)),
  };
}

// 8. Directorio de miembros y empleados
async function getEnterpriseMembers(enterpriseId) {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.MEMBERS);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }

  await safeSetItem(STORAGE_KEYS.MEMBERS, JSON.stringify(DEFAULT_MEMBERS));
  return DEFAULT_MEMBERS;
}

// 9. Invitar a nuevo colaborador o gestor
async function inviteEnterpriseMember(enterpriseId, { name, email, role, department, employeeCode }) {
  const newMember = {
    id: "mem-" + Date.now(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role: role || "Empleado",
    corporate_role: (role || "EMPLOYEE").toUpperCase(),
    corporate_role_title: role === "Admin" ? "Administrador Corporativo" : role === "Manager" ? "Coordinador de Movilidad" : "Empleado Corporativo",
    department: department || "General",
    employee_code: employeeCode || `EMP-${Math.floor(100 + Math.random() * 900)}`,
    status: "Activo",
    avatar: null,
    joined_at: new Date().toISOString(),
  };

  const members = await getEnterpriseMembers(enterpriseId);
  const updated = [newMember, ...members];
  await safeSetItem(STORAGE_KEYS.MEMBERS, JSON.stringify(updated));
  return newMember;
}

// 10. Acreditación y Check-in QR instantáneo
async function verifyEventCheckIn(eventId, qrData) {
  const events = await getEnterpriseEvents();
  const targetEvent = events.find((e) => String(e.id) === String(eventId));

  // Simulación de validación de código QR (o llamada a endpoint de acreditación)
  const code = (qrData || "").trim();
  const checkinKey = `${STORAGE_KEYS.CHECKINS}_${eventId}`;
  const storedCheckinsRaw = await AsyncStorage.getItem(checkinKey);
  const checkedInList = storedCheckinsRaw ? JSON.parse(storedCheckinsRaw) : [];

  if (checkedInList.includes(code)) {
    return {
      success: false,
      alreadyCheckedIn: true,
      message: "Este asistente ya fue acreditado previamente.",
      attendee: { code },
    };
  }

  checkedInList.push(code);
  await safeSetItem(checkinKey, JSON.stringify(checkedInList));

  // Incrementar contador en el evento
  if (targetEvent) {
    const updatedEvents = events.map((ev) => {
      if (String(ev.id) === String(eventId)) {
        return {
          ...ev,
          checked_in_count: (Number(ev.checked_in_count) || 0) + 1,
        };
      }
      return ev;
    });
    await safeSetItem(STORAGE_KEYS.EVENTS, JSON.stringify(updatedEvents));
  }

  return {
    success: true,
    alreadyCheckedIn: false,
    message: "Acreditación confirmada exitosamente.",
    attendee: {
      code,
      name: "Asistente Verificado",
      verifiedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  };
}

export const enterpriseService = {
  getMyEnterpriseProfile,
  updateEnterpriseProfile,
  getEnterpriseEvents,
  getEnterpriseEventById,
  createEnterpriseEvent,
  updateEnterpriseEvent,
  deleteEnterpriseEvent,
  getEnterpriseEventsMetrics,
  getEnterpriseMembers,
  inviteEnterpriseMember,
  verifyEventCheckIn,
};

export default enterpriseService;
