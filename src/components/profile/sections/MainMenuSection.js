import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
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
    {/* Cabecera integrada */}
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
    {user.monedero && user.monedero.disponible === false && (
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
          <TrendingUp size={16} color="#10B981" strokeWidth={2.5} />
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

    {/* Menú de Opciones */}
    <View style={styles.menuItemsBlock}>
      <TouchableOpacity
        style={styles.menuRowItem}
        onPress={() => onNavigate("mi-perfil")}
      >
        <View style={styles.menuRowLeft}>
          <UserIcon size={22} color={COLORS.gray800} strokeWidth={1.8} />
          <Text style={styles.menuRowText}>Mi perfil</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuRowItem}
        onPress={() => navigation.navigate("MisUbicaciones")}
      >
        <View style={styles.menuRowLeft}>
          <MapPin size={22} color={COLORS.gray800} strokeWidth={1.8} />
          <Text style={styles.menuRowText}>Mis direcciones</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuRowItem}
        onPress={() => onNavigate("rutinas")}
      >
        <View style={styles.menuRowLeft}>
          <Calendar size={22} color={COLORS.gray800} strokeWidth={1.8} />
          <Text style={styles.menuRowText}>Mi rutina</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuRowItem}
        onPress={() => onNavigate("mis-vehiculos")}
      >
        <View style={styles.menuRowLeft}>
          <Car size={22} color={COLORS.gray800} strokeWidth={1.8} />
          <Text style={styles.menuRowText}>Mis vehículos</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuRowItem}
        onPress={() => onNavigate("historial")}
      >
        <View style={styles.menuRowLeft}>
          <History size={22} color={COLORS.gray800} strokeWidth={1.8} />
          <Text style={styles.menuRowText}>Historial de trayectos</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuRowItem}
        onPress={() => navigation.navigate("MisEventos")}
      >
        <View style={styles.menuRowLeft}>
          <Calendar size={22} color={COLORS.gray800} strokeWidth={1.8} />
          <Text style={styles.menuRowText}>Mis eventos</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuRowItem}
        onPress={() =>
          Alert.alert(
            "Mi empresa/universidad",
            "Esta funcionalidad te permite vincular tu perfil a tu centro oficial para viajes restringidos.",
          )
        }
      >
        <View style={styles.menuRowLeft}>
          <Building size={22} color={COLORS.gray800} strokeWidth={1.8} />
          <Text style={styles.menuRowText}>Mi empresa/universidad</Text>
        </View>
      </TouchableOpacity>

      {/* Separador de Sección del Menú */}
      <View style={styles.menuSectionDivider} />

      <TouchableOpacity
        style={styles.menuRowItem}
        onPress={() =>
          Alert.alert(
            "Favoritos",
            "Tus viajes y conductores favoritos apareceran aqui.",
          )
        }
      >
        <View style={styles.menuRowLeft}>
          <Heart size={22} color={COLORS.gray800} strokeWidth={1.8} />
          <Text style={styles.menuRowText}>Favoritos</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuRowItem}
        onPress={() => navigation.navigate("Opiniones")}
      >
        <View style={styles.menuRowLeft}>
          <Star size={22} color={COLORS.gray800} strokeWidth={1.8} />
          <Text style={styles.menuRowText}>Valoraciones</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuRowItem}
        onPress={() => onNavigate("bono-energetico")}
      >
        <View style={styles.menuRowLeft}>
          <Zap size={22} color={COLORS.gray800} strokeWidth={1.8} />
          <Text style={styles.menuRowText}>Mi Bono Energético</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuRowItem}
        onPress={() => onNavigate("monedero")}
      >
        <View style={styles.menuRowLeft}>
          <Wallet size={22} color={COLORS.gray800} strokeWidth={1.8} />
          <Text style={styles.menuRowText}>Monedero</Text>
        </View>
      </TouchableOpacity>
    </View>

    {/* Botón de Cerrar Sesión */}
    <TouchableOpacity style={styles.menuLogoutButton} onPress={onLogout}>
      <LogOut size={18} color={COLORS.error} strokeWidth={2.5} />
      <Text style={styles.menuLogoutText}>Cerrar sesion</Text>
    </TouchableOpacity>

    <View style={{ height: SPACING.xl }} />
  </ScrollView>
);

export default MainMenuSection;
