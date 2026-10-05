// YouConnext - EventParticipantsScreen
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Search,
  X,
  MapPin,
  Calendar,
  MessageCircle,
  Users,
  ChevronRight,
  Sparkles,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../constants";
import { eventService } from "../services/eventService";
import { useUser } from "../context/UserContext";
import { Skeleton } from "../components";

const EventParticipantsScreen = ({ route, navigation }) => {
  const { eventId, event: passedEvent, eventName } = route.params || {};
  const { user } = useUser();

  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");

  const title = eventName || passedEvent?.name || "Participantes";

  const fetchParticipants = useCallback(async () => {
    if (!eventId) return;
    try {
      const res = await eventService.getParticipants(eventId);
      const list = res.participants || res.data || [];
      setParticipants(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn("Error al cargar participantes:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchParticipants();
  }, [fetchParticipants]);

  // Extract unique cities for filtering
  const availableCities = useMemo(() => {
    const citiesSet = new Set();
    participants.forEach((p) => {
      if (p.ciudad && p.ciudad.trim()) {
        citiesSet.add(p.ciudad.trim());
      }
    });
    return Array.from(citiesSet);
  }, [participants]);

  // Filter participants based on search and selected city
  const filteredParticipants = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return participants.filter((p) => {
      const nameMatch = (p.name || "").toLowerCase().includes(query);
      const cityMatch = (p.ciudad || "").toLowerCase().includes(query);
      const provinceMatch = (p.provincia || "").toLowerCase().includes(query);
      const matchesSearch = !query || nameMatch || cityMatch || provinceMatch;

      const matchesCity =
        selectedCity === "all" ||
        (p.ciudad || "").toLowerCase() === selectedCity.toLowerCase();

      return matchesSearch && matchesCity;
    });
  }, [participants, searchQuery, selectedCity]);

  const handleOpenChat = (participant) => {
    const targetId = participant.id || participant.user_id;
    if (!targetId || targetId === user?.id) return;
    navigation.navigate("DirectChat", {
      peerId: targetId,
      peerName: participant.name,
    });
  };

  const handleOpenProfile = (participant) => {
    const targetId = participant.id || participant.user_id;
    if (!targetId) return;
    navigation.navigate("PerfilPublico", {
      userId: targetId,
      user: participant,
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
      });
    } catch {
      return "";
    }
  };

  const getImageUri = (img) => {
    if (!img || typeof img !== "string") return null;
    if (img.startsWith("data:") || img.startsWith("http://") || img.startsWith("https://")) {
      return img;
    }
    return `data:image/jpeg;base64,${img}`;
  };

  const renderParticipantItem = ({ item }) => {
    const isMe = item.id === user?.id;
    const hasLocation = Boolean(item.ciudad || item.provincia);
    const locationText = [item.ciudad, item.provincia]
      .filter(Boolean)
      .join(", ");
    const joinDate = formatDate(item.joined_at);
    const avatarUri = getImageUri(item.img_perfil);

    return (
      <TouchableOpacity
        style={styles.participantCard}
        onPress={() => handleOpenProfile(item)}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>
                {(item.name || "U").charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.infoWrap}>
          <View style={styles.nameRow}>
            <Text style={styles.nameText} numberOfLines={1}>
              {item.name || "Usuario"}
            </Text>
            {isMe && (
              <View style={styles.meBadge}>
                <Text style={styles.meBadgeText}>Tú</Text>
              </View>
            )}
          </View>

          {/* Location */}
          <View style={styles.locationRow}>
            <MapPin
              size={13}
              color={hasLocation ? COLORS.primary : COLORS.gray400}
              strokeWidth={2.2}
            />
            <Text
              style={[
                styles.locationText,
                !hasLocation && styles.noLocationText,
              ]}
              numberOfLines={1}
            >
              {hasLocation ? locationText : "Ubicación no indicada"}
            </Text>
          </View>

          {/* Joined date */}
          {!!joinDate && (
            <View style={styles.dateRow}>
              <Calendar size={11} color={COLORS.gray400} strokeWidth={2} />
              <Text style={styles.dateText}>Se unió el {joinDate}</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsWrap}>
          {!isMe && (
            <TouchableOpacity
              style={styles.chatButton}
              onPress={() => handleOpenChat(item)}
              hitSlop={6}
              activeOpacity={0.8}
            >
              <MessageCircle
                size={18}
                color={COLORS.primary}
                strokeWidth={2.5}
              />
            </TouchableOpacity>
          )}
          <ChevronRight size={18} color={COLORS.gray300} strokeWidth={2.5} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4, 5, 6].map((key) => (
        <View key={key} style={styles.skeletonCard}>
          <Skeleton width={48} height={48} borderRadius={24} />
          <View style={{ flex: 1, gap: 6, marginLeft: SPACING.md }}>
            <Skeleton width={140} height={16} />
            <Skeleton width={110} height={12} />
            <Skeleton width={80} height={10} />
          </View>
          <Skeleton width={36} height={36} borderRadius={18} />
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          hitSlop={8}
        >
          <ChevronLeft size={22} color={COLORS.gray800} strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Asistentes
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {title}
          </Text>
        </View>

        <View style={styles.countBadge}>
          <Users size={12} color={COLORS.primaryDark} strokeWidth={2.5} />
          <Text style={styles.countBadgeText}>{participants.length}</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Search size={16} color={COLORS.gray400} strokeWidth={2.5} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, ciudad o provincia..."
            placeholderTextColor={COLORS.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              hitSlop={6}
              style={styles.clearBtn}
            >
              <X size={14} color={COLORS.gray500} strokeWidth={2.5} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* City filter chips if there are cities */}
      {availableCities.length > 1 && (
        <View style={styles.cityChipsSection}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={["all", ...availableCities]}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.cityChipsList}
            renderItem={({ item }) => {
              const isSelected = selectedCity === item;
              return (
                <TouchableOpacity
                  style={[
                    styles.cityChip,
                    isSelected && styles.cityChipActive,
                  ]}
                  onPress={() => setSelectedCity(item)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.cityChipText,
                      isSelected && styles.cityChipTextActive,
                    ]}
                  >
                    {item === "all" ? "Todas las ciudades" : item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {/* Main content */}
      {loading ? (
        renderSkeleton()
      ) : (
        <FlatList
          data={filteredParticipants}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderParticipantItem}
          contentContainerStyle={
            filteredParticipants.length === 0
              ? styles.emptyListContent
              : styles.listContent
          }
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <Users size={36} color={COLORS.gray400} strokeWidth={1.8} />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery || selectedCity !== "all"
                  ? "Sin resultados para tu búsqueda"
                  : "Aún no hay asistentes"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || selectedCity !== "all"
                  ? "Prueba buscando con otro nombre, ciudad o limpia los filtros."
                  : "Sé el primero en unirte a este evento y conecta con otros asistentes."}
              </Text>
            </View>
          }
        />
      )}
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
    paddingVertical: SPACING.sm + 2,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    ...SHADOWS.small,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONTS.md + 1,
    fontWeight: "800",
    color: COLORS.gray900,
  },
  headerSubtitle: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
    marginTop: 1,
  },
  countBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  countBadgeText: {
    fontSize: FONTS.xs,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
  // Search
  searchSection: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    height: 40,
    gap: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: FONTS.sm,
    color: COLORS.gray800,
    paddingVertical: 0,
  },
  clearBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.gray200,
    alignItems: "center",
    justifyContent: "center",
  },
  // City Chips
  cityChipsSection: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  cityChipsList: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
  cityChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray100,
  },
  cityChipActive: {
    backgroundColor: COLORS.primary,
  },
  cityChipText: {
    fontSize: FONTS.xs,
    fontWeight: "700",
    color: COLORS.gray600,
  },
  cityChipTextActive: {
    color: COLORS.white,
  },
  // List
  listContent: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: SPACING.lg,
  },
  // Participant Card
  participantCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  avatarWrap: {
    position: "relative",
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: FONTS.lg,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
  infoWrap: {
    flex: 1,
    marginLeft: SPACING.md,
    gap: 3,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  nameText: {
    fontSize: FONTS.md,
    fontWeight: "800",
    color: COLORS.gray900,
    flexShrink: 1,
  },
  meBadge: {
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.xs,
  },
  meBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: FONTS.xs,
    fontWeight: "600",
    color: COLORS.gray700,
  },
  noLocationText: {
    color: COLORS.gray400,
    fontStyle: "italic",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 1,
  },
  dateText: {
    fontSize: 10,
    color: COLORS.gray400,
  },
  actionsWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  chatButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  // Skeleton
  skeletonContainer: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  skeletonCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  // Empty state
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONTS.md + 1,
    fontWeight: "800",
    color: COLORS.gray800,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
    textAlign: "center",
    marginTop: SPACING.xs,
    lineHeight: 20,
  },
});

export default EventParticipantsScreen;