// YouConnext - Chat Detail Screen (messages + send via socket)
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Image,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { ChevronLeft, Send, Users, Ticket, Car } from "lucide-react-native";
import { useUser } from "../context/UserContext";
import { COLORS, SPACING, RADIUS, FONTS, BRAND } from "../constants";
import { messageService } from "../services/messages/messageService";
import socketService from "../services/messages/socketService";
import userCache from "../services/messages/userCache";
import eventChatCache, {
  getEventImageUri,
} from "../services/messages/eventChatCache";

const formatMessageTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateSeparator = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Hoy";
  if (date.toDateString() === yesterday.toDateString()) return "Ayer";
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
};

const getAvatarColor = (id) => {
  if (!id) return COLORS.primary;
  const colors = [
    "#4A90D9",
    "#E67E22",
    "#27AE60",
    "#8E44AD",
    "#E74C3C",
    "#16A085",
    "#F39C12",
    "#2C3E50",
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++)
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const ChatDetailScreen = ({ route, navigation }) => {
  const {
    chat,
    chatId,
    chatType: initialChatType,
    event: initialEvent,
  } = route.params || {};
  const { user } = useUser();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [resolvedUserId, setResolvedUserId] = useState("");
  const [senderNames, setSenderNames] = useState({});
  const [senderAvatars, setSenderAvatars] = useState({});
  const [resolvedChatName, setResolvedChatName] = useState("");
  const [otherUserAvatar, setOtherUserAvatar] = useState(null);
  const [eventData, setEventData] = useState(initialEvent || null);
  const [chatType, setChatType] = useState(
    initialChatType || (chat?.chat_type === "EVENT" ? "evento" : null),
  );
  const flatListRef = useRef(null);

  useEffect(() => {
    userCache.getMyUuid(user?.id).then((uuid) => {
      setResolvedUserId(uuid);
    });
  }, [user?.id]);

  // Cargar datos del evento si no venían en route.params
  useEffect(() => {
    if (initialEvent) {
      setEventData(initialEvent);
      setChatType("evento");
      return;
    }
    const tripId = chat?.trip_id;
    if (tripId) {
      const cached = eventChatCache.get(tripId);
      if (cached) {
        setEventData(cached);
        setChatType("evento");
      } else {
        eventChatCache.resolve(tripId).then((ev) => {
          if (ev) {
            setEventData(ev);
            setChatType("evento");
          }
        });
      }
    }
  }, [chat?.trip_id, initialEvent]);

  const actualChatId = chatId || chat?.chat_id || chat?.id;
  const isGroup = chat?.is_group === 1 || chat?.is_group === true;

  // Colección de todos los identificadores conocidos del usuario actual
  const myIdentifiers = React.useMemo(() => {
    const ids = new Set();
    if (resolvedUserId) ids.add(String(resolvedUserId).toLowerCase());
    if (user?.id) ids.add(String(user.id).toLowerCase());
    if (user?.userId) ids.add(String(user.userId).toLowerCase());
    if (user?.uuid) ids.add(String(user.uuid).toLowerCase());
    const syncUuid = userCache.getMyUuidSync(user?.id);
    if (syncUuid) ids.add(String(syncUuid).toLowerCase());
    return ids;
  }, [resolvedUserId, user?.id, user?.userId, user?.uuid]);

  const isMineId = useCallback(
    (senderId, item = null) => {
      if (item?._isMine) return true;
      if (!senderId) return false;
      const s = String(senderId).toLowerCase();
      return myIdentifiers.has(s);
    },
    [myIdentifiers],
  );

  const currentUserId =
    resolvedUserId || userCache.getMyUuidSync(user?.id) || String(user?.id || "");

  const otherUserId = !isGroup
    ? isMineId(chat?.send_by)
      ? chat?.send_to
      : chat?.send_by || chat?.send_to
    : null;

  const isEventChat =
    chatType === "evento" || Boolean(eventData) || chat?.chat_type === "EVENT";
  const isTripChat = isGroup && !isEventChat;

  const chatName = isGroup
    ? eventData?.name || chat?.name || "Grupo"
    : resolvedChatName || otherUserId || "Chat";

  const eventImageUri = isEventChat
    ? getEventImageUri(eventData?.image || eventData?.flyer || eventData?.imagen)
    : null;

  const fetchMessages = useCallback(async () => {
    if (!actualChatId) return;
    try {
      const data = await messageService.obtenerMensajes(actualChatId, {
        limit: 50,
      });
      const msgs = Array.isArray(data) ? data : [];
      setMessages(msgs);

      const senderIds = [
        ...new Set(msgs.map((m) => String(m.sender_id)).filter(Boolean)),
      ];
      if (senderIds.length > 0) {
        const users = await userCache.resolveMany(senderIds);
        const namesMap = {};
        const avatarsMap = {};
        for (const u of users) {
          if (u?.id) {
            namesMap[String(u.id)] = u.name;
            if (u.img_perfil) avatarsMap[String(u.id)] = u.img_perfil;
          }
        }
        setSenderNames(namesMap);
        setSenderAvatars(avatarsMap);
      }
    } catch (err) {
      console.warn("[ChatDetail] Error al cargar mensajes:", err.message);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [actualChatId]);

  // Reset state and re-fetch every time screen is focused
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setMessages([]);
      setSenderNames({});
      setSenderAvatars({});
      setResolvedChatName("");
      setOtherUserAvatar(null);
      fetchMessages();

      return () => {
        socketService.offAll("chat_message");
      };
    }, [fetchMessages, actualChatId]),
  );

  useEffect(() => {
    if (currentUserId) {
      socketService.connect(currentUserId);
      socketService.setUserId(currentUserId);

      if (actualChatId) {
        socketService.joinGroup(actualChatId, 0);
      }
    }

    const handleMessage = (data) => {
      const msgChatId = data.chatId || actualChatId;
      if (msgChatId != actualChatId) return;

      setMessages((prev) => {
        const offsetId = data.serverOffset?.toString();
        const existsById =
          offsetId && prev.some((m) => m.id?.toString() === offsetId);
        if (existsById) return prev;

        // Reconciliar con mensaje temporal local pendiente
        const pendingIndex = prev.findIndex(
          (m) =>
            m.content === data.message &&
            (m._pending ||
              Math.abs(
                new Date(m.created_at).getTime() -
                  new Date(data.created_at).getTime(),
              ) < 10000),
        );

        const isMineServer = isMineId(data.send_by);

        if (pendingIndex !== -1) {
          const updated = [...prev];
          const prevMsg = updated[pendingIndex];
          updated[pendingIndex] = {
            ...prevMsg,
            id: data.serverOffset || prevMsg.id,
            sender_id: data.send_by || prevMsg.sender_id,
            created_at: data.created_at || prevMsg.created_at,
            _pending: false,
            _isMine: prevMsg._isMine || isMineServer,
          };
          return updated;
        }

        return [
          ...prev,
          {
            id: data.serverOffset,
            chat_id: msgChatId,
            sender_id: data.send_by,
            content: data.message,
            created_at: data.created_at,
            type: "TEXT",
            _isMine: isMineServer,
          },
        ];
      });
    };

    socketService.onMessage(handleMessage);

    return () => {
      socketService.off("chat_message", handleMessage);
    };
  }, [currentUserId, actualChatId, isMineId]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending) return;

    setSending(true);
    setInputText("");

    const tempId = `temp_${Date.now()}`;
    const myPrimaryId =
      currentUserId || userCache.getMyUuidSync(user?.id) || String(user?.id || "");

    const tempMessage = {
      id: tempId,
      chat_id: actualChatId,
      sender_id: myPrimaryId,
      content: text,
      created_at: new Date().toISOString(),
      type: "TEXT",
      _pending: true,
      _isMine: true,
    };

    setMessages((prev) => [...prev, tempMessage]);

    try {
      if (isGroup) {
        socketService.sendMessageToGroup(actualChatId, text, async (ack) => {
          if (ack?.status === "ok") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempId
                  ? {
                      ...m,
                      id: ack.serverOffset,
                      sender_id: myPrimaryId,
                      _pending: false,
                      _isMine: true,
                    }
                  : m,
              ),
            );
          } else {
            try {
              await messageService.enviarMensaje(actualChatId, {
                content: text,
              });
            } catch {}
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempId
                  ? {
                      ...m,
                      sender_id: myPrimaryId,
                      _pending: false,
                      _isMine: true,
                    }
                  : m,
              ),
            );
          }
        });
      } else {
        const recipientId = otherUserId;
        socketService.sendMessageToUser(recipientId, text, (ack) => {
          if (ack?.status === "ok") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempId
                  ? {
                      ...m,
                      id: ack.serverOffset,
                      sender_id: myPrimaryId,
                      _pending: false,
                      _isMine: true,
                    }
                  : m,
              ),
            );
          }
        });
      }
    } catch (err) {
      console.warn("Error al enviar mensaje:", err.message);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? { ...m, _pending: false, _failed: true, _isMine: true }
            : m,
        ),
      );
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!isGroup && otherUserId) {
      userCache.resolve(otherUserId).then((u) => {
        if (u?.name) setResolvedChatName(u.name);
        if (u?.img_perfil) setOtherUserAvatar(u.img_perfil);
      });
    }
  }, [isGroup, otherUserId]);

  const getSenderName = (senderId, item = null) => {
    if (isMineId(senderId, item)) return "Tú";
    if (!senderId) return "";
    return senderNames[String(senderId)] || "Usuario";
  };

  const getSenderAvatar = (senderId, item = null) => {
    if (isMineId(senderId, item)) return null;
    if (!senderId) return null;
    return senderAvatars[String(senderId)] || null;
  };

  const renderDateSeparator = (dateString) => (
    <View style={styles.dateSeparator}>
      <View style={styles.dateLine} />
      <Text style={styles.dateText}>{formatDateSeparator(dateString)}</Text>
      <View style={styles.dateLine} />
    </View>
  );

  const renderMessage = ({ item, index }) => {
    const isMine = isMineId(item.sender_id, item);
    const senderName = getSenderName(item.sender_id, item);
    const prevMsg = messages[index - 1];
    const showDateSep =
      !prevMsg ||
      new Date(prevMsg.created_at).toDateString() !==
        new Date(item.created_at).toDateString();
    const showSenderName =
      isGroup &&
      !isMine &&
      (!prevMsg || prevMsg.sender_id !== item.sender_id || showDateSep);
    const avatarColor = getAvatarColor(String(item.sender_id));

    return (
      <>
        {showDateSep && renderDateSeparator(item.created_at)}
        <View
          style={[
            styles.messageRow,
            isMine ? styles.messageRowMine : styles.messageRowOther,
          ]}
        >
          {!isMine &&
            (getSenderAvatar(item.sender_id, item) ? (
              <Image
                source={{ uri: getSenderAvatar(item.sender_id, item) }}
                style={styles.messageAvatar}
              />
            ) : (
              <View
                style={[styles.messageAvatar, { backgroundColor: avatarColor }]}
              >
                <Text style={styles.messageAvatarText}>
                  {senderName.charAt(0).toUpperCase()}
                </Text>
              </View>
            ))}
          <View
            style={[
              styles.messageBubble,
              isMine ? styles.bubbleMine : styles.bubbleOther,
              item._pending && styles.bubblePending,
            ]}
          >
            {showSenderName && (
              <Text style={[styles.senderName, { color: avatarColor }]}>
                {senderName}
              </Text>
            )}
            <Text
              style={[
                styles.messageText,
                isMine ? styles.messageTextMine : styles.messageTextOther,
              ]}
            >
              {item.content}
            </Text>
            <Text
              style={[
                styles.messageTime,
                isMine ? styles.messageTimeMine : styles.messageTimeOther,
              ]}
            >
              {item._pending
                ? "Enviando..."
                : formatMessageTime(item.created_at)}
            </Text>
          </View>
        </View>
      </>
    );
  };

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

        <TouchableOpacity
          style={styles.headerInfo}
          activeOpacity={isEventChat ? 0.7 : 1}
          disabled={!isEventChat || !(eventData?.id || chat?.trip_id)}
          onPress={() => {
            if (isEventChat && (eventData?.id || chat?.trip_id)) {
              navigation.navigate("EventDetalle", {
                eventId: eventData?.id || chat?.trip_id,
                event: eventData,
              });
            }
          }}
        >
          <View
            style={[
              styles.headerAvatar,
              isEventChat && styles.headerAvatarEvent,
            ]}
          >
            {isEventChat && eventImageUri ? (
              <Image
                source={{ uri: eventImageUri }}
                style={styles.headerAvatarImage}
                resizeMode="cover"
              />
            ) : isEventChat ? (
              <Ticket size={18} color={COLORS.white} strokeWidth={2.2} />
            ) : isGroup ? (
              <Users size={18} color={COLORS.white} strokeWidth={2.5} />
            ) : otherUserAvatar ? (
              <Image
                source={{ uri: otherUserAvatar }}
                style={styles.headerAvatarImage}
              />
            ) : (
              <Text style={styles.headerAvatarText}>
                {chatName.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerName} numberOfLines={1}>
              {chatName}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {isEventChat
                ? "Grupo de evento"
                : isTripChat
                ? "Viaje compartido"
                : "Chat directo"}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => item.id?.toString() || `msg_${index}`}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <View
          style={[
            styles.inputContainer,
            { paddingBottom: insets.bottom || SPACING.sm },
          ]}
        >
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={COLORS.gray400}
            multiline
            maxLength={1000}
            editable={!sending}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            activeOpacity={0.7}
          >
            <Send size={20} color={COLORS.white} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  headerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  headerTextCol: {
    flex: 1,
    justifyContent: "center",
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  headerAvatarEvent: {
    borderRadius: RADIUS.md,
    backgroundColor: BRAND.greenOnLight,
  },
  headerAvatarImage: {
    width: 38,
    height: 38,
  },
  headerAvatarText: {
    fontSize: FONTS.md,
    fontWeight: "bold",
    color: COLORS.white,
  },
  headerName: {
    fontSize: FONTS.sm + 1,
    fontWeight: "700",
    color: COLORS.gray800,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: "500",
    color: COLORS.gray400,
    marginTop: 1,
  },
  messagesList: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  dateSeparator: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: SPACING.md,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.gray200,
  },
  dateText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.gray400,
    marginHorizontal: SPACING.sm,
    textTransform: "capitalize",
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: SPACING.xs,
    gap: SPACING.xs,
  },
  messageRowMine: {
    justifyContent: "flex-end",
  },
  messageRowOther: {
    justifyContent: "flex-start",
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    overflow: "hidden",
  },
  messageAvatarText: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.white,
  },
  messageBubble: {
    maxWidth: "72%",
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
  },
  bubbleMine: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: RADIUS.xs,
  },
  bubbleOther: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: RADIUS.xs,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  bubblePending: {
    opacity: 0.6,
  },
  messageText: {
    fontSize: FONTS.sm,
    lineHeight: 20,
  },
  messageTextMine: {
    color: COLORS.white,
  },
  messageTextOther: {
    color: COLORS.gray800,
  },
  senderName: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 2,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 3,
  },
  messageTimeMine: {
    color: "rgba(255,255,255,0.7)",
    textAlign: "right",
  },
  messageTimeOther: {
    color: COLORS.gray400,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.gray50,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONTS.sm,
    color: COLORS.gray800,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.gray300,
  },
});

export default ChatDetailScreen;
