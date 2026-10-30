// YouConnext - Chat List Screen (Pro UI/UX Redesign)
// Soporte para fotos de eventos, buscador en tiempo real, filtros por categoría y avatares con perfil
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
  RefreshControl,
  Image,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  MessageCircle,
  Users,
  ChevronRight,
  ChevronLeft,
  Search,
  X,
  Ticket,
  Car,
  User,
  Sparkles,
} from "lucide-react-native";
import { useUser } from "../context/UserContext";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS, BRAND } from "../constants";
import { Skeleton, Chip, PressableScale } from "../components";
import { messageService } from "../services/messages/messageService";
import socketService from "../services/messages/socketService";
import userCache from "../services/messages/userCache";
import eventChatCache, {
  getEventImageUri,
} from "../services/messages/eventChatCache";

const FILTER_TODOS = "todos";
const FILTER_EVENTOS = "eventos";
const FILTER_VIAJES = "viajes";
const FILTER_DIRECTOS = "directos";

const formatTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMin < 1) return "Ahora";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffHrs < 24) return `Hace ${diffHrs}h`;
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
};

/**
 * Determina el tipo de chat para filtrado y etiquetado
 */
const getChatType = (chat, eventProfiles = {}) => {
  const isGroup = chat.is_group === 1 || chat.is_group === true;
  if (!isGroup) return "directo";

  if (chat.chat_type === "EVENT" || chat.type === "EVENT") return "evento";
  if (chat.trip_id && eventProfiles[String(chat.trip_id)]) return "evento";
  if (chat.trip_id && eventChatCache.has(chat.trip_id)) return "evento";

  const lowerName = String(chat.name || "").toLowerCase();
  if (lowerName.includes("evento") || lowerName.includes("festival")) return "evento";

  if (chat.chat_type === "TRAYECTO" || chat.chat_type === "VIAJE") return "viaje";
  if (String(chat.name || "").includes("→")) return "viaje";

  return "viaje";
};

const ChatListScreen = ({ navigation }) => {
  const { user } = useUser();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados de búsqueda y filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState(FILTER_TODOS);

  // Cachés de información visual de usuarios y eventos
  const [userProfiles, setUserProfiles] = useState({});
  const [eventProfiles, setEventProfiles] = useState({});

  const resolveChatEntities = async (chatsData, uuid) => {
    // 1. Usuarios de chats directos
    const directUserIds = chatsData
      .filter((c) => !(c.is_group === 1 || c.is_group === true))
      .map((c) => (String(c.send_by) === uuid ? c.send_to : c.send_by))
      .filter(Boolean);

    if (directUserIds.length > 0) {
      userCache
        .resolveMany(directUserIds)
        .then((users) => {
          const map = {};
          for (const u of users) {
            if (u?.id) map[String(u.id)] = u;
          }
          setUserProfiles((prev) => ({ ...prev, ...map }));
        })
        .catch(() => {});
    }

    // 2. Eventos de chats grupales
    const groupChats = chatsData.filter(
      (c) => (c.is_group === 1 || c.is_group === true) && c.trip_id,
    );

    const potentialEventIds = groupChats
      .filter(
        (c) =>
          c.chat_type === "EVENT" ||
          eventChatCache.has(c.trip_id) ||
          !String(c.name || "").includes("→"),
      )
      .map((c) => String(c.trip_id));

    if (potentialEventIds.length > 0) {
      eventChatCache
        .resolveMany(potentialEventIds)
        .then((events) => {
          const evMap = {};
          for (const ev of events) {
            if (ev?.id) evMap[String(ev.id)] = ev;
          }
          setEventProfiles((prev) => ({ ...prev, ...evMap }));
        })
        .catch(() => {});
    }
  };

  const fetchChats = useCallback(async () => {
    try {
      // Precarga silenciosa de eventos inscritos en memoria
      eventChatCache.preloadFromJoinedEvents().catch(() => {});

      const uuid = await userCache.getMyUuid(user?.id);
      const data = await messageService.obtenerChats();
      const chatsData = Array.isArray(data) ? data : [];
      setChats(chatsData);
      resolveChatEntities(chatsData, uuid);
    } catch (err) {
      console.warn("Error al cargar chats:", err?.message);
      setChats([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
    userCache.getMyUuid(user?.id).then((uid) => {
      const effectiveId = uid || user?.id;
      if (effectiveId) {
        socketService.connect(effectiveId);
        socketService.setUserId(effectiveId);
      }
    });
    socketService.onNotification(() => {
      fetchChats();
    });
    return () => {
      socketService.offAll("receiveNotification");
    };
  }, [fetchChats, user?.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchChats();
    setRefreshing(false);
  };

  const isSentByMe = useCallback(
    (sendById) => {
      if (!sendById) return false;
      const s = String(sendById).toLowerCase();
      const myUuid = userCache.getMyUuidSync(user?.id);
      if (myUuid && s === String(myUuid).toLowerCase()) return true;
      if (user?.id && s === String(user.id).toLowerCase()) return true;
      if (user?.userId && s === String(user.userId).toLowerCase()) return true;
      if (user?.uuid && s === String(user.uuid).toLowerCase()) return true;
      return false;
    },
    [user?.id, user?.userId, user?.uuid],
  );

  const handleChatPress = (chat) => {
    const isGroup = chat.is_group === 1 || chat.is_group === true;
    const chatType = getChatType(chat, eventProfiles);
    const event = chat.trip_id ? eventProfiles[String(chat.trip_id)] : null;

    if (isGroup) {
      navigation.navigate("ChatDetalle", {
        chat,
        chatId: chat.chat_id || chat.id,
        chatType,
        event,
      });
    } else {
      const peerId = isSentByMe(chat.send_by) ? chat.send_to : chat.send_by;
      const peerProfile = peerId ? userProfiles[String(peerId)] : null;
      navigation.navigate("DirectChat", {
        peerId,
        chat,
        chatId: chat.chat_id || chat.id,
        peerProfile,
      });
    }
  };

  // Contadores para cada pestaña de filtro
  const chatCounts = useMemo(() => {
    let eventos = 0;
    let viajes = 0;
    let directos = 0;

    chats.forEach((chat) => {
      const type = getChatType(chat, eventProfiles);
      if (type === "evento") eventos++;
      else if (type === "viaje") viajes++;
      else directos++;
    });

    return {
      todos: chats.length,
      eventos,
      viajes,
      directos,
    };
  }, [chats, eventProfiles]);

  // Lista de chats filtrada por buscador y por pestaña
  const filteredChats = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return chats.filter((chat) => {
      const type = getChatType(chat, eventProfiles);

      // 1. Filtro por categoría
      if (activeFilter === FILTER_EVENTOS && type !== "evento") return false;
      if (activeFilter === FILTER_VIAJES && type !== "viaje") return false;
      if (activeFilter === FILTER_DIRECTOS && type !== "directo") return false;

      // 2. Filtro de búsqueda
      if (!query) return true;

      const isGroup = chat.is_group === 1 || chat.is_group === true;
      let displayName = "";
      if (isGroup) {
        displayName = chat.name || "";
      } else {
        const otherId = isSentByMe(chat.send_by) ? chat.send_to : chat.send_by;
        const profile = otherId ? userProfiles[String(otherId)] : null;
        displayName = profile?.name || otherId || "Chat";
      }

      const lastMsg = chat.lastMessage?.message || "";
      const eventName = chat.trip_id
        ? eventProfiles[String(chat.trip_id)]?.name || ""
        : "";

      return (
        displayName.toLowerCase().includes(query) ||
        lastMsg.toLowerCase().includes(query) ||
        eventName.toLowerCase().includes(query)
      );
    });
  }, [chats, activeFilter, searchQuery, userProfiles, eventProfiles, isSentByMe]);

  const renderChatItem = ({ item }) => {
    const isGroup = item.is_group === 1 || item.is_group === true;
    const chatType = getChatType(item, eventProfiles);
    const otherUserId = !isGroup
      ? isSentByMe(item.send_by)
        ? item.send_to
        : item.send_by
      : null;

    const peerProfile = otherUserId ? userProfiles[String(otherUserId)] : null;
    const event = item.trip_id ? eventProfiles[String(item.trip_id)] : null;

    // Nombre a mostrar
    const displayName = isGroup
      ? item.name || event?.name || "Grupo"
      : peerProfile?.name || otherUserId || "Chat";

    // Foto a mostrar
    let avatarUri = null;
    if (chatType === "evento") {
      avatarUri = getEventImageUri(event?.image);
    } else if (!isGroup && peerProfile?.img_perfil) {
      avatarUri = peerProfile.img_perfil;
    }

    const lastMessage = item.lastMessage?.message || "";
    const lastTime = formatTime(item.lastMessage?.created_at);

    return (
      <PressableScale
        style={styles.chatItem}
        onPress={() => handleChatPress(item)}
        scaleTo={0.98}
      >
        {/* Avatar con foto o icono estilizado */}
        <View style={styles.avatarWrapper}>
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={[
                styles.avatarImg,
                chatType === "evento" && styles.avatarImgEvento,
              ]}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.avatarFallback,
                chatType === "evento"
                  ? styles.avatarFallbackEvento
                  : chatType === "viaje"
                    ? styles.avatarFallbackViaje
                    : styles.avatarFallbackDirect,
              ]}
            >
              {chatType === "evento" ? (
                <Ticket size={22} color={COLORS.white} strokeWidth={2.4} />
              ) : chatType === "viaje" ? (
                <Car size={22} color={COLORS.primaryDark} strokeWidth={2.4} />
              ) : (
                <Text style={styles.avatarInitial}>
                  {(displayName || "C").charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
          )}

          {/* Badge miniatura en la esquina del avatar */}
          {chatType === "evento" && (
            <View style={styles.cornerBadgeEvento}>
              <Ticket size={9} color={COLORS.white} strokeWidth={2.6} />
            </View>
          )}
          {chatType === "viaje" && (
            <View style={styles.cornerBadgeViaje}>
              <Car size={9} color={COLORS.white} strokeWidth={2.6} />
            </View>
          )}
        </View>

        {/* Contenido del chat */}
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <View style={styles.nameAndTagRow}>
              <Text style={styles.chatName} numberOfLines={1}>
                {displayName}
              </Text>
              {/* Tag sutil de categoría */}
              <View
                style={[
                  styles.categoryPill,
                  chatType === "evento"
                    ? styles.categoryPillEvento
                    : chatType === "viaje"
                      ? styles.categoryPillViaje
                      : styles.categoryPillDirecto,
                ]}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    chatType === "evento"
                      ? styles.categoryPillTextEvento
                      : chatType === "viaje"
                        ? styles.categoryPillTextViaje
                        : styles.categoryPillTextDirecto,
                  ]}
                >
                  {chatType === "evento"
                    ? "Evento"
                    : chatType === "viaje"
                      ? "Viaje"
                      : "Directo"}
                </Text>
              </View>
            </View>
            <Text style={styles.chatTime}>{lastTime}</Text>
          </View>

          <View style={styles.previewRow}>
            <Text style={styles.chatPreview} numberOfLines={1}>
              {lastMessage || "Sin mensajes aún"}
            </Text>
          </View>
        </View>

        <ChevronRight size={18} color={COLORS.gray300} strokeWidth={2.4} />
      </PressableScale>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Cabecera Superior */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.backButton}
        >
          <ChevronLeft size={22} color={COLORS.gray800} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mensajes</Text>
        <View style={styles.headerRightBadge}>
          <Text style={styles.headerRightBadgeText}>
            {chats.length} {chats.length === 1 ? "chat" : "chats"}
          </Text>
        </View>
      </View>

      {/* Input de Búsqueda Moderna */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Search size={18} color={COLORS.gray400} strokeWidth={2.4} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar chats, eventos o viajes..."
            placeholderTextColor={COLORS.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color={COLORS.gray500} strokeWidth={2.4} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Barra de Filtros con Chips */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <Chip
            label={`Todos (${chatCounts.todos})`}
            active={activeFilter === FILTER_TODOS}
            onPress={() => setActiveFilter(FILTER_TODOS)}
            size="small"
          />
          <Chip
            label={`Eventos (${chatCounts.eventos})`}
            active={activeFilter === FILTER_EVENTOS}
            onPress={() => setActiveFilter(FILTER_EVENTOS)}
            size="small"
          />
          <Chip
            label={`Viajes (${chatCounts.viajes})`}
            active={activeFilter === FILTER_VIAJES}
            onPress={() => setActiveFilter(FILTER_VIAJES)}
            size="small"
          />
          <Chip
            label={`Directos (${chatCounts.directos})`}
            active={activeFilter === FILTER_DIRECTOS}
            onPress={() => setActiveFilter(FILTER_DIRECTOS)}
            size="small"
          />
        </ScrollView>
      </View>

      {/* Lista de Chats con Skeletons */}
      {loading ? (
        <View style={styles.skeletonContainer}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={`skel-${i}`} style={styles.skeletonRow}>
              <Skeleton width={52} height={52} borderRadius={RADIUS.md} />
              <View style={styles.skeletonTextCol}>
                <View style={styles.skeletonHeaderRow}>
                  <Skeleton width="45%" height={16} borderRadius={4} />
                  <Skeleton width="18%" height={12} borderRadius={4} />
                </View>
                <Skeleton width="75%" height={13} borderRadius={4} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item, index) =>
            item.chat_id?.toString() || item.id?.toString() || index.toString()
          }
          renderItem={renderChatItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <MessageCircle
                  size={36}
                  color={COLORS.primaryDark}
                  strokeWidth={2}
                />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery.length > 0
                  ? "Sin resultados"
                  : activeFilter === FILTER_EVENTOS
                    ? "Sin chats de eventos"
                    : activeFilter === FILTER_VIAJES
                      ? "Sin chats de viajes"
                      : activeFilter === FILTER_DIRECTOS
                        ? "Sin chats directos"
                        : "No tienes conversaciones"}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery.length > 0
                  ? `No encontramos ningún chat que coincida con "${searchQuery}"`
                  : activeFilter === FILTER_EVENTOS
                    ? "Únete a un evento oficial para chatear con los demás asistentes."
                    : activeFilter === FILTER_VIAJES
                      ? "Cuando reserves o publiques un viaje, aquí se creará su grupo."
                      : "Tus conversaciones individuales aparecerán en esta sección."}
              </Text>
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.clearSearchBtn}
                  onPress={() => setSearchQuery("")}
                >
                  <Text style={styles.clearSearchText}>Limpiar búsqueda</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  // Cabecera
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.gray100,
  },
  headerTitle: {
    fontSize: FONTS.xl,
    fontWeight: "bold",
    color: COLORS.gray900,
  },
  headerRightBadge: {
    backgroundColor: COLORS.gray100,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  headerRightBadgeText: {
    fontSize: FONTS.xs,
    fontWeight: "600",
    color: COLORS.gray600,
  },
  // Barra de Búsqueda
  searchSection: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F6F5",
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 42,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: "transparent",
  },
  searchInput: {
    flex: 1,
    fontSize: FONTS.sm,
    color: COLORS.gray800,
    paddingVertical: 0,
  },
  // Filtros
  filterSection: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  filterScroll: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
  // Lista
  listContainer: {
    paddingVertical: SPACING.xs,
    paddingBottom: SPACING.xxl * 2,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  // Avatares
  avatarWrapper: {
    position: "relative",
    width: 52,
    height: 52,
  },
  avatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.gray200,
  },
  avatarImgEvento: {
    borderRadius: RADIUS.md, // Cuadrado redondeado para eventos (estilo carátula)
  },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackEvento: {
    backgroundColor: BRAND.greenOnLight,
    borderRadius: RADIUS.md,
  },
  avatarFallbackViaje: {
    backgroundColor: "#E3F4EA",
  },
  avatarFallbackDirect: {
    backgroundColor: COLORS.primaryDark,
  },
  avatarInitial: {
    fontSize: FONTS.lg,
    fontWeight: "bold",
    color: COLORS.white,
  },
  cornerBadgeEvento: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#E67E22", // Naranja vibrante para eventos
    width: 19,
    height: 19,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  cornerBadgeViaje: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.primaryDark,
    width: 19,
    height: 19,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  // Contenido de cada chat
  chatContent: {
    flex: 1,
    gap: 4,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nameAndTagRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: SPACING.xs,
    gap: 6,
  },
  chatName: {
    fontSize: FONTS.md,
    fontWeight: "600",
    color: COLORS.gray900,
    maxWidth: "75%",
  },
  categoryPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  categoryPillEvento: {
    backgroundColor: "#FEF3C7",
  },
  categoryPillTextEvento: {
    fontSize: 9,
    fontWeight: "700",
    color: "#B45309",
    textTransform: "uppercase",
  },
  categoryPillViaje: {
    backgroundColor: "#E3F4EA",
  },
  categoryPillTextViaje: {
    fontSize: 9,
    fontWeight: "700",
    color: BRAND.greenOnLight,
    textTransform: "uppercase",
  },
  categoryPillDirecto: {
    backgroundColor: COLORS.gray100,
  },
  categoryPillTextDirecto: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.gray600,
    textTransform: "uppercase",
  },
  chatTime: {
    fontSize: FONTS.xs,
    color: COLORS.gray400,
    fontWeight: "500",
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  chatPreview: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
    lineHeight: 18,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.gray100,
    marginLeft: 52 + SPACING.md * 2,
  },
  // Skeletons
  skeletonContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.md,
    ...SHADOWS.small,
  },
  skeletonTextCol: {
    flex: 1,
    gap: SPACING.xs + 2,
  },
  skeletonHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  // Empty State
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xxl * 1.5,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#E3F4EA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xs,
  },
  emptyTitle: {
    fontSize: FONTS.lg,
    fontWeight: "bold",
    color: COLORS.gray800,
  },
  emptyText: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
    textAlign: "center",
    lineHeight: 20,
  },
  clearSearchBtn: {
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.full,
  },
  clearSearchText: {
    fontSize: FONTS.sm,
    fontWeight: "600",
    color: COLORS.primaryDark,
  },
});

export default ChatListScreen;
