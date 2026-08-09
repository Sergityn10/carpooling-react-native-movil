// YouConnext - OpinionesScreen (comentarios recibidos y hechos por mí)
import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Image,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Star } from "lucide-react-native";
import { useUser } from "../context/UserContext";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../constants";
import { comentarioService } from "../services/travels/comentarioService";
import userCache from "../services/messages/userCache";

const TABS = [
  { key: "received", label: "Recibidas" },
  { key: "made", label: "Hechas por mí" },
];

const ratingToStars = (rating) => {
  const scaled = Math.round((rating || 0) / 2);
  return Math.max(0, Math.min(5, scaled));
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

const OpinionesScreen = ({ route, navigation }) => {
  const { user } = useUser();
  const routeUserId = route.params?.userId;
  const isOwnProfile = !routeUserId || routeUserId === user?.id;
  const userId = routeUserId || user?.id;

  const [activeTab, setActiveTab] = useState("received");
  const [opinions, setOpinions] = useState([]);
  const [userInfo, setUserInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchOpinions = useCallback(
    async (tab, pageNum = 1, append = false) => {
      if (!userId) return;
      try {
        if (append) setLoadingMore(true);
        const res =
          tab === "received"
            ? await comentarioService.obtenerOpinionesPorValorado(userId, {
                page: pageNum,
                limit: 10,
              })
            : await comentarioService.obtenerOpinionesPorComentarista(userId, {
                page: pageNum,
                limit: 10,
                includeComments: true,
              });

        const list =
          res?.opinionList ||
          res?.data?.opinionList ||
          res?.data?.comments ||
          res?.comments ||
          (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
        const pagination = res?.pagination || res?.data?.pagination;
        setOpinions((prev) => (append ? [...prev, ...list] : list));
        setHasMore(!!pagination?.hasNext);
        setPage(pageNum);

        const otherIds = [
          ...new Set(
            list
              .map((o) =>
                String(
                  tab === "received"
                    ? o.user_id_commentator
                    : o.user_id_trayect,
                ),
              )
              .filter(Boolean),
          ),
        ];
        if (otherIds.length > 0) {
          const users = await userCache.resolveMany(otherIds);
          const infoMap = {};
          for (const u of users) {
            if (u?.id) {
              infoMap[String(u.id)] = {
                name: u.name || "Usuario",
                img_perfil: u.img_perfil || null,
              };
            }
          }
          setUserInfo((prev) => (append ? { ...prev, ...infoMap } : infoMap));
        } else if (!append) {
          setUserInfo({});
        }
      } catch (err) {
        console.warn("[Opiniones] Error:", err.message);
        if (!append) setOpinions([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    setLoading(true);
    setOpinions([]);
    setUserInfo({});
    setPage(1);
    setHasMore(false);
    fetchOpinions(activeTab, 1);
  }, [activeTab, fetchOpinions]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(false);
    await fetchOpinions(activeTab, 1);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      fetchOpinions(activeTab, page + 1, true);
    }
  };

  const getOtherName = (opinion) => {
    const otherId =
      activeTab === "received"
        ? opinion.user_id_commentator
        : opinion.user_id_trayect;
    return userInfo[String(otherId)]?.name || "Usuario";
  };

  const getOtherAvatar = (opinion) => {
    const otherId =
      activeTab === "received"
        ? opinion.user_id_commentator
        : opinion.user_id_trayect;
    return userInfo[String(otherId)]?.img_perfil || null;
  };

  const renderOpinion = ({ item, index }) => {
    const name = getOtherName(item);
    const avatar = getOtherAvatar(item);
    const otherId =
      activeTab === "received"
        ? item.user_id_commentator
        : item.user_id_trayect;
    const filledStars = ratingToStars(item.rating);
    const avatarColor = getAvatarColor(String(otherId));

    return (
      <View style={styles.commentCard}>
        <View style={styles.commentHeader}>
          <View style={styles.commentatorRow}>
            {avatar ? (
              <Image
                source={{ uri: avatar }}
                style={styles.commentatorAvatar}
              />
            ) : (
              <View
                style={[
                  styles.commentatorAvatarFallback,
                  { backgroundColor: avatarColor },
                ]}
              >
                <Text style={styles.commentatorAvatarText}>
                  {name?.charAt(0)?.toUpperCase() || "?"}
                </Text>
              </View>
            )}
            <Text style={styles.commentatorName} numberOfLines={1}>
              {name}
            </Text>
          </View>
          <View style={styles.commentStars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={12}
                color={star <= filledStars ? COLORS.warning : COLORS.gray200}
                strokeWidth={2}
                fill={star <= filledStars ? COLORS.warning : "none"}
              />
            ))}
          </View>
        </View>
        {item.opinion ? (
          <Text style={styles.commentText}>{item.opinion}</Text>
        ) : null}
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
          <ChevronLeft size={22} color={COLORS.gray700} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Opiniones</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs - solo si es mi perfil */}
      {isOwnProfile && (
        <View style={styles.tabsContainer}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : opinions.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>
            {isOwnProfile
              ? activeTab === "received"
                ? "Aún no has recibido opiniones"
                : "Aún no has escrito opiniones"
              : "Aún no tiene opiniones"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={opinions}
          keyExtractor={(item, index) => item.id_comment || `opinion_${index}`}
          renderItem={renderOpinion}
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: SPACING.md }}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
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
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: "center",
    backgroundColor: COLORS.gray100,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONTS.sm,
    fontWeight: "600",
    color: COLORS.gray500,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
  },
  emptyText: {
    fontSize: FONTS.md,
    color: COLORS.gray400,
    textAlign: "center",
  },
  listContent: {
    padding: SPACING.lg,
  },
  commentCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  commentatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    flex: 1,
    marginRight: SPACING.sm,
  },
  commentatorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  commentatorAvatarFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  commentatorAvatarText: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.white,
  },
  commentatorName: {
    fontSize: FONTS.sm,
    fontWeight: "600",
    color: COLORS.gray700,
    flex: 1,
  },
  commentStars: {
    flexDirection: "row",
    gap: 2,
  },
  commentText: {
    fontSize: FONTS.sm,
    color: COLORS.gray700,
    lineHeight: 20,
  },
});

export default OpinionesScreen;
