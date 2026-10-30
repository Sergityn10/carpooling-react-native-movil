// YouConnext - Main App Entry Point (v2)
import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { UserProvider } from "./src/context/UserContext";
import { PermissionProvider } from "./src/context/PermissionContext";
import { OnboardingProvider } from "./src/context/OnboardingContext";
import { ViajeProvider } from "./src/context/ViajeContext";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
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
