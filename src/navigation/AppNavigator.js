// YouConnext - App Navigator
import React from "react";
import {
  NavigationContainer,
  getStateFromPath,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Home,
  User,
  ScanLine,
  Compass,
  CalendarCheck,
} from "lucide-react-native";
import { COLORS } from "../constants";
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
  ChatListScreen,
  ChatDetailScreen,
  DirectChatScreen,
} from "../screens";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Componente para los iconos del tab
const TabIcon = ({ Icon, focused, color }) => (
  <View style={styles.tabIconContainer}>
    <Icon
      size={24}
      color={focused ? COLORS.primary : COLORS.gray400}
      strokeWidth={focused ? 2.5 : 2}
    />
  </View>
);

// Navegacion principal (con tabs)
const MainTabs = () => {
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
      <Tab.Screen
        name="MisPlanes"
        component={MisPlanesScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={CalendarCheck} focused={focused} />
          ),
          tabBarLabel: "Mis planes",
        }}
      />
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

// Pantalla de carga mientras se verifica la sesion
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

// Configuración de Deep Linking para la app YouConnext
const REDIRECT_SCREEN_MAP = {
  perfil: "Perfil",
  "mis-planes": "MisPlanes",
  home: "Home",
  buscar: "SearchTab",
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

// Navegacion principal de la app
const AppNavigator = () => {
  const { user, isAuthenticated, loading } = useUser();

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
    return (
      <NavigationContainer linking={linking}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
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
        <Stack.Screen name="Main" component={MainTabs} />
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
        <Stack.Screen name="MisEventos" component={MisEventosScreen} />
        <Stack.Screen name="PerfilPublico" component={PerfilPublicoScreen} />
        <Stack.Screen name="Opiniones" component={OpinionesScreen} />
        <Stack.Screen
          name="ValorarPasajeros"
          component={ValorarPasajerosScreen}
        />
        <Stack.Screen name="Chats" component={ChatListScreen} />
        <Stack.Screen name="ChatDetalle" component={ChatDetailScreen} />
        <Stack.Screen name="DirectChat" component={DirectChatScreen} />
        <Stack.Screen name="Historial" component={HomeScreen} />
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
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  loadingSpinner: {
    marginTop: 8,
  },
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 0,
    elevation: 0,
    shadowColor: COLORS.gray900,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    paddingTop: 8,
  },
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
});

export default AppNavigator;
