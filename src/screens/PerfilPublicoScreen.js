// YouConnext - PerfilPublicoScreen (perfil público de otro usuario)
import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Image,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  MapPin,
  Calendar,
  Car,
  Star,
  Users,
  MessageSquare,
  Fuel,
  MessageCircle,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../constants";
import { usuarioService } from "../services/usuarioService";
import { comentarioService } from "../services/travels/comentarioService";
import userCache from "../services/messages/userCache";
import { useUser } from "../context/UserContext";

const GENDER_LABELS = {
  M: "Masculino",
  F: "Femenino",
  O: "Otro",
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatRating = (rating) => {
  if (!rating || rating === 0) return "Sin valoraciones";
  return `${Number(rating).toFixed(1)} / 5`;
};

const PerfilPublicoScreen = ({ route, navigation }) => {
  const { userId } = route.params || {};
  const { user: currentUser } = useUser();
  const [profile, setProfile] = useState(null);
  const [opinions, setOpinions] = useState([]);
  const [commentatorInfo, setCommentatorInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const isOwnProfile =
    currentUser?.id && userId && String(currentUser.id) === String(userId);

  const handleStartChat = () => {
    navigation.navigate("DirectChat", { peerId: userId });
  };

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    setError(null);
    try {
      const [res, opinionsRes] = await Promise.all([
        usuarioService.getUserPublicProfile(userId),
        comentarioService.obtenerOpinionesPorValorado(userId),
      ]);
      const data = res?.user || res?.data?.user || null;
      setProfile(data);

      const opinionList =
        opinionsRes?.opinionList || opinionsRes?.data?.opinionList || [];
      setOpinions(opinionList);

      const commentatorIds = [
        ...new Set(
          opinionList.map((o) => String(o.user_id_commentator)).filter(Boolean),
        ),
      ];
      if (commentatorIds.length > 0) {
        const users = await userCache.resolveMany(commentatorIds);
        const infoMap = {};
        for (const u of users) {
          if (u?.id) {
            infoMap[String(u.id)] = {
              name: u.name || "Usuario",
              img_perfil: u.img_perfil || null,
            };
          }
        }
        setCommentatorInfo(infoMap);
      }
    } catch (err) {
      setError(err.message || "No se pudo cargar el perfil");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  // Fetch on mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
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
          <Text style={styles.headerTitle}>Perfil</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !profile) {
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
          <Text style={styles.headerTitle}>Perfil</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>
            {error || "No se encontró el perfil"}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const stats = profile.stats || {};
  const cars = profile.cars || [];

  const getCommentatorName = (commentatorId) => {
    if (!commentatorId) return "Usuario";
    return commentatorInfo[String(commentatorId)]?.name || "Usuario";
  };

  const getCommentatorAvatar = (commentatorId) => {
    if (!commentatorId) return null;
    return commentatorInfo[String(commentatorId)]?.img_perfil || null;
  };

  const ratingToStars = (rating) => {
    const scaled = Math.round((rating || 0) / 2);
    return Math.max(0, Math.min(5, scaled));
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
        <Text style={styles.headerTitle}>Perfil</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Hero: avatar + nombre */}
        <View style={styles.heroCard}>
          <View style={styles.avatarContainer}>
            {profile.img_perfil ? (
              <Image
                source={{ uri: profile.img_perfil }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>
                  {profile.name?.charAt(0)?.toUpperCase() || "?"}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.profileName}>{profile.name || "Usuario"}</Text>
          {profile.about_me ? (
            <Text style={styles.profileBio}>{profile.about_me}</Text>
          ) : null}

          {!isOwnProfile && (
            <TouchableOpacity
              style={styles.chatButton}
              onPress={handleStartChat}
              activeOpacity={0.8}
            >
              <MessageCircle size={18} color={COLORS.white} strokeWidth={2.5} />
              <Text style={styles.chatButtonText}>Enviar mensaje</Text>
            </TouchableOpacity>
          )}

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Star size={18} color={COLORS.warning} strokeWidth={2.5} />
              <Text style={styles.statValue}>
                {formatRating(stats.avg_rating)}
              </Text>
              <Text style={styles.statLabel}>Valoración</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MessageSquare
                size={18}
                color={COLORS.secondary}
                strokeWidth={2.5}
              />
              <Text style={styles.statValue}>{stats.total_comments ?? 0}</Text>
              <Text style={styles.statLabel}>Comentarios</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Users size={18} color={COLORS.primary} strokeWidth={2.5} />
              <Text style={styles.statValue}>{stats.events_joined ?? 0}</Text>
              <Text style={styles.statLabel}>Eventos</Text>
            </View>
          </View>
        </View>

        {/* Info personal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información</Text>
          <View style={styles.infoCard}>
            {profile.fecha_nacimiento ? (
              <View style={styles.infoRow}>
                <Calendar size={18} color={COLORS.gray400} strokeWidth={2} />
                <Text style={styles.infoText}>
                  {formatDate(profile.fecha_nacimiento)}
                </Text>
              </View>
            ) : null}
            {profile.genero ? (
              <View style={styles.infoRow}>
                <Users size={18} color={COLORS.gray400} strokeWidth={2} />
                <Text style={styles.infoText}>
                  {GENDER_LABELS[profile.genero] || profile.genero}
                </Text>
              </View>
            ) : null}
            {profile.ciudad ? (
              <View style={styles.infoRow}>
                <MapPin size={18} color={COLORS.gray400} strokeWidth={2} />
                <Text style={styles.infoText}>
                  {profile.ciudad}
                  {profile.provincia ? `, ${profile.provincia}` : ""}
                  {profile.pais ? `, ${profile.pais}` : ""}
                </Text>
              </View>
            ) : null}
            {profile.created_at ? (
              <View style={styles.infoRow}>
                <Calendar size={18} color={COLORS.gray400} strokeWidth={2} />
                <Text style={styles.infoText}>
                  Miembro desde {formatDate(profile.created_at)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Coches */}
        {cars.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vehículos</Text>
            {cars.map((car, index) => (
              <View key={car.id_coche || index} style={styles.carCard}>
                <View style={styles.carIcon}>
                  <Car size={22} color={COLORS.primary} strokeWidth={2.5} />
                </View>
                <View style={styles.carInfo}>
                  <Text style={styles.carName}>
                    {car.marca} {car.modelo}
                  </Text>
                  <View style={styles.carTags}>
                    {car.color ? (
                      <View style={styles.carTag}>
                        <Text style={styles.carTagText}>{car.color}</Text>
                      </View>
                    ) : null}
                    {car.year ? (
                      <View style={styles.carTag}>
                        <Text style={styles.carTagText}>{car.year}</Text>
                      </View>
                    ) : null}
                    {car.tipo_combustible ? (
                      <View style={styles.carTag}>
                        <Fuel
                          size={11}
                          color={COLORS.gray500}
                          strokeWidth={2}
                        />
                        <Text style={styles.carTagText}>
                          {car.tipo_combustible}
                        </Text>
                      </View>
                    ) : null}
                    {car.num_plazas ? (
                      <View style={styles.carTag}>
                        <Users
                          size={11}
                          color={COLORS.gray500}
                          strokeWidth={2}
                        />
                        <Text style={styles.carTagText}>
                          {car.num_plazas} plazas
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Opiniones recibidas */}
        {opinions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Opiniones ({opinions.length})
            </Text>
            {opinions.map((opinion, index) => {
              const commentatorId = opinion.user_id_commentator;
              const name = getCommentatorName(commentatorId);
              const avatar = getCommentatorAvatar(commentatorId);
              const filledStars = ratingToStars(opinion.rating);
              return (
                <View
                  key={opinion.id_comment || index}
                  style={styles.commentCard}
                >
                  <View style={styles.commentHeader}>
                    <View style={styles.commentatorRow}>
                      {avatar ? (
                        <Image
                          source={{ uri: avatar }}
                          style={styles.commentatorAvatar}
                        />
                      ) : (
                        <View style={styles.commentatorAvatarFallback}>
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
                          color={
                            star <= filledStars
                              ? COLORS.warning
                              : COLORS.gray200
                          }
                          strokeWidth={2}
                          fill={star <= filledStars ? COLORS.warning : "none"}
                        />
                      ))}
                    </View>
                  </View>
                  {opinion.opinion ? (
                    <Text style={styles.commentText}>{opinion.opinion}</Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
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
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
  },
  loadingText: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
    marginTop: SPACING.sm,
  },
  errorText: {
    fontSize: FONTS.md,
    color: COLORS.gray500,
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: FONTS.sm,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  // Hero card
  heroCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: "center",
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  avatarContainer: {
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarFallback: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: {
    fontSize: FONTS.xxxl,
    fontWeight: "bold",
    color: COLORS.white,
  },
  profileName: {
    fontSize: FONTS.xl,
    fontWeight: "bold",
    color: COLORS.gray800,
    marginBottom: SPACING.xs,
  },
  profileBio: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  chatButtonText: {
    fontSize: FONTS.sm,
    fontWeight: "600",
    color: COLORS.white,
  },
  // Stats
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  statItem: {
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontSize: FONTS.md,
    fontWeight: "bold",
    color: COLORS.gray800,
  },
  statLabel: {
    fontSize: FONTS.xs,
    color: COLORS.gray400,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.gray200,
  },
  // Sections
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.md,
    fontWeight: "bold",
    color: COLORS.gray700,
    marginBottom: SPACING.sm,
  },
  // Info card
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
    ...SHADOWS.small,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  infoText: {
    fontSize: FONTS.sm,
    color: COLORS.gray700,
  },
  // Cars
  carCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  carIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  carInfo: {
    flex: 1,
  },
  carName: {
    fontSize: FONTS.md,
    fontWeight: "600",
    color: COLORS.gray800,
    marginBottom: 4,
  },
  carTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  carTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  carTagText: {
    fontSize: 11,
    color: COLORS.gray600,
  },
  // Comments
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
    backgroundColor: COLORS.primary,
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

export default PerfilPublicoScreen;
