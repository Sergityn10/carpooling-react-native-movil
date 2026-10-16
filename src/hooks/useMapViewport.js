// YouConnext - Hook para gestión de Viewport en Mapa Interactivo
// Debounce, AbortController, caché y estados reactivos

import { useEffect, useRef, useState, useCallback } from "react";
import { regionToBoundingBox, latitudeDeltaToZoom, getPolylinePrecision } from "../utils/mapGeoUtils";
import { mapViewportCache, getCachedOrFetch } from "../utils/mapCache";
import { enrichTripsWithDriverProfiles } from "../utils/enrichTripDrivers";
import { trayectoService } from "../services/travels/trayectoService";

const DEBOUNCE_MS = 300;
const DEFAULT_LIMIT = 50;

const isAbortError = (err) => {
  if (!err) return false;
  const name = err.name || "";
  const msg = (err.message || "").toLowerCase();
  return (
    name === "AbortError" ||
    name === "CanceledError" ||
    msg.includes("abort") ||
    msg.includes("cancel")
  );
};

// Serializa filtros a una clave estable para comparar por valor, no por referencia
const serializeFilters = (filters) => {
  if (!filters) return "{}";
  const keys = Object.keys(filters).sort();
  return keys.map((k) => `${k}:${filters[k]}`).join("|");
};

export function useMapViewport(initialRegion, filters = {}) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);

  const abortControllerRef = useRef(null);
  const activeRequestIdRef = useRef(0);
  const debounceTimerRef = useRef(null);
  const lastBoundsRef = useRef(null);
  const isMountedRef = useRef(true);

  // Referencia a los filtros actuales (evita que fetchViewport se recree)
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  // Clave serializada de filtros para detectar cambios reales
  const filtersKeyRef = useRef(serializeFilters(filters));
  const filtersKey = serializeFilters(filters);

  // Flag para evitar re-fetch en el primer montaje por cambio de isInitialLoading
  const isFirstMountRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort();
        } catch {}
      }
    };
  }, []);

  const fetchViewport = useCallback(
    async (region, isInitial = false) => {
      if (!region) return;

      const bounds = regionToBoundingBox(region);
      const zoom = latitudeDeltaToZoom(region.latitudeDelta);
      const precision = getPolylinePrecision(zoom);

      const boundsKey = `${bounds.minLat.toFixed(4)},${bounds.minLng.toFixed(4)},${bounds.maxLat.toFixed(4)},${bounds.maxLng.toFixed(4)},${zoom}`;
      if (lastBoundsRef.current === boundsKey && !isInitial) return;
      lastBoundsRef.current = boundsKey;

      // Incrementar ID de petición secuencial para prevenir carreras (race conditions)
      const currentRequestId = ++activeRequestIdRef.current;

      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort();
        } catch {}
      }
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      if (!isInitial) setLoading(true);
      else setIsInitialLoading(true);
      setError(null);

      // Usar filtros desde la ref (siempre actualizados sin recrear la función)
      const currentFilters = filtersRef.current;

      const fetchFn = async () => {
        try {
          const res = await trayectoService.obtenerTrayectosViewport(
            {
              minLat: bounds.minLat,
              maxLat: bounds.maxLat,
              minLng: bounds.minLng,
              maxLng: bounds.maxLng,
              zoom,
              precision,
              limit: DEFAULT_LIMIT,
              date: currentFilters.date,
              minSeats: currentFilters.minSeats,
              maxPrice: currentFilters.maxPrice,
              eventoId: currentFilters.eventoId,
            },
            signal
          );

          if (currentRequestId !== activeRequestIdRef.current || signal.aborted) return [];

          const data = res?.data || res?.trayectos || (Array.isArray(res) ? res : []);
          return Array.isArray(data) ? data : [];
        } catch (err) {
          if (isAbortError(err) || signal.aborted || currentRequestId !== activeRequestIdRef.current) {
            return [];
          }

          console.log("Error en endpoint /viewport, usando fallback local:", err.message);
          return trayectoService.obtenerTrayectosViewportLocal({
            minLat: bounds.minLat,
            maxLat: bounds.maxLat,
            minLng: bounds.minLng,
            maxLng: bounds.maxLng,
            zoom,
            precision,
            limit: DEFAULT_LIMIT,
            date: currentFilters.date,
            minSeats: currentFilters.minSeats,
            maxPrice: currentFilters.maxPrice,
            eventoId: currentFilters.eventoId,
          });
        }
      };

      try {
        let data = await getCachedOrFetch(bounds, zoom, currentFilters, fetchFn);

        // Si una petición más reciente ha comenzado o se desmontó, descartar
        if (!isMountedRef.current || currentRequestId !== activeRequestIdRef.current || signal.aborted) {
          return;
        }

        // Si es la carga inicial y el viewport inicial no contiene viajes (ej. Madrid cuando están en Extremadura),
        // descubrir viajes disponibles a nivel nacional para que el mapa no aparezca vacío
        if (isInitial && (!Array.isArray(data) || data.length === 0)) {
          try {
            const wideRes = await trayectoService.obtenerTrayectosViewport(
              {
                minLat: 36.0,
                maxLat: 44.0,
                minLng: -9.5,
                maxLng: 3.5,
                zoom: 8,
                precision: "simplified",
                limit: DEFAULT_LIMIT,
                date: currentFilters.date,
                minSeats: currentFilters.minSeats,
                maxPrice: currentFilters.maxPrice,
                eventoId: currentFilters.eventoId,
              },
              signal
            );
            const wideData = wideRes?.data || wideRes?.trayectos || (Array.isArray(wideRes) ? wideRes : []);
            if (Array.isArray(wideData) && wideData.length > 0) {
              data = wideData;
            }
          } catch (discoveryErr) {
            if (!isAbortError(discoveryErr)) {
              console.log("[useMapViewport] Fallback nacional:", discoveryErr.message);
            }
          }
        }

        if (!isMountedRef.current || currentRequestId !== activeRequestIdRef.current || signal.aborted) {
          return;
        }

        // Renderizar inmediatamente los trayectos
        setTrips(data || []);
        if (isInitial) setIsInitialLoading(false);

        // Enriquecer en segundo plano con fotos y datos públicos de los conductores
        if (Array.isArray(data) && data.length > 0) {
          enrichTripsWithDriverProfiles(data)
            .then((enrichedData) => {
              if (
                isMountedRef.current &&
                currentRequestId === activeRequestIdRef.current &&
                !signal.aborted &&
                Array.isArray(enrichedData)
              ) {
                setTrips(enrichedData);
                mapViewportCache.set(bounds, zoom, currentFilters, enrichedData);
              }
            })
            .catch((enrichErr) => {
              if (!isAbortError(enrichErr)) {
                console.log("[useMapViewport] Error enriqueciendo conductores:", enrichErr.message);
              }
            });
        }
      } catch (err) {
        if (!isMountedRef.current || currentRequestId !== activeRequestIdRef.current || isAbortError(err) || signal.aborted) {
          // Si fue cancelada, permitir que la siguiente petición a estos bounds pueda ejecutarse
          lastBoundsRef.current = null;
          return;
        }
        console.error("Error fetching viewport:", err);
        setError(err.message || "Error al cargar viajes");
        setTrips([]);
      } finally {
        if (isMountedRef.current && currentRequestId === activeRequestIdRef.current && !signal.aborted) {
          setLoading(false);
        }
      }
    },
    [] // Sin dependencias: usa filtersRef.current y activeRequestIdRef
  );

  // Re-fetch when filters change (date, minSeats, maxPrice, eventoId) - SOLO si cambió el valor real
  useEffect(() => {
    // Ignorar el primer cambio de isInitialLoading (primer montaje)
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }

    // Solo re-fetchear si los filtros realmente cambiaron (comparación por valor serializado)
    if (filtersKey !== filtersKeyRef.current) {
      filtersKeyRef.current = filtersKey;
      if (initialRegion) {
        lastBoundsRef.current = null;
        fetchViewport(initialRegion, false);
      }
    }
  }, [filtersKey, initialRegion, fetchViewport]);

  const handleRegionChange = useCallback(() => {
    // Mientras el usuario desplaza o hace zoom, cancelar cualquier petición pendiente
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
  }, []);

  const handleRegionChangeComplete = useCallback(
    (region) => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      // Debounce de 300ms (en rango 250ms - 350ms) para esperar a que termine el gesto
      debounceTimerRef.current = setTimeout(() => {
        fetchViewport(region);
      }, DEBOUNCE_MS);
    },
    [fetchViewport]
  );

  const selectTrip = useCallback((trip) => {
    setSelectedTrip(trip);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedTrip(null);
  }, []);

  const refresh = useCallback(() => {
    lastBoundsRef.current = null;
    mapViewportCache.clear();
    if (initialRegion) fetchViewport(initialRegion, true);
  }, [initialRegion, fetchViewport]);

  const updateFilters = useCallback((newFilters) => {
    return { ...filters, ...newFilters };
  }, [filters]);

  useEffect(() => {
    if (initialRegion) {
      fetchViewport(initialRegion, true);
    }
  }, []);

  return {
    trips,
    loading: isInitialLoading ? true : loading,
    isInitialLoading,
    error,
    selectedTrip,
    selectTrip,
    clearSelection,
    handleRegionChange,
    handleRegionChangeComplete,
    refresh,
    updateFilters,
  };
}