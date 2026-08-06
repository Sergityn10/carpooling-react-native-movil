// YouConnext - Chat List Screen
import React, { useState, useEffect, useCallback } from "react";
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
import {
  MessageCircle,
  Users,
  ChevronRight,
  ChevronLeft,
} from "lucide-react-native";
import { useUser } from "../context/UserContext";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../constants";
import { messageService } from "../services/messages/messageService";
import socketService from "../services/messages/socketService";
import userCache from "../services/messages/userCache";

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

const getChatDisplayName = (chat, currentUserId) => {
  if (chat.is_group) {
    return chat.name || "Grupo";
  }
  const otherUserId =
    chat.send_by === currentUserId ? chat.send_to : chat.send_by;
  return otherUserId || "Chat";
};

const getChatInitial = (chat, currentUserId) => {
  const name = getChatDisplayName(chat, currentUserId);
  return name.charAt(0).toUpperCase();
};

const ChatListScreen = ({ navigation }) => {
  const { user } = useUser();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userNames, setUserNames] = useState({});

  const resolveChatNames = async (chatsData, uuid) => {
    const directChatIds = chatsData
      .filter((c) => !(c.is_group === 1 || c.is_group === true))
      .map((c) => {
        const otherId = String(c.send_by) === uuid ? c.send_to : c.send_by;
        return String(otherId);
      })
      .filter(Boolean);

    console.log("[ChatList] Direct chat user IDs to resolve:", directChatIds);
    if (directChatIds.length === 0) return;

    const users = await userCache.resolveMany(directChatIds);
    console.log("[ChatList] Resolved users from batch:", JSON.stringify(users));
    const namesMap = {};
    for (const u of users) {
      if (u?.id) namesMap[String(u.id)] = u.name || u.id;
    }
    console.log("[ChatList] Names map:", JSON.stringify(namesMap));
    setUserNames(namesMap);
  };

  const fetchChats = useCallback(async () => {
    try {
      const uuid = await userCache.getMyUuid();
      console.log("[ChatList] fetchChats with uuid:", uuid);
      const data = await messageService.obtenerChats();
      const chatsData = Array.isArray(data) ? data : [];
      console.log(
        "[ChatList] Chats received:",
        JSON.stringify(chatsData.slice(0, 2)),
      );
      setChats(chatsData);
      resolveChatNames(chatsData, uuid);
    } catch (err) {
      console.warn("Error al cargar chats:", err.message);
      setChats([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
    if (user?.id) {
      socketService.connect(user.id);
      socketService.setUserId(user.id);
      socketService.onNotification((data) => {
        fetchChats();
      });
    }
    return () => {
      socketService.offAll("receiveNotification");
    };
  }, [fetchChats, user?.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchChats();
    setRefreshing(false);
  };

  const handleChatPress = (chat) => {
    const isGroup = chat.is_group === 1 || chat.is_group === true;
    if (isGroup) {
      navigation.navigate("ChatDetalle", { chat, chatId: chat.chat_id });
    } else {
      const myUuid = userCache.getMyUuidSync();
      const peerId =
        String(chat.send_by) === myUuid ? chat.send_to : chat.send_by;
      navigation.navigate("DirectChat", { peerId, chat, chatId: chat.chat_id });
    }
  };

  const renderChatItem = ({ item }) => {
    const isGroup = item.is_group === 1 || item.is_group === true;
    const otherUserId = !isGroup
      ? String(item.send_by) === userCache.getMyUuidSync()
        ? item.send_to
        : item.send_by
      : null;
    const cachedName = otherUserId ? userNames[String(otherUserId)] : null;
    const displayName = isGroup
      ? item.name || "Grupo"
      : cachedName || otherUserId || "Chat";
    console.log("[ChatList] renderChatItem:", {
      otherUserId,
      cachedName,
      displayName,
    });
    const lastMessage = item.lastMessage?.message || "";
    const lastTime = formatTime(item.lastMessage?.created_at);

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => handleChatPress(item)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.avatar,
            isGroup ? styles.avatarGroup : styles.avatarDirect,
          ]}
        >
          {isGroup ? (
            <Users size={22} color={COLORS.white} strokeWidth={2.5} />
          ) : (
            <Text style={styles.avatarText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>

        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.chatTime}>{lastTime}</Text>
          </View>
          <Text style={styles.chatPreview} numberOfLines={1}>
            {lastMessage || "Sin mensajes"}
          </Text>
        </View>

        <ChevronRight size={20} color={COLORS.gray300} strokeWidth={2.5} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronLeft size={24} color={COLORS.gray800} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chats</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando chats...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronLeft size={24} color={COLORS.gray800} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chats</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={chats}
        keyExtractor={(item, index) =>
          item.chat_id?.toString() || index.toString()
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
            <MessageCircle size={48} color={COLORS.gray300} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No tienes chats</Text>
            <Text style={styles.emptyText}>
              Los chats de tus viajes aparecerán aquí
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONTS.xxl,
    fontWeight: "bold",
    color: COLORS.gray800,
  },
  listContainer: {
    paddingBottom: SPACING.xxl,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarGroup: {
    backgroundColor: COLORS.primary,
  },
  avatarDirect: {
    backgroundColor: COLORS.secondary,
  },
  avatarText: {
    fontSize: FONTS.lg,
    fontWeight: "bold",
    color: COLORS.white,
  },
  chatContent: {
    flex: 1,
    gap: 4,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chatName: {
    fontSize: FONTS.md,
    fontWeight: "600",
    color: COLORS.gray800,
    flex: 1,
    marginRight: SPACING.sm,
  },
  chatTime: {
    fontSize: FONTS.xs,
    color: COLORS.gray400,
  },
  chatPreview: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.gray50,
    marginLeft: 52 + SPACING.lg + SPACING.md,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xxl * 2,
    gap: SPACING.sm,
  },
  emptyTitle: {
    fontSize: FONTS.lg,
    fontWeight: "bold",
    color: COLORS.gray600,
  },
  emptyText: {
    fontSize: FONTS.sm,
    color: COLORS.gray400,
    textAlign: "center",
    paddingHorizontal: SPACING.xl,
  },
});

export default ChatListScreen;
