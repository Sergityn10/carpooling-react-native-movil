// YouConnext - Viaje Context
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import trayectoService from "../services/travels/trayectoService";
import reservaService from "../services/travels/reservaService";
import trackingSocketService from "../services/tracking/trackingSocketService";
import { GPS_CONFIG, VIAJE_ESTADO } from "../constants";
import { useUser } from "./UserContext";
import { BACKGROUND_LOCATION_TASK } from "../services/locationBackgroundTask";
import { homeCache } from "../services/homeCache";

const ViajeContext = createContext();

export const ViajeProvider = ({ children }) => {
  const { user } = useUser();
  const [viajeActivo, setViajeActivo] = useState(null);
  const [pasajeros, setPasajeros] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [trackingActivo, setTrackingActivo] = useState(false);
  const [distanciaTotal, setDistanciaTotal] = useState(0);
  const locationSubscription = useRef(null);

  // Cargar viaje activo desde AsyncStorage
  useEffect(() => {
    loadViajeActivo();
  }, []);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  // Cargar viaje activo
  const loadViajeActivo = async () => {
    try {
      const viajeData = await AsyncStorage.getItem("@youconnext_viaje_activo");
      if (viajeData) {
        const parsed = JSON.parse(viajeData);
        setViajeActivo(parsed.viaje);
        setPasajeros(parsed.pasajeros || []);
        setUbicaciones(parsed.ubicaciones || []);

        // Si es pasajero, reanudar tracking solo si fue recogido y no ha llegado
        if (parsed.esPasajero) {
          if (parsed.pasajeroRecogido && !parsed.pasajeroEnDestino) {
            iniciarTracking();
          }
          return;
        }

        // Si el viaje estaba en curso (conductor), reanudar tracking
        if (
          parsed.viaje?.status === "en curso" ||
          parsed.viaje?.estado === VIAJE_ESTADO.ACTIVO
        ) {
          iniciarTracking();
        }
      }
    } catch (error) {
      console.error("Error al cargar viaje activo:", error);
    }
  };

  // Guardar viaje activo
  const saveViajeActivo = async (
    viaje,
    pasajeroList,
    ubicacionList,
    extra = {},
  ) => {
    try {
      const data = {
        viaje,
        pasajeros: pasajeroList,
        ubicaciones: ubicacionList,
        ...extra,
      };
      await AsyncStorage.setItem(
        "@youconnext_viaje_activo",
        JSON.stringify(data),
      );
    } catch (error) {
      console.error("Error al guardar viaje activo:", error);
    }
  };

  // Crear viaje rápido
  const crearViajeRapido = async (datos) => {
    try {
      const payload = {
        origen:
          datos.origen ||
          datos.puntoInicialDireccion ||
          datos.puntoInicialNombre ||
          "",
        destino:
          datos.destino ||
          datos.puntoFinalDireccion ||
          datos.puntoFinalNombre ||
          "",
        fecha: datos.fecha,
        hora: datos.hora,
        plazas: datos.plazas,
        conductor: datos.conductorId,
        vehiculo_id: datos.vehiculoId,
        disponible: datos.plazas,
        precio: datos.precio ?? 0,
        origen_lat: datos.origenLat,
        origen_lng: datos.origenLng,
        destino_lat: datos.destinoLat,
        destino_lng: datos.destinoLng,
        distancia: datos.distanciaMetros,
      };
      const response = await trayectoService.crearTrayecto(payload);
      const trayecto = response.trayecto || response.viaje || response;
      setViajeActivo(trayecto);
      setPasajeros([]);
      setUbicaciones([]);
      setDistanciaTotal(0);
      await saveViajeActivo(trayecto, [], []);
      return { ...response, viaje: trayecto };
    } catch (error) {
      console.error("Error al crear viaje:", error);
      throw error;
    }
  };

  // Iniciar viaje
  const iniciarViaje = async (viajeParam) => {
    const viaje = viajeParam || viajeActivo;
    if (!viaje) return;

    try {
      const response = await trayectoService.iniciarTrayecto(viaje.id);
      const viajeActualizado = { ...viaje, status: "en curso" };
      setViajeActivo(viajeActualizado);
      await saveViajeActivo(viajeActualizado, pasajeros, ubicaciones);

      // Iniciar tracking GPS
      await iniciarTracking();

      return response;
    } catch (error) {
      console.error("Error al iniciar viaje:", error);
      throw error;
    }
  };

  // Completar viaje
  const completarViaje = async (viajeParam) => {
    const viaje = viajeParam || viajeActivo;
    if (!viaje) return;

    try {
      await stopTracking();
      try {
        trackingSocketService.endTracking();
        trackingSocketService.disconnect();
      } catch {}

      const response = await trayectoService.finalizarTrayecto(viaje.id);

      // Quitar del cache de próximos viajes
      homeCache.removeProximoViaje(viaje.id);

      // Limpiar
      await AsyncStorage.removeItem("@youconnext_viaje_activo");
      setViajeActivo(null);
      setPasajeros([]);
      setUbicaciones([]);
      setDistanciaTotal(0);

      return response;
    } catch (error) {
      console.error("Error al completar viaje:", error);
      throw error;
    }
  };

  // Cancelar viaje
  const cancelarViaje = async () => {
    if (!viajeActivo) return;

    try {
      await stopTracking();
      try {
        trackingSocketService.endTracking();
        trackingSocketService.disconnect();
      } catch {}

      const response = await trayectoService.eliminarTrayecto(viajeActivo.id);

      // Limpiar
      await AsyncStorage.removeItem("@youconnext_viaje_activo");
      setViajeActivo(null);
      setPasajeros([]);
      setUbicaciones([]);
      setDistanciaTotal(0);

      return response;
    } catch (error) {
      console.error("Error al cancelar viaje:", error);
      throw error;
    }
  };

  // Unirse a un viaje via QR (con ubicación de recogida)
  const unirseViajeQR = async (trayectoId, lat, lng) => {
    try {
      const response = await reservaService.reservaQR(trayectoId, lat, lng);
      return response;
    } catch (error) {
      console.error("Error al unirse al viaje:", error);
      throw error;
    }
  };

  // Iniciar tracking GPS (background + foreground)
  const iniciarTracking = async () => {
    try {
      // Solicitar permisos de foreground
      const { status: fgStatus } =
        await Location.requestForegroundPermissionsAsync();
      if (fgStatus !== "granted") {
        throw new Error("Permiso de ubicación denegado");
      }

      // Solicitar permisos de background
      const { status: bgStatus } =
        await Location.requestBackgroundPermissionsAsync();
      if (bgStatus !== "granted") {
        console.warn("Permiso de ubicación en background denegado");
      }

      let servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        try {
          await Location.enableNetworkProviderAsync();
        } catch {
          // ignore
        }
        servicesEnabled = await Location.hasServicesEnabledAsync();
      }

      if (!servicesEnabled) {
        throw new Error("Servicios de ubicación desactivados");
      }

      setTrackingActivo(true);

      // Iniciar background location updates (cada SAVE_INTERVAL)
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.High,
        timeInterval: GPS_CONFIG.SAVE_INTERVAL,
        distanceInterval: GPS_CONFIG.MIN_DISTANCE,
        deferredUpdatesInterval: GPS_CONFIG.SAVE_INTERVAL,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: "YouConnext",
          notificationBody: "Trackeando tu viaje en curso...",
        },
      });

      // También suscribirse a foreground para UI en tiempo real
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: GPS_CONFIG.SAVE_INTERVAL,
          distanceInterval: GPS_CONFIG.MIN_DISTANCE,
        },
        (location) => {
          registrarUbicacion(location);
        },
      );
    } catch (error) {
      console.error("Error al iniciar tracking:", error);
      setTrackingActivo(false);
      throw error;
    }
  };

  // Detener tracking GPS
  const stopTracking = async () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    try {
      const isRunning = await Location.hasStartedLocationUpdatesAsync(
        BACKGROUND_LOCATION_TASK,
      );
      if (isRunning) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      }
    } catch (e) {
      console.warn("Error al detener background tracking:", e.message);
    }
    setTrackingActivo(false);
  };

  // Registrar ubicación (foreground — para UI en tiempo real)
  const registrarUbicacion = async (location) => {
    if (!viajeActivo || !user) return;

    const { latitude, longitude } = location.coords;

    // Guardar localmente para UI
    const ubicacion = {
      viajeId: viajeActivo.id,
      usuarioId: user.id,
      latitud: latitude,
      longitud: longitude,
      timestamp: Date.now(),
    };
    setUbicaciones((prev) => [...prev, ubicacion]);

    // Enviar al backend (no bloqueante)
    try {
      let address = "";
      try {
        const [geo] = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        if (geo) {
          address = [geo.street, geo.streetNumber, geo.city, geo.region]
            .filter(Boolean)
            .join(", ");
        }
      } catch {
        address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      }
      await trayectoService.guardarRecorrido(viajeActivo.id, {
        lat: latitude,
        lng: longitude,
        address,
      });
    } catch (error) {
      console.log("Ubicación guardada localmente, se enviará después");
    }
  };

  // Iniciar tracking para pasajero (solo cuando ha sido recogido)
  const iniciarTrackingPasajero = async (viaje) => {
    if (!viaje) return;
    try {
      setViajeActivo(viaje);
      setUbicaciones([]);
      setDistanciaTotal(0);
      await saveViajeActivo(viaje, [], [], {
        esPasajero: true,
        pasajeroRecogido: true,
        pasajeroEnDestino: false,
      });
      await iniciarTracking();
    } catch (error) {
      console.error("Error al iniciar tracking de pasajero:", error);
      throw error;
    }
  };

  // Detener tracking de pasajero (cuando llega a destino)
  const detenerTrackingPasajero = async () => {
    try {
      await stopTracking();
      const viajeData = await AsyncStorage.getItem("@youconnext_viaje_activo");
      if (viajeData) {
        const parsed = JSON.parse(viajeData);
        if (parsed.esPasajero) {
          await saveViajeActivo(
            parsed.viaje,
            parsed.pasajeros || [],
            parsed.ubicaciones || [],
            {
              esPasajero: true,
              pasajeroRecogido: true,
              pasajeroEnDestino: true,
            },
          );
        }
      }
    } catch (error) {
      console.error("Error al detener tracking de pasajero:", error);
    }
  };

  // Obtener ubicación actual
  const getUbicacionActual = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Permiso de ubicación denegado");
      }

      let servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        try {
          await Location.enableNetworkProviderAsync();
        } catch {
          // ignore
        }
        servicesEnabled = await Location.hasServicesEnabledAsync();
      }

      if (!servicesEnabled) {
        throw new Error("Servicios de ubicación desactivados");
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      return location;
    } catch (error) {
      console.error("Error al obtener ubicación:", error);
      throw error;
    }
  };

  const value = {
    viajeActivo,
    pasajeros,
    ubicaciones,
    trackingActivo,
    distanciaTotal,
    crearViajeRapido,
    iniciarViaje,
    completarViaje,
    cancelarViaje,
    unirseViajeQR,
    iniciarTracking,
    stopTracking,
    iniciarTrackingPasajero,
    detenerTrackingPasajero,
    getUbicacionActual,
    refreshViaje: loadViajeActivo,
  };

  return (
    <ViajeContext.Provider value={value}>{children}</ViajeContext.Provider>
  );
};

export const useViaje = () => {
  const context = useContext(ViajeContext);
  if (!context) {
    throw new Error("useViaje debe ser usado dentro de ViajeProvider");
  }
  return context;
};

export default ViajeContext;
