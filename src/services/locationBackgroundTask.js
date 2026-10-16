// YouConnext - Background Location Task
// Deshabilitado: Eliminado el tracking en segundo plano para cumplir con las directivas de Google Play / App Store.
// import * as TaskManager from "expo-task-manager";
// import * as Location from "expo-location";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { trayectoService } from "./travels/trayectoService";

export const BACKGROUND_LOCATION_TASK = "background-location-task";

/*
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error("[BG Location] Error:", error.message);
    return;
  }

  if (data) {
    const { locations } = data;
    if (!locations || locations.length === 0) return;

    try {
      const viajeData = await AsyncStorage.getItem("@youconnext_viaje_activo");
      if (!viajeData) {
        console.warn("[BG Location] No hay viaje activo, deteniendo task");
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        return;
      }

      const parsed = JSON.parse(viajeData);
      const viajeId = parsed.viaje?.id;
      if (!viajeId) return;

      const location = locations[locations.length - 1];
      const { latitude, longitude } = location.coords;

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

      await trayectoService.guardarRecorrido(viajeId, {
        lat: latitude,
        lng: longitude,
        address,
      });
      console.log("[BG Location] Ubicación enviada:", address);
    } catch (e) {
      console.error("[BG Location] Error al enviar:", e.message);
    }
  }
});
*/
