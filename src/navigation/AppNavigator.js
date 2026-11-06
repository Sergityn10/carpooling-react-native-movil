// YouConnext - App Navigator (5 Tabs oficiales: Inicio, Explorar, Publicar, Mis viajes, Perfil)
import React from "react";
import {
  NavigationContainer,
  getStateFromPath,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Home,
  User,
  Car,
  Compass,
  Plus,
} from "lucide-react-native";
import { COLORS, BRAND, FONTS, SHADOWS, RADIUS } from "../constants";
import { useUser } from "../context/UserContext";
import {
  HomeScreen,
  PerfilScreen,
  EscanearQRScreen,
  ViajeDetalleScreen,
  MiViajeScreen,
  AuthScreen,
  LoginScreen,
  RegisterScreen,
  CrearViajeScreen,
  SearchTrayectosScreen,
  ViajeEnCursoScreen,
  OnboardingScreen,
  MisUbicacionesScreen,
  EventDetailScreen,
  MisEventosScreen,
  MisPlanesScreen,
  PerfilPublicoScreen,
  OpinionesScreen,
  ValorarPasajerosScreen,
  ValorarViajeScreen,
  ChatListScreen,
  ChatDetailScreen,
  DirectChatScreen,
  EventParticipantsScreen,
  WalletScreen,
  EnterpriseLoginScreen,
  EnterpriseRegisterScreen,
  EnterpriseOnboardingScreen,
  EnterpriseCrearEventoScreen,
  EnterpriseEditarEventoScreen,
  EnterpriseEventDetailScreen,
  EnterpriseQRScannerScreen,
  EnterpriseProfileEditScreen,
} from "../screens";
import EnterpriseNavigator from "./EnterpriseNavigator";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Componente para los iconos del tab
const TabIcon = ({ Icon, focused }) => (
  <View style={styles.tabIconContainer}>
    <Icon
      size={22}
      color={focused ? COLORS.primary : COLORS.gray400}
      strokeWidth={focused ? 2.5 : 2}
    />
  </View>
);

// Componente ficticio para la pestaña central "Publicar"
const EmptyScreen = () => null;

// Navegación principal con 5 Pestañas: Inicio, Explorar, + Publicar, Mis viajes, Perfil
const MainTabs = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          ...styles.tabBar,
          paddingBottom: 8 + (insets.bottom || 0),
          height: 64 + (insets.bottom || 0),
        },
        tabBarShowLabel: true,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray400,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      {/* 1. Inicio */}
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={Home} focused={focused} />
          ),
          tabBarLabel: "Inicio",
        }}
      />

      {/* 2. Explorar (Mapa interactivo, trayectos y eventos) */}
      <Tab.Screen
        name="SearchTab"
        component={SearchTrayectosScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={Compass} focused={focused} />
          ),
          tabBarLabel: "Explorar",
        }}
      />

      {/* 3. Publicar (Botón central ámbar destacado con + grande) */}
      <Tab.Screen
        name="PublicarTab"
        component={EmptyScreen}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("CrearViaje");
          },
        }}
        options={{
          tabBarLabel: "Publicar",
          tabBarLabelStyle: styles.tabLabelCenter,
          tabBarIcon: () => (
            <View style={styles.publishCenterButton}>
              <Plus size={24} color={BRAND.black} strokeWidth={2.8} />
            </View>
          ),
        }}
      />

      {/* 4. Mis viajes */}
      <Tab.Screen
        name="MisPlanes"
        component={MisPlanesScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={Car} focused={focused} />
          ),
          tabBarLabel: "Mis viajes",
        }}
      />

      {/* 5. Perfil */}
      <Tab.Screen
        name="Perfil"
        component={PerfilScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={User} focused={focused} />
          ),
          tabBarLabel: "Perfil",
        }}
      />
    </Tab.Navigator>
  );
};

// Pantalla de carga mientras se verifica la sesión
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <Image
      source={require("../../assets/logo-sin-bg-198px-ajustado.png")}
      style={styles.loadingLogo}
      resizeMode="contain"
    />
    <ActivityIndicator
      size="large"
      color={COLORS.primary}
      style={styles.loadingSpinner}
    />
  </View>
);

// Configuración de Deep Linking
const REDIRECT_SCREEN_MAP = {
  perfil: "Perfil",
  "mis-planes": "MisPlanes",
  home: "Home",
  buscar: "SearchTab",
  wallet: "Wallet",
  monedero: "Wallet",
  historial: "Historial",
  "enterprise-login": "EnterpriseLogin",
  "enterprise-register": "EnterpriseRegister",
};

const linking = {
  prefixes: [
    "youconnext://",
    "https://app.youconnext.es",
    "http://app.youconnext.es",
    "exp+youconnextapp://",
  ],
  config: {
    screens: {
      Main: {
        screens: {
          Home: "home",
          SearchTab: "buscar",
          MisPlanes: "mis-planes",
          Perfil: "perfil",
        },
      },
      ViajeDetalle: {
        path: "api/trayecto/:id",
        parse: {
          id: (id) => Number(id),
        },
      },
      ViajeEnCurso: "api/trayecto/:id/en-curso",
      Wallet: "wallet",
      Historial: "historial",
      EnterpriseLogin: "enterprise/login",
      EnterpriseRegister: "enterprise/register",
    },
  },
  getStateFromPath(path, config) {
    const [pathPart, queryPart] = path.split("?");
    if (pathPart === "/redirect") {
      const params = new URLSearchParams(queryPart);
      const to = params.get("to");
      const screenName = REDIRECT_SCREEN_MAP[to] || "Home";
      return {
        routes: [
          {
            name: "Main",
            state: {
              routes: [{ name: screenName }],
            },
          },
        ],
      };
    }
    return getStateFromPath(path, config);
  },
};

// Navegación principal de la app
const AppNavigator = () => {
  const { user, isAuthenticated, loading, activeMode } = useUser();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <NavigationContainer linking={linking}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen
            name="EnterpriseLogin"
            component={EnterpriseLoginScreen}
          />
          <Stack.Screen
            name="EnterpriseRegister"
            component={EnterpriseRegisterScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  const needsOnboarding =
    user &&
    (user.onboarding_ended === 0 ||
      user.onboarding_ended === false ||
      user.onboarding_ended === "0" ||
      user.onboarding_ended === null ||
      user.onboarding_ended === undefined);

  if (needsOnboarding) {
    const isEnterpriseUser =
      user?.role === "enterprise" ||
      user?.identity_type === "LEGAL_ENTITY" ||
      activeMode === "enterprise";

    return (
      <NavigationContainer linking={linking}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isEnterpriseUser ? (
            <Stack.Screen
              name="EnterpriseOnboarding"
              component={EnterpriseOnboardingScreen}
            />
          ) : (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        {activeMode === "enterprise" ? (
          <Stack.Screen name="EnterpriseRoot" component={EnterpriseNavigator} />
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
        {/* Pantallas secundarias exclusivas de la Suite de Organización */}
        <Stack.Screen
          name="EnterpriseCrearEvento"
          component={EnterpriseCrearEventoScreen}
          options={{ animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="EnterpriseEditarEvento"
          component={EnterpriseEditarEventoScreen}
        />
        <Stack.Screen
          name="EnterpriseEventDetail"
          component={EnterpriseEventDetailScreen}
        />
        <Stack.Screen
          name="EnterpriseQRScanner"
          component={EnterpriseQRScannerScreen}
          options={{ animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="EnterpriseProfileEdit"
          component={EnterpriseProfileEditScreen}
        />
        <Stack.Screen
          name="EscanearQR"
          component={EscanearQRScreen}
          options={{ animation: "slide_from_bottom" }}
        />
        <Stack.Screen name="ViajeDetalle" component={ViajeDetalleScreen} />
        <Stack.Screen name="MiViaje" component={MiViajeScreen} />
        <Stack.Screen name="ViajeEnCurso" component={ViajeEnCursoScreen} />
        <Stack.Screen
          name="CrearViaje"
          component={CrearViajeScreen}
          options={{ animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="SearchTrayectos"
          component={SearchTrayectosScreen}
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen name="Perfil" component={PerfilScreen} />
        <Stack.Screen name="MisUbicaciones" component={MisUbicacionesScreen} />
        <Stack.Screen name="EventDetalle" component={EventDetailScreen} />
        <Stack.Screen name="EventParticipants" component={EventParticipantsScreen} />
        <Stack.Screen name="MisEventos" component={MisEventosScreen} />
        <Stack.Screen name="PerfilPublico" component={PerfilPublicoScreen} />
        <Stack.Screen name="Opiniones" component={OpinionesScreen} />
        <Stack.Screen
          name="ValorarPasajeros"
          component={ValorarPasajerosScreen}
        />
        <Stack.Screen name="ValorarViaje" component={ValorarViajeScreen} />
        <Stack.Screen name="Chats" component={ChatListScreen} />
        <Stack.Screen name="ChatDetalle" component={ChatDetailScreen} />
        <Stack.Screen name="DirectChat" component={DirectChatScreen} />
        <Stack.Screen name="Wallet" component={WalletScreen} />
        <Stack.Screen name="Historial" component={WalletScreen} />
        <Stack.Screen name="Estadisticas" component={HomeScreen} />
        <Stack.Screen name="Ajustes" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  loadingLogo: {
    width: 90,
    height: 90,
    marginBottom: 16,
  },
  loadingSpinner: {
    marginTop: 8,
  },
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border, // #D6E2DB
    elevation: 4,
    shadowColor: BRAND.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    paddingTop: 6,
  },
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  tabLabelCenter: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 11,
    fontWeight: "700",
    color: BRAND.black,
    marginTop: 2,
  },
  // Botón central ámbar oficial (Pág. 6 de la Guía)
  publishCenterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND.accent, // #F2A33C
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    shadowColor: BRAND.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
});

export default AppNavigator;
