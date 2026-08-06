// YouConnext - MisEventosScreen (eventos a los que el usuario se ha unido)
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { ArrowLeft, Calendar } from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../constants";
import { EventCard } from "../components";
import { eventService } from "../services/eventService";

const MisEventosScreen = ({ navigation }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyEvents = useCallback(async () => {
    setError(null);
    try {
      const res = await eventService.getMyJoinedEvents();
      const data = res.events || res.data || [];
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "No se pudieron cargar tus eventos");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMyEvents();
    }, [fetchMyEvents]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMyEvents();
    setRefreshing(false);
  };

  const handleEventPress = (event) => {
    navigation.navigate("EventDetalle", { eventId: event.id, event });
  };

  const renderEvent = ({ item }) => (
    <EventCard
      event={item}
      onPress={() => handleEventPress(item)}
      joinedAt={item.joined_at}
    />
  );

  const renderEmpty = () => {
    if (loading) return null;
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Error</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchMyEvents}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Calendar size={40} color={COLORS.gray300} strokeWidth={2} />
        </View>
        <Text style={styles.emptyTitle}>No tienes eventos</Text>
        <Text style={styles.emptyText}>
          Aún no te has unido a ningún evento. Busca eventos y únete para verlos
          aquí.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={22} color={COLORS.gray700} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis eventos</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderEvent}
        ListEmptyComponent={renderEmpty}
        ListHeaderComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Cargando tus eventos...</Text>
            </View>
          ) : null
        }
        contentContainerStyle={
          events.length === 0 ? styles.emptyList : styles.resultsList
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: FONTS.lg,
    fontWeight: "bold",
    color: COLORS.gray800,
  },
  resultsList: {
    padding: SPACING.lg,
  },
  emptyList: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
  },
  loadingText: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
    marginTop: SPACING.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONTS.lg,
    fontWeight: "bold",
    color: COLORS.gray700,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.md,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: FONTS.sm,
  },
});

export default MisEventosScreen;
