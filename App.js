// YouConnext - Main App Entry Point
import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { UserProvider } from "./src/context/UserContext";
import { PermissionProvider } from "./src/context/PermissionContext";
import { OnboardingProvider } from "./src/context/OnboardingContext";
import { ViajeProvider } from "./src/context/ViajeContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { COLORS } from "./src/constants";
import "./src/services/locationBackgroundTask";

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor={COLORS.white} />
      <UserProvider>
        <PermissionProvider>
          <OnboardingProvider>
            <ViajeProvider>
              <AppNavigator />
            </ViajeProvider>
          </OnboardingProvider>
        </PermissionProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
}
