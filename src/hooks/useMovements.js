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
    available_cents: 0,
    available_eur: "0.00",
    pending_cents: 0,
    pending_eur: "0.00",
    total_cents: 0,
    total_eur: "0.00",
    currency: "eur",
    has_stripe_account: true,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [isStreamConnected, setIsStreamConnected] = useState(false);

  // Referencias estables para evitar bucles de renderizado y reconexión
  const offsetRef = useRef(0);
  const isLoadingMoreRef = useRef(false);
  const isMountedRef = useRef(true);
  const balanceRef = useRef(balance);
  balanceRef.current = balance;
  const roleFilterRef = useRef(roleFilter);
  roleFilterRef.current = roleFilter;
  const hasMoreRef = useRef(hasMore);
  hasMoreRef.current = hasMore;

  // Control de cooldown (TTL de 45 segundos) y deduplicación de peticiones de balance en vuelo
  const lastBalanceFetchRef = useRef(0);
  const activeBalancePromiseRef = useRef(null);

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
              const cachedBal = {
                ...parsed.balance,
                available_eur:
                  parsed.balance.available_eur ||
                  parsed.balance.balance_eur ||
                  "0.00",
                pending_eur: parsed.balance.pending_eur || "0.00",
              };
              balanceRef.current = cachedBal;
              setBalance(cachedBal);
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

  // 2. Consulta y sincronización de balance en Stripe Connect con TTL y deduplicación en vuelo
  const fetchBalance = useCallback(async (force = false) => {
    const now = Date.now();

    // Si no es un refresco forzado (pull-to-refresh) y han pasado menos de 45s, reutilizar el balance en memoria
    if (
      !force &&
      now - lastBalanceFetchRef.current < 45000 &&
      balanceRef.current.has_stripe_account &&
      balanceRef.current.available_eur !== "0.00"
    ) {
      return balanceRef.current;
    }

    // Deduplicación: Si ya hay una llamada a getCashBalance en curso, reutilizar la misma promesa
    if (activeBalancePromiseRef.current) {
      return activeBalancePromiseRef.current;
    }

    activeBalancePromiseRef.current = (async () => {
      try {
        const res = await paymentService.getCashBalance();

        let availableCents = 0;
        let availableEur = "0.00";
        let pendingCents = 0;
        let pendingEur = "0.00";
        let currency = "eur";

        if (res) {
          // 1. Extraer saldo disponible (available)
          if (res.availableAmount !== undefined && res.availableAmount !== null) {
            const num =
              typeof res.availableAmount === "number"
                ? res.availableAmount
                : parseFloat(String(res.availableAmount).replace(",", ".")) || 0;
            availableEur = num.toFixed(2);
            availableCents = Math.round(num * 100);
          } else if (res.cashBalance?.available?.[0]?.amount !== undefined) {
            availableCents = res.cashBalance.available[0].amount || 0;
            availableEur = (availableCents / 100).toFixed(2);
            currency = res.cashBalance.available[0].currency || currency;
          }

          // 2. Extraer saldo pendiente (pending)
          if (res.pendingAmount !== undefined && res.pendingAmount !== null) {
            const num =
              typeof res.pendingAmount === "number"
                ? res.pendingAmount
                : parseFloat(String(res.pendingAmount).replace(",", ".")) || 0;
            pendingEur = num.toFixed(2);
            pendingCents = Math.round(num * 100);
          } else if (res.cashBalance?.pending?.[0]?.amount !== undefined) {
            pendingCents = res.cashBalance.pending[0].amount || 0;
            pendingEur = (pendingCents / 100).toFixed(2);
            if (!currency && res.cashBalance.pending[0].currency) {
              currency = res.cashBalance.pending[0].currency;
            }
          }
        }

        const totalCents = availableCents + pendingCents;
        const totalEur = (totalCents / 100).toFixed(2);

        const newBalance = {
          balance_cents: availableCents,
          balance_eur: availableEur,
          available_cents: availableCents,
          available_eur: availableEur,
          pending_cents: pendingCents,
          pending_eur: pendingEur,
          total_cents: totalCents,
          total_eur: totalEur,
          currency,
          has_stripe_account: true,
        };

        lastBalanceFetchRef.current = Date.now();
        balanceRef.current = newBalance;

        if (isMountedRef.current) {
          setBalance(newBalance);
        }
        return newBalance;
      } catch (err) {
        const errMsg = err?.message || "";
        const status = err?.status;

        // 404: El usuario no tiene cuenta Stripe Connect creada todavía
        if (
          status === 404 ||
          errMsg.includes("STRIPE_ACCOUNT_NOT_FOUND") ||
          errMsg.includes("no tiene cuenta")
        ) {
          const notFoundBalance = {
            balance_cents: 0,
            balance_eur: "0.00",
            available_cents: 0,
            available_eur: "0.00",
            pending_cents: 0,
            pending_eur: "0.00",
            total_cents: 0,
            total_eur: "0.00",
            currency: "eur",
            has_stripe_account: false,
          };
          lastBalanceFetchRef.current = Date.now();
          balanceRef.current = notFoundBalance;
          if (isMountedRef.current) {
            setBalance(notFoundBalance);
          }
          return notFoundBalance;
        }

        if (typeof __DEV__ !== "undefined" && __DEV__) {
          console.warn("[useMovements] Error al actualizar balance de Stripe:", errMsg);
        }
        return null;
      } finally {
        activeBalancePromiseRef.current = null;
      }
    })();

    return activeBalancePromiseRef.current;
  }, []);

  // 3. Carga paginada de movimientos desde la API con referencias estables
  const loadMovements = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh && (isLoadingMoreRef.current || !hasMoreRef.current)) {
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
      const currentRole = roleFilterRef.current;

      try {
        const [movementsRes, freshBalance] = await Promise.all([
          paymentService.getMovements({
            role: currentRole === "all" ? undefined : currentRole,
            limit: PAGE_LIMIT,
            offset: offsetRef.current,
          }),
          fetchBalance(isRefresh),
        ]);

        if (!isMountedRef.current) return;

        if (movementsRes && movementsRes.status === "Success") {
          const fetchedMovements = movementsRes.movements || [];

          setMovements((prev) => {
            const nextList = isRefresh
              ? fetchedMovements
              : [...prev, ...fetchedMovements];

            // Guardar en caché los primeros 20 elementos y balance
            if (isRefresh && currentRole === "all") {
              const cachePayload = {
                movements: nextList.slice(0, PAGE_LIMIT),
                balance: freshBalance || balanceRef.current,
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
          const moreAvailable = offsetRef.current < totalCount;
          hasMoreRef.current = moreAvailable;
          setHasMore(moreAvailable);
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
    [fetchBalance],
  );

  // 4. Recargar cuando cambia el filtro de rol
  useEffect(() => {
    setLoading(true);
    offsetRef.current = 0;
    hasMoreRef.current = true;
    setHasMore(true);
    loadMovements(true);
  }, [roleFilter, loadMovements]);

  // 5. Manejo de ciclo de vida del canal SSE con referencias estables (Cero reconexiones espurias)
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
          // Reutiliza caché si han pasado menos de 45s
          fetchBalance(false);
        } else if (type === "movement.created") {
          // Si coincide con el filtro o estamos en 'all', refrescar en T+0
          if (
            roleFilterRef.current === "all" ||
            data?.role === roleFilterRef.current
          ) {
            loadMovements(true);
          } else {
            // Siempre actualizar balance si entra dinero
            fetchBalance(true);
          }
        } else if (type === "balance.updated") {
          fetchBalance(true);
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
    }, [loadMovements, fetchBalance]),
  );

  const refresh = useCallback(() => {
    return loadMovements(true);
  }, [loadMovements]);

  const loadMore = useCallback(() => {
    if (
      !isLoadingMoreRef.current &&
      hasMoreRef.current &&
      !loading &&
      !refreshing
    ) {
      loadMovements(false);
    }
  }, [loading, refreshing, loadMovements]);

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
