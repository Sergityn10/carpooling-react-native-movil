// YouConnext - MainMenuSection Component (Balanced Professional Design)
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
  Star,
  Zap,
  ChevronRight,
  ScrollText,
  ShieldCheck,
  HelpCircle,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../../../constants";
import styles from "../profileStyles";
import GradientBackground from "../../common/GradientBackground";
import PressableScale from "../../common/PressableScale";

const getBonoInfo = (user) => {
  const cc = user.completitud_cae;
  const comp = user.completitud;

  if (cc && cc.porcentaje_total < 100 && cc.campos_faltantes?.length > 0) {
    return {
      show: true,
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
      title: "Mi Bono Energético",
      subtitle: `${comp.campos_faltantes.length} pasos restantes para completar tu perfil`,
    };
  }
  return { show: false };
};

// Filas del menú con íconos neutrales limpios para evitar saturación de color
const MenuRow = ({ icon: Icon, label, badge, onPress, isLast = false }) => (
  <PressableScale
    style={[styles.menuRowItem, isLast && styles.menuRowItemLast]}
    onPress={onPress}
    scaleTo={0.98}
    accessibilityRole="button"
  >
    <View style={styles.menuRowLeft}>
      <View style={styles.menuRowIconNeutral}>
        <Icon size={18} color={COLORS.gray800} strokeWidth={2.2} />
      </View>
      <Text style={styles.menuRowText}>{label}</Text>
    </View>
    <View style={styles.menuRowRight}>
      {badge ? (
        <View style={styles.menuBadge}>
          <Text style={styles.menuBadgeText}>{badge}</Text>
        </View>
      ) : null}
      <ChevronRight size={18} color={COLORS.gray400} strokeWidth={2.2} />
    </View>
  </PressableScale>
);

const MainMenuSection = ({
  user,
  navigation,
  onLogout,
  publicStats,
  walletBalanceEuros,
  onNavigate,
}) => {
  const completion = user?.completitud?.porcentaje_total ?? 0;
  const displayName = `${user?.name || user?.nombre || "Usuario"} ${user?.surname || user?.apellidos || ""}`.trim();
  const initial = (user?.name || user?.nombre || "U").charAt(0).toUpperCase();
  const locationText = [user?.ciudad, user?.provincia].filter(Boolean).join(", ");
  const bono = getBonoInfo(user);

  return (
    <ScrollView
      style={styles.sectionContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.menuScroll}
    >
      {/* Cabecera Principal del Usuario con Avatar y Progreso */}
      <View style={styles.profileHeaderCard}>
        <View style={styles.headerAvatarContainer}>
          <TouchableOpacity
            style={styles.headerAvatarRing}
            onPress={() => onNavigate("mi-perfil")}
            activeOpacity={0.85}
          >
            {user?.img_perfil ? (
              <Image
                source={{ uri: user.img_perfil }}
                style={styles.avatarMainImage}
              />
            ) : (
              <View style={styles.avatarMain}>
                <Text style={styles.avatarTextMain}>{initial}</Text>
              </View>
            )}
            <View style={styles.editAvatarIconBadge}>
              <UserIcon size={11} color={COLORS.white} strokeWidth={2.5} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.headerTextInfo}>
          <View style={styles.headerNameRow}>
            <Text style={styles.profileMainName} numberOfLines={1}>
              {displayName}
            </Text>
            {completion === 100 && (
              <ShieldCheck size={18} color={COLORS.primary} strokeWidth={2.5} />
            )}
          </View>

          {locationText ? (
            <View style={styles.headerLocationRow}>
              <MapPin size={13} color={COLORS.gray400} strokeWidth={2.2} />
              <Text style={styles.headerLocationText} numberOfLines={1}>
                {locationText}
              </Text>
            </View>
          ) : user?.email ? (
            <Text style={styles.headerEmailText} numberOfLines={1}>
              {user.email}
            </Text>
          ) : null}

          {/* Notificación y Barra de Progreso de Perfil */}
          <TouchableOpacity
            style={styles.completionContainer}
            onPress={() => onNavigate("mi-perfil")}
            activeOpacity={0.8}
          >
            <View style={styles.completionLabelRow}>
              <Text style={styles.profileCompletionHint}>
                Perfil {completion}% completo
              </Text>
              {completion < 100 && (
                <Text style={styles.completionActionText}>Completar →</Text>
              )}
            </View>
            <View style={styles.completionBarBackground}>
              <View
                style={[
                  styles.completionBarFill,
                  { width: `${Math.max(6, completion)}%` },
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tarjeta Destacada del Monedero con Degradado de Marca */}
      <PressableScale
        style={styles.walletHeroCard}
        onPress={() => onNavigate("monedero")}
        scaleTo={0.98}
      >
        <View style={styles.walletHeroInner}>
          <GradientBackground
            colors={COLORS.gradient.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            borderRadius={RADIUS.xl}
          />
          <View style={styles.walletHeroContent}>
            <View style={styles.walletHeroTop}>
              <View style={styles.walletHeroPill}>
                <Wallet size={14} color={COLORS.white} strokeWidth={2.4} />
                <Text style={styles.walletHeroPillText}>Mi Monedero</Text>
              </View>
              <View style={styles.walletArrowBadge}>
                <ChevronRight size={14} color={COLORS.primaryDark} strokeWidth={2.5} />
              </View>
            </View>

            <View style={styles.walletBalanceRow}>
              <View>
                <Text style={styles.walletBalanceLabel}>Saldo disponible</Text>
                <Text style={styles.walletBalanceValue}>
                  {walletBalanceEuros || "0.00"} €
                </Text>
              </View>
              <TouchableOpacity
                style={styles.walletWithdrawBtn}
                onPress={() => onNavigate("monedero")}
                activeOpacity={0.85}
              >
                <Text style={styles.walletWithdrawBtnText}>Gestionar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </PressableScale>

      {/* Tarjeta de Notificación del Bono Energético */}
      {bono.show && (
        <TouchableOpacity
          style={styles.bonoCard}
          onPress={() => onNavigate("bono-energetico")}
          activeOpacity={0.85}
        >
          <View style={styles.bonoIconWrapper}>
            <Zap size={20} color={COLORS.white} strokeWidth={2.5} />
          </View>
          <View style={styles.bonoCardContent}>
            <Text style={styles.bonoCardTitle}>{bono.title}</Text>
            <Text style={styles.bonoCardSubtitle}>{bono.subtitle}</Text>
          </View>
          <ChevronRight size={18} color={COLORS.warning} strokeWidth={2.5} />
        </TouchableOpacity>
      )}

      {/* Estadísticas de 3 Columnas */}
      <View style={styles.statsCardBlock}>
        <View style={styles.statsCol}>
          <Text style={styles.statsValueNumber}>
            {publicStats.completed_trips || 0}
          </Text>
          <Text style={styles.statsColLabel}>Viajes</Text>
          <Text style={styles.statsColSublabel}>completados</Text>
        </View>

        <View style={styles.statsDividerLine} />

        <View style={styles.statsCol}>
          <Text style={styles.statsValueNumber}>
            {(publicStats.kwh_generated || 0).toFixed(1)}
          </Text>
          <Text style={styles.statsColLabel}>kWh</Text>
          <Text style={styles.statsColSublabel}>generados</Text>
        </View>

        <View style={styles.statsDividerLine} />

        <View style={styles.statsCol}>
          <Text style={styles.statsValueNumber}>
            {(publicStats.eur_generated || 0).toFixed(1)}€
          </Text>
          <Text style={styles.statsColLabel}>Ahorro</Text>
          <Text style={styles.statsColSublabel}>acumulado</Text>
        </View>
      </View>

      {/* Sección: Mi Cuenta (Íconos Neutrales y Limpios) */}
      <Text style={styles.menuSectionLabel}>Mi Cuenta</Text>
      <View style={styles.menuItemsBlock}>
        <MenuRow
          icon={UserIcon}
          label="Datos personales"
          onPress={() => onNavigate("mi-perfil")}
        />
        <MenuRow
          icon={MapPin}
          label="Mis ubicaciones frecuentes"
          onPress={() => navigation.navigate("MisUbicaciones")}
        />
        <MenuRow
          icon={Car}
          label="Mis vehículos"
          onPress={() => onNavigate("mis-vehiculos")}
        />
        <MenuRow
          icon={Calendar}
          label="Mi rutina de movilidad"
          onPress={() => onNavigate("rutinas")}
        />
        <MenuRow
          icon={Building}
          label="Mi empresa / Universidad"
          isLast
          onPress={() =>
            Alert.alert(
              "Centro oficial",
              "Vincula tu correo corporativo o universitario para acceder a viajes exclusivos de tu comunidad.",
            )
          }
        />
      </View>

      {/* Sección: Actividad y Finanzas */}
      <Text style={styles.menuSectionLabel}>Actividad y Finanzas</Text>
      <View style={styles.menuItemsBlock}>
        <MenuRow
          icon={History}
          label="Historial de viajes"
          onPress={() => onNavigate("historial")}
        />
        <MenuRow
          icon={Calendar}
          label="Mis eventos"
          onPress={() => navigation.navigate("MisEventos")}
        />
        <MenuRow
          icon={Star}
          label="Valoraciones y opiniones"
          onPress={() => navigation.navigate("Opiniones")}
        />
        <MenuRow
          icon={Zap}
          label="Mi Bono Energético (CAEs)"
          badge="Ahorro"
          onPress={() => onNavigate("bono-energetico")}
        />
        <MenuRow
          icon={Wallet}
          label="Monedero y cobros"
          isLast
          onPress={() => onNavigate("monedero")}
        />
      </View>

      {/* Sección: Configuración y Privacidad */}
      <Text style={styles.menuSectionLabel}>Configuración y Privacidad</Text>
      <View style={styles.menuItemsBlock}>
        <MenuRow
          icon={ShieldCheck}
          label="Permisos y privacidad de datos"
          badge="Control"
          isLast
          onPress={() => onNavigate("permisos")}
        />
      </View>

      {/* Sección: Legal y Ayuda */}
      <Text style={styles.menuSectionLabel}>Legal y Ayuda</Text>
      <View style={styles.menuItemsBlock}>
        <MenuRow
          icon={HelpCircle}
          label="Centro de ayuda"
          onPress={() => Linking.openURL("https://youconnext.es")}
        />
        <MenuRow
          icon={ScrollText}
          label="Términos y condiciones"
          onPress={() => Linking.openURL("https://app.youconnext.es/condiciones")}
        />
        <MenuRow
          icon={ShieldCheck}
          label="Política de privacidad"
          isLast
          onPress={() => Linking.openURL("https://app.youconnext.es/privacidad")}
        />
      </View>

      {/* Botón de Cerrar Sesión */}
      <TouchableOpacity
        style={styles.menuLogoutButton}
        onPress={onLogout}
        activeOpacity={0.8}
      >
        <LogOut size={18} color={COLORS.error} strokeWidth={2.4} />
        <Text style={styles.menuLogoutText}>Cerrar sesión</Text>
      </TouchableOpacity>

      <View style={{ height: SPACING.xxl }} />
    </ScrollView>
  );
};

export default MainMenuSection;
