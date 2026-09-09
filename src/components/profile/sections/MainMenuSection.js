import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Linking,
} from "react-native";
import {
  Car,
  LogOut,
  Wallet,
  User as UserIcon,
  MapPin,
  Calendar,
  History,
  Building,
  Heart,
  Star,
  TrendingUp,
  Zap,
  ChevronRight,
  ScrollText,
  ShieldCheck,
} from "lucide-react-native";
import { COLORS, SPACING } from "../../../constants";
import styles from "../profileStyles";

const getBonoInfo = (user) => {
  const cc = user.completitud_cae;
  const comp = user.completitud;

  if (cc && cc.porcentaje_total < 100 && cc.campos_faltantes?.length > 0) {
    return {
      show: true,
      icon: Car,
      title: "Mi Bono Energético",
      subtitle: `${cc.campos_faltantes.length} pasos para poder generar CAEs`,
    };
  }
  if (
    comp &&
    comp.porcentaje_total < 100 &&
    comp.campos_faltantes?.length > 0
  ) {
    return {
      show: true,
      icon: Zap,
      title: "Mi Bono Energético",
      subtitle: `${comp.campos_faltantes.length} pasos restantes para completar tu perfil`,
    };
  }
  return { show: false };
};

const MenuRow = ({ icon, iconColor, iconBg, label, onPress }) => (
  <TouchableOpacity
    style={styles.menuRowItem}
    onPress={onPress}
    activeOpacity={0.6}
  >
    <View style={styles.menuRowLeft}>
      <View style={[styles.menuRowIcon, { backgroundColor: iconBg }]}>
        {icon}
      </View>
      <Text style={styles.menuRowText}>{label}</Text>
    </View>
    <ChevronRight size={18} color={COLORS.gray300} strokeWidth={2} />
  </TouchableOpacity>
);

const MainMenuSection = ({
  user,
  navigation,
  onLogout,
  publicStats,
  walletBalanceEuros,
  onNavigate,
}) => (
  <ScrollView
    style={styles.sectionContent}
    showsVerticalScrollIndicator={false}
    contentContainerStyle={styles.menuScroll}
  >
    {/* Cabecera profesional */}
    <View style={styles.profileHeaderCard}>
      <View style={styles.headerAvatarContainer}>
        <View style={styles.headerAvatarRing}>
          {user.img_perfil ? (
            <Image
              source={{ uri: user.img_perfil }}
              style={styles.avatarMainImage}
            />
          ) : (
            <View style={styles.avatarMain}>
              <Text style={styles.avatarTextMain}>
                {user.name?.charAt(0)?.toUpperCase() || "?"}
              </Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.headerTextInfo}>
        <Text style={styles.profileMainName}>
          {user.name} {user.surname}
        </Text>
        {(user.ciudad || user.provincia) && (
          <View style={styles.headerLocationRow}>
            <MapPin size={12} color={COLORS.gray400} strokeWidth={2} />
            <Text style={styles.headerLocationText}>
              {[user.ciudad, user.provincia].filter(Boolean).join(", ")}
            </Text>
          </View>
        )}
        <Text style={styles.profileCompletionHint}>
          Perfil completo al {user.completitud?.porcentaje_total ?? 0}%
        </Text>
        <View style={styles.completionBarBackground}>
          <View
            style={[
              styles.completionBarFill,
              { width: `${user.completitud?.porcentaje_total ?? 0}%` },
            ]}
          />
        </View>
      </View>
    </View>

    {/* Tarjeta Mi Bono Energético */}
    {(() => {
      const bono = getBonoInfo(user);
      if (!bono.show) return null;
      const BonoIcon = bono.icon;
      return (
        <TouchableOpacity
          style={styles.bonoCard}
          onPress={() => onNavigate("bono-energetico")}
          activeOpacity={0.8}
        >
          <View style={styles.bonoIconWrapper}>
            <BonoIcon size={22} color={COLORS.white} strokeWidth={2.5} />
          </View>
          <View style={styles.bonoCardContent}>
            <Text style={styles.bonoCardTitle}>{bono.title}</Text>
            <Text style={styles.bonoCardSubtitle}>{bono.subtitle}</Text>
          </View>
          <ChevronRight size={20} color={COLORS.gray400} strokeWidth={2} />
        </TouchableOpacity>
      );
    })()}

    {/* Tarjeta de aviso del monedero */}
    {user.monedero &&
      (user.monedero.disponible !== true ||
        user.monedero?.config?.wallet_enabled === false) && (
        <TouchableOpacity
          style={styles.bonoCard}
          onPress={() => onNavigate("monedero")}
          activeOpacity={0.8}
        >
          <View style={styles.bonoIconWrapper}>
            <Wallet size={22} color={COLORS.white} strokeWidth={2.5} />
          </View>
          <View style={styles.bonoCardContent}>
            <Text style={styles.bonoCardTitle}>Monedero</Text>
            <Text style={styles.bonoCardSubtitle}>
              {user.monedero.mensaje ||
                "Configura tu monedero para recibir ganancias"}
            </Text>
          </View>
          <ChevronRight size={20} color={COLORS.gray400} strokeWidth={2} />
        </TouchableOpacity>
      )}

    {/* Tarjeta de Ahorro generado */}
    <View style={styles.savingsCard}>
      <View style={styles.savingsLeft}>
        <View style={styles.savingsIconLabelRow}>
          <TrendingUp size={16} color={COLORS.white} strokeWidth={2.5} />
          <Text style={styles.savingsLabel}>Saldo del monedero</Text>
          <View style={styles.infoCircle}>
            <Text style={styles.infoCircleText}>i</Text>
          </View>
        </View>
        <Text style={styles.savingsDate}>Disponible para retirar</Text>
      </View>
      <Text style={styles.savingsValue}>{walletBalanceEuros} €</Text>
    </View>

    {/* Bloque de estadísticas de 3 columnas */}
    <View style={styles.statsCardBlock}>
      <View style={styles.statsCol}>
        <Text style={styles.statsValueNumber}>
          {publicStats.completed_trips}
        </Text>
        <Text style={styles.statsColLabel}>Viajes</Text>
        <Text style={styles.statsColLabel}>realizados</Text>
      </View>
      <View style={styles.statsDividerLine} />
      <View style={styles.statsCol}>
        <Text style={styles.statsValueNumber}>
          {publicStats.kwh_generated.toFixed(2)}
        </Text>
        <Text style={styles.statsColLabel}>kWh</Text>
        <Text style={styles.statsColLabel}>generados</Text>
      </View>
      <View style={styles.statsDividerLine} />
      <View style={styles.statsCol}>
        <Text style={styles.statsValueNumber}>
          {publicStats.eur_generated.toFixed(2)}€
        </Text>
        <Text style={styles.statsColLabel}>Ahorro</Text>
        <Text style={styles.statsColLabel}>generado</Text>
      </View>
    </View>

    {/* Sección: Cuenta */}
    <Text style={styles.menuSectionLabel}>Cuenta</Text>
    <View style={styles.menuItemsBlock}>
      <MenuRow
        icon={<UserIcon size={20} color={COLORS.primary} strokeWidth={2} />}
        iconBg={COLORS.primarySoft}
        label="Mi perfil"
        onPress={() => onNavigate("mi-perfil")}
      />
      <MenuRow
        icon={<MapPin size={20} color={COLORS.secondary} strokeWidth={2} />}
        iconBg={COLORS.secondarySoft}
        label="Mis direcciones"
        onPress={() => navigation.navigate("MisUbicaciones")}
      />
      <MenuRow
        icon={<Calendar size={20} color={COLORS.secondary} strokeWidth={2} />}
        iconBg={COLORS.secondarySoft}
        label="Mi rutina"
        onPress={() => onNavigate("rutinas")}
      />
      <MenuRow
        icon={<Car size={20} color={COLORS.primary} strokeWidth={2} />}
        iconBg={COLORS.primarySoft}
        label="Mis vehículos"
        onPress={() => onNavigate("mis-vehiculos")}
      />
      <MenuRow
        icon={<History size={20} color={COLORS.gray600} strokeWidth={2} />}
        iconBg={COLORS.gray100}
        label="Historial de trayectos"
        onPress={() => onNavigate("historial")}
      />
      <MenuRow
        icon={<Calendar size={20} color={COLORS.accent} strokeWidth={2} />}
        iconBg={COLORS.accentSoft}
        label="Mis eventos"
        onPress={() => navigation.navigate("MisEventos")}
      />
      <MenuRow
        icon={<Building size={20} color={COLORS.gray600} strokeWidth={2} />}
        iconBg={COLORS.gray100}
        label="Mi empresa/universidad"
        onPress={() =>
          Alert.alert(
            "Mi empresa/universidad",
            "Esta funcionalidad te permite vincular tu perfil a tu centro oficial para viajes restringidos.",
          )
        }
      />
    </View>

    {/* Sección: Actividad */}
    <Text style={styles.menuSectionLabel}>Actividad</Text>
    <View style={styles.menuItemsBlock}>
      <MenuRow
        icon={<Heart size={20} color={COLORS.error} strokeWidth={2} />}
        iconBg={COLORS.errorSoft}
        label="Favoritos"
        onPress={() =>
          Alert.alert(
            "Favoritos",
            "Tus viajes y conductores favoritos aparecerán aquí.",
          )
        }
      />
      <MenuRow
        icon={<Star size={20} color={COLORS.warning} strokeWidth={2} />}
        iconBg={COLORS.warningSoft}
        label="Valoraciones"
        onPress={() => navigation.navigate("Opiniones")}
      />
      <MenuRow
        icon={<Zap size={20} color={COLORS.warning} strokeWidth={2} />}
        iconBg={COLORS.warningSoft}
        label="Mi Bono Energético"
        onPress={() => onNavigate("bono-energetico")}
      />
      <MenuRow
        icon={<Wallet size={20} color={COLORS.primary} strokeWidth={2} />}
        iconBg={COLORS.primarySoft}
        label="Monedero"
        onPress={() => onNavigate("monedero")}
      />
    </View>

    {/* Sección: Legal */}
    <Text style={styles.menuSectionLabel}>Legal</Text>
    <View style={styles.menuItemsBlock}>
      <MenuRow
        icon={<ScrollText size={20} color={COLORS.gray600} strokeWidth={2} />}
        iconBg={COLORS.gray100}
        label="Términos y Condiciones"
        onPress={() => Linking.openURL("https://app.youconnext.es/condiciones")}
      />
      <MenuRow
        icon={<ShieldCheck size={20} color={COLORS.gray600} strokeWidth={2} />}
        iconBg={COLORS.gray100}
        label="Política de Privacidad"
        onPress={() => Linking.openURL("https://app.youconnext.es/privacidad")}
      />
    </View>

    {/* Botón de Cerrar Sesión */}
    <TouchableOpacity
      style={styles.menuLogoutButton}
      onPress={onLogout}
      activeOpacity={0.7}
    >
      <LogOut size={18} color={COLORS.error} strokeWidth={2.5} />
      <Text style={styles.menuLogoutText}>Cerrar sesión</Text>
    </TouchableOpacity>

    <View style={{ height: SPACING.xl }} />
  </ScrollView>
);

export default MainMenuSection;
