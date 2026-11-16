// YouConnext - Floating In-App Banner for Foreground `trip_alert_matched` Notifications
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BellRing, ChevronRight, X } from "lucide-react-native";
import { BRAND, COLORS, FONTS, RADIUS, SHADOWS, SPACING } from "../../constants";

const TripAlertBanner = ({ alert, onPress, onDismiss }) => {
  const insets = useSafeAreaInsets();
  if (!alert) return null;

  const hasRoute = Boolean(alert.origin || alert.destination);
  const routeTitle = hasRoute
    ? `${alert.origin || "Origen"} → ${alert.destination || "Destino"}`
    : alert.title || "¡Nuevo trayecto encontrado!";

  const seatsLabel = alert.seats
    ? `${alert.seats} ${String(alert.seats) === "1" ? "plaza" : "plazas"}`
    : null;

  const metaParts = [
    alert.date,
    alert.time,
    alert.price,
    seatsLabel,
    alert.driverName,
  ].filter(Boolean);

  const subtitle =
    metaParts.length > 0
      ? metaParts.join(" · ")
      : alert.body || "Toca para ver los detalles y reservar tu plaza.";

  return (
    <View
      pointerEvents="box-none"
      style={[styles.overlay, { top: Math.max(insets.top, 10) + 6 }]}
    >
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.92}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Alerta de trayecto: ${routeTitle}`}
      >
        <View style={styles.iconBox}>
          <BellRing size={18} color={BRAND.green} strokeWidth={2.4} />
        </View>

        <View style={styles.textCol}>
          <Text style={styles.kicker}>COINCIDENCIA DE ALERTA</Text>
          <Text style={styles.title} numberOfLines={1}>
            {routeTitle}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        </View>

        <View style={styles.actionsCol}>
          <View style={styles.ctaPill}>
            <Text style={styles.ctaText}>Ver</Text>
            <ChevronRight size={13} color={BRAND.black} strokeWidth={2.8} />
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={(e) => {
              e?.stopPropagation?.();
              onDismiss?.();
            }}
            hitSlop={8}
            accessibilityLabel="Cerrar aviso"
          >
            <X size={15} color="#A7B2AE" strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 9999,
    elevation: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BRAND.black,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: "rgba(0, 200, 83, 0.35)",
    gap: SPACING.sm + 2,
    ...SHADOWS.large,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0, 200, 83, 0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: {
    flex: 1,
  },
  kicker: {
    fontSize: 10,
    fontWeight: "800",
    color: BRAND.green,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  title: {
    fontSize: FONTS.sm,
    fontWeight: "800",
    color: COLORS.white,
  },
  subtitle: {
    fontSize: FONTS.xs,
    color: "#D1DCD6",
    marginTop: 2,
    lineHeight: 16,
  },
  actionsCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  ctaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: BRAND.green,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  ctaText: {
    fontSize: FONTS.xs,
    fontWeight: "800",
    color: BRAND.black,
  },
  closeBtn: {
    padding: 4,
  },
});

export default TripAlertBanner;
