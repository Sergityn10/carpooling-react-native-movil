// YouConnext - EnterpriseNavigator (Navegador Independiente de la Suite B2B de Organización)
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Building2,
} from "lucide-react-native";
import { COLORS, BRAND, FONTS } from "../constants";
import {
  EnterpriseDashboardScreen,
  EnterpriseEventsScreen,
  EnterpriseEmployeesScreen,
  EnterpriseSettingsScreen,
} from "../screens/enterprise";

const Tab = createBottomTabNavigator();

const EnterpriseTabIcon = ({ Icon, focused }) => (
  <View style={styles.iconBox}>
    <Icon
      size={22}
      color={focused ? COLORS.primary : COLORS.gray400}
      strokeWidth={focused ? 2.5 : 2}
    />
  </View>
);

const EnterpriseNavigator = () => {
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
      {/* 1. Panel / Métricas Globales */}
      <Tab.Screen
        name="Dashboard"
        component={EnterpriseDashboardScreen}
        options={{
          tabBarLabel: "Panel",
          tabBarIcon: ({ focused }) => (
            <EnterpriseTabIcon Icon={LayoutDashboard} focused={focused} />
          ),
        }}
      />

      {/* 2. Eventos + Métricas de Eventos */}
      <Tab.Screen
        name="Eventos"
        component={EnterpriseEventsScreen}
        options={{
          tabBarLabel: "Eventos",
          tabBarIcon: ({ focused }) => (
            <EnterpriseTabIcon Icon={CalendarDays} focused={focused} />
          ),
        }}
      />

      {/* 3. Directorio de Miembros / Empleados */}
      <Tab.Screen
        name="Equipo"
        component={EnterpriseEmployeesScreen}
        options={{
          tabBarLabel: "Equipo",
          tabBarIcon: ({ focused }) => (
            <EnterpriseTabIcon Icon={Users} focused={focused} />
          ),
        }}
      />

      {/* 4. Perfil y Ajustes de Empresa */}
      <Tab.Screen
        name="Empresa"
        component={EnterpriseSettingsScreen}
        options={{
          tabBarLabel: "Empresa",
          tabBarIcon: ({ focused }) => (
            <EnterpriseTabIcon Icon={Building2} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    elevation: 4,
    shadowColor: BRAND.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    paddingTop: 6,
  },
  iconBox: {
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
});

export default EnterpriseNavigator;
