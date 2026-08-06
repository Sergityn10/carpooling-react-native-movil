// Simple in-memory cache for HomeScreen data.
// Data persists across screen focus/mount cycles so we only fetch once per app session.

let proximosViajes = null;
let eventosCercanos = null;
let joinedEvents = null;
let viajesPopulares = null;

export const homeCache = {
  getProximosViajes: () => proximosViajes,
  setProximosViajes: (data) => {
    proximosViajes = data;
  },
  addProximoViaje: (viaje) => {
    if (!viaje) return;
    const current = proximosViajes || [];
    const exists = current.some(
      (t) => t.id === viaje.id || t.id_trayecto === viaje.id_trayecto,
    );
    if (!exists) {
      proximosViajes = [viaje, ...current];
    }
  },
  removeProximoViaje: (viajeId) => {
    if (!viajeId) return;
    const current = proximosViajes || [];
    proximosViajes = current.filter(
      (t) => t.id !== viajeId && t.id_trayecto !== viajeId,
    );
  },
  getEventosCercanos: () => eventosCercanos,
  setEventosCercanos: (data) => {
    eventosCercanos = data;
  },
  getJoinedEvents: () => joinedEvents,
  setJoinedEvents: (data) => {
    joinedEvents = data;
  },
  getViajesPopulares: () => viajesPopulares,
  setViajesPopulares: (data) => {
    viajesPopulares = data;
  },
  clear: () => {
    proximosViajes = null;
    eventosCercanos = null;
    joinedEvents = null;
    viajesPopulares = null;
  },
};
