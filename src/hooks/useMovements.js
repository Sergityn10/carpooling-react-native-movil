// YouConnext - useMovements Custom Hook
// Integración de movimientos, balance en T+0, caché local offline y streaming SSE con ahorro de batería

import { useState, useEffect, useCallback, useRef } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import paymentService from "../services/paymentService";
import movementStreamService from "../services/movementStreamService";

const CACHE_KEY = "@youconnext_movements_cache";
const PAGE_LIMIT = 20;

/**
 * Hook para gestionar movimientos y balance con tiempo real y caché local.
 * @param {string} initialRole - 'all' | 'driver' | 'passenger'
 */
export function useMovements(initialRole = "all") {
  const [roleFilter, setRoleFilter] = useState(initialRole);
  const [movements, setMovements] = useState([]);
  const [balance, setBalance] = useState({
    balance_cents: 0,
    balance_eur: "0.00",
    currency: "eur",
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [isStreamConnected, setIsStreamConnected] = useState(false);

  const offsetRef = useRef(0);
  const isLoadingMoreRef = useRef(false);
  const isMountedRef = useRef(true);

  // 1. Carga inicial Offline-First (Stale-While-Revalidate)
  useEffect(() => {
    isMountedRef.current = true;

    async function loadCachedData() {
      try {
        const cachedRaw = await AsyncStorage.getItem(CACHE_KEY);
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw);
          if (Array.isArray(parsed)) {
            // Formato de lista simple
            setMovements(parsed);
          } else if (parsed && typeof parsed === "object") {
            if (Array.isArray(parsed.movements)) {
              setMovements(parsed.movements);
            }
            if (parsed.balance) {
              setBalance(parsed.balance);
            }
          }
        }
      } catch (err) {
        if (typeof __DEV__ !== "undefined" && __DEV__) {
          console.warn("[useMovements] Error al leer caché local:", err);
        }
      }
    }

    loadCachedData();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 2. Consulta y sincronización de balance T+0
  const fetchBalance = useCallback(async () => {
    try {
      const res = await paymentService.getWalletBalance();
      if (res && res.balances && res.balances.length > 0) {
        const primary = res.balances[0];
        const cents = primary.balance_cents ?? 0;
        const newBalance = {
          balance_cents: cents,
          balance_eur: (cents / 100).toFixed(2),
          currency: primary.currency || "eur",
        };
        if (isMountedRef.current) {
          setBalance(newBalance);
        }
        return newBalance;
      }
    } catch (err) {
      if (typeof __DEV__ !== "undefined" && __DEV__) {
        console.warn("[useMovements] Error al actualizar balance:", err?.message);
      }
    }
    return null;
  }, []);

  // 3. Carga paginada de movimientos desde la API
  const loadMovements = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh && (isLoadingMoreRef.current || !hasMore)) {
        return;
      }

      if (isRefresh) {
        offsetRef.current = 0;
        setRefreshing(true);
      } else {
        isLoadingMoreRef.current = true;
        setIsLoadingMore(true);
      }

      setError(null);

      try {
        const [movementsRes, freshBalance] = await Promise.all([
          paymentService.getMovements({
            role: roleFilter === "all" ? undefined : roleFilter,
            limit: PAGE_LIMIT,
            offset: offsetRef.current,
          }),
          isRefresh ? fetchBalance() : Promise.resolve(null),
        ]);

        if (!isMountedRef.current) return;

        if (movementsRes && movementsRes.status === "Success") {
          const fetchedMovements = movementsRes.movements || [];

          setMovements((prev) => {
            const nextList = isRefresh
              ? fetchedMovements
              : [...prev, ...fetchedMovements];

            // Guardar en caché los primeros 20 elementos y balance
            if (isRefresh && roleFilter === "all") {
              const cachePayload = {
                movements: nextList.slice(0, PAGE_LIMIT),
                balance: freshBalance || balance,
                updated_at: new Date().toISOString(),
              };
              AsyncStorage.setItem(
                CACHE_KEY,
                JSON.stringify(cachePayload),
              ).catch(() => {});
            }

            return nextList;
          });

          offsetRef.current += fetchedMovements.length;
          const totalCount = movementsRes.total ?? 0;
          setHasMore(offsetRef.current < totalCount);
        } else {
          setError("No se pudieron cargar los movimientos");
        }
      } catch (err) {
        if (isMountedRef.current) {
          console.error("[useMovements] Error en petición de movimientos:", err);
          setError(err?.message || "Error al conectar con el servidor");
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setRefreshing(false);
          setIsLoadingMore(false);
        }
        isLoadingMoreRef.current = false;
      }
    },
    [roleFilter, hasMore, balance, fetchBalance],
  );

  // 4. Recargar cuando cambia el filtro de rol
  useEffect(() => {
    setLoading(true);
    offsetRef.current = 0;
    setHasMore(true);
    loadMovements(true);
  }, [roleFilter]);

  // 5. Manejo de ciclo de vida del canal SSE (Ahorro de batería extremo)
  useFocusEffect(
    useCallback(() => {
      let isScreenFocused = true;

      const connectSSEIfActive = () => {
        if (AppState.currentState === "active" && isScreenFocused) {
          movementStreamService.connect();
        }
      };

      connectSSEIfActive();

      // Suscripción a los eventos en tiempo real emitidos por el servidor
      const unsubscribe = movementStreamService.subscribe((type, data) => {
        if (!isScreenFocused || !isMountedRef.current) return;

        if (type === "connected") {
          setIsStreamConnected(true);
        } else if (type === "balance.current") {
          setIsStreamConnected(true);
          if (data && data.balance_cents !== undefined) {
            setBalance({
              balance_cents: data.balance_cents,
              balance_eur:
                data.balance_eur || (data.balance_cents / 100).toFixed(2),
              currency: data.currency || "eur",
            });
          }
        } else if (type === "movement.created") {
          // Si coincide con el filtro o estamos en 'all', refrescar en T+0
          if (roleFilter === "all" || data?.role === roleFilter) {
            loadMovements(true);
          } else {
            // Siempre actualizar balance si entra dinero
            fetchBalance();
          }
        } else if (type === "balance.updated") {
          fetchBalance();
        } else if (type === "error") {
          setIsStreamConnected(false);
        }
      });

      // Escuchar cambios de estado de la app (foreground / background)
      const appStateSub = AppState.addEventListener("change", (nextState) => {
        if (nextState === "active" && isScreenFocused) {
          movementStreamService.connect();
        } else {
          // Desconexión inmediata al salir al escritorio o bloquear teléfono
          setIsStreamConnected(false);
          movementStreamService.disconnect();
        }
      });

      return () => {
        isScreenFocused = false;
        setIsStreamConnected(false);
        unsubscribe();
        appStateSub.remove();
        // Desconexión inmediata al abandonar la pantalla
        movementStreamService.disconnect();
      };
    }, [roleFilter, loadMovements, fetchBalance]),
  );

  const refresh = useCallback(() => {
    return loadMovements(true);
  }, [loadMovements]);

  const loadMore = useCallback(() => {
    if (!isLoadingMoreRef.current && hasMore && !loading && !refreshing) {
      loadMovements(false);
    }
  }, [hasMore, loading, refreshing, loadMovements]);

  return {
    movements,
    balance,
    loading,
    refreshing,
    isLoadingMore,
    hasMore,
    roleFilter,
    setRoleFilter,
    refresh,
    loadMore,
    error,
    isStreamConnected,
  };
}

export default useMovements;
