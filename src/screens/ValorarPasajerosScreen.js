// YouConnext - ValorarPasajerosScreen (Conductor valora pasajeros tras finalizar)
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Star,
  CheckCircle2,
  User,
  Send,
} from "lucide-react-native";
import { useUser } from "../context/UserContext";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../constants";
import { reservaService } from "../services/travels/reservaService";
import { comentarioService } from "../services/travels/comentarioService";

const ValorarPasajerosScreen = ({ route, navigation }) => {
  const { user } = useUser();
  const viaje = route.params?.viaje;
  const trayectoId = viaje?.id || viaje?.id_trayecto;

  const [pasajeros, setPasajeros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ratings, setRatings] = useState({});
  const [comentarios, setComentarios] = useState({});
  const [enviados, setEnviados] = useState({});

  const cargarPasajeros = useCallback(async () => {
    if (!trayectoId) return;
    setLoading(true);
    try {
      const res = await reservaService.obtenerReservasPorTrayecto(trayectoId);
      console.log(
        "[ValorarPasajeros] reservas response:",
        JSON.stringify(res, null, 2),
      );
      const reservasList =
        res.pasajerosList ||
        res.reservas ||
        res.data ||
        (Array.isArray(res) ? res : []);
      const reservasValidas = Array.isArray(reservasList)
        ? reservasList.filter((r) => r.user_id || r.userId)
        : [];

      if (reservasValidas.length === 0) {
        setPasajeros([]);
        return;
      }

      const pasajerosData = reservasValidas.map((r) => {
        const uid = r.user_id || r.userId;
        return {
          id: uid,
          reservaId: r.id_reserva || r.id,
          name: r.nombre || "Pasajero",
          surname: "",
          img_perfil: r.img_perfil || null,
          fullName: r.nombre || "Pasajero",
        };
      });

      setPasajeros(pasajerosData);
    } catch (err) {
      console.warn("Error al cargar reservas:", err.message);
      setPasajeros([]);
    } finally {
      setLoading(false);
    }
  }, [trayectoId]);

  useEffect(() => {
    cargarPasajeros();
  }, [cargarPasajeros]);

  const getInitial = (p) => (p.name || "?").charAt(0).toUpperCase();

  const handleRating = (pasajeroId, stars) => {
    setRatings((prev) => ({ ...prev, [pasajeroId]: stars }));
  };

  const handleComentario = (pasajeroId, text) => {
    setComentarios((prev) => ({ ...prev, [pasajeroId]: text }));
  };

  const handleEnviarUno = async (pasajero) => {
    const stars = ratings[pasajero.id];
    if (!stars) {
      Alert.alert(
        "Selecciona una valoración",
        "Selecciona de 1 a 5 estrellas para valorar a este pasajero.",
      );
      return;
    }

    const rating10 = stars * 2;
    const opinionText = (comentarios[pasajero.id] || "").trim();
    if (!opinionText) {
      Alert.alert(
        "Escribe un comentario",
        "Añade un comentario sobre el pasajero.",
      );
      return;
    }

    setSubmitting(true);
    try {
      await comentarioService.crearOpinion({
        user_id_commentator: user.id,
        user_id_trayect: pasajero.id,
        trayecto_id: trayectoId,
        opinion: opinionText,
        rating: rating10,
      });
      setEnviados((prev) => ({ ...prev, [pasajero.id]: true }));
    } catch (err) {
      const msg = err?.message || "No se pudo enviar la opinión.";
      if (msg.includes("duplicada") || msg.includes("400")) {
        setEnviados((prev) => ({ ...prev, [pasajero.id]: true }));
      } else {
        Alert.alert("Error", msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnviarTodas = async () => {
    const pendientes = pasajeros.filter((p) => !enviados[p.id]);
    if (pendientes.length === 0) {
      Alert.alert("Todo listo", "Has valorado a todos los pasajeros.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
      return;
    }

    const sinValorar = pendientes.filter((p) => !ratings[p.id]);
    if (sinValorar.length > 0) {
      Alert.alert(
        "Faltan valoraciones",
        `Te faltan ${sinValorar.length} pasajero(s) por valorar.`,
      );
      return;
    }

    setSubmitting(true);
    let exito = 0;
    let errores = 0;
    for (const p of pendientes) {
      const stars = ratings[p.id];
      const rating10 = stars * 2;
      const opinionText = (comentarios[p.id] || "").trim();
      if (!opinionText) {
        errores++;
        continue;
      }
      try {
        await comentarioService.crearOpinion({
          user_id_commentator: user.id,
          user_id_trayect: p.id,
          trayecto_id: trayectoId,
          opinion: opinionText,
          rating: rating10,
        });
        setEnviados((prev) => ({ ...prev, [p.id]: true }));
        exito++;
      } catch (err) {
        const msg = err?.message || "";
        if (msg.includes("duplicada") || msg.includes("400")) {
          setEnviados((prev) => ({ ...prev, [p.id]: true }));
          exito++;
        } else {
          errores++;
        }
      }
    }
    setSubmitting(false);

    if (errores === 0) {
      Alert.alert(
        "¡Gracias!",
        "Has valorado a todos los pasajeros correctamente.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } else {
      Alert.alert(
        "Valoraciones enviadas",
        `${exito} opinión(es) enviadas. ${errores} fallaron (posible comentario vacío).`,
      );
    }
  };

  const todosEnviados =
    pasajeros.length > 0 && pasajeros.every((p) => enviados[p.id]);
  const valoradosCount = pasajeros.filter((p) => ratings[p.id]).length;

  const renderStars = (pasajeroId) => {
    const current = ratings[pasajeroId] || 0;
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity
            key={n}
            onPress={() => handleRating(pasajeroId, n)}
            activeOpacity={0.7}
          >
            <Star
              size={32}
              color={n <= current ? COLORS.warning : COLORS.gray200}
              fill={n <= current ? COLORS.warning : "none"}
              strokeWidth={2}
            />
          </TouchableOpacity>
        ))}
        {current > 0 && (
          <Text style={styles.ratingNumber}>{current * 2}/10</Text>
        )}
      </View>
    );
  };

  const renderPasajero = (pasajero) => {
    const yaEnviado = enviados[pasajero.id];

    return (
      <View key={pasajero.id} style={styles.pasajeroCard}>
        <View style={styles.pasajeroHeader}>
          {pasajero.img_perfil ? (
            <Image
              source={{ uri: pasajero.img_perfil }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{getInitial(pasajero)}</Text>
            </View>
          )}
          <View style={styles.pasajeroInfo}>
            <Text style={styles.pasajeroName} numberOfLines={1}>
              {pasajero.fullName}
            </Text>
            {yaEnviado ? (
              <View style={styles.enviadoBadge}>
                <CheckCircle2
                  size={14}
                  color={COLORS.success}
                  strokeWidth={2.5}
                />
                <Text style={styles.enviadoText}>Valorado</Text>
              </View>
            ) : (
              <Text style={styles.pasajeroSubtext}>Pendiente de valorar</Text>
            )}
          </View>
        </View>

        {!yaEnviado && (
          <>
            {renderStars(pasajero.id)}

            <TextInput
              style={styles.comentarioInput}
              value={comentarios[pasajero.id] || ""}
              onChangeText={(text) => handleComentario(pasajero.id, text)}
              placeholder="Escribe tu comentario sobre el pasajero..."
              placeholderTextColor={COLORS.gray400}
              multiline
              maxLength={1024}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={styles.enviarButton}
              onPress={() => handleEnviarUno(pasajero)}
              disabled={submitting}
              activeOpacity={0.8}
            >
              <Send size={16} color={COLORS.white} strokeWidth={2.5} />
              <Text style={styles.enviarButtonText}>Enviar valoración</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color={COLORS.gray800} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Valorar pasajeros</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando pasajeros...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (pasajeros.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color={COLORS.gray800} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Valorar pasajeros</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <User size={48} color={COLORS.gray300} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>No hay pasajeros</Text>
          <Text style={styles.emptyText}>
            Este trayecto no tuvo pasajeros reservados.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.emptyButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={COLORS.gray800} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Valorar pasajeros</Text>
          <Text style={styles.headerSubtitle}>
            {valoradosCount} de {pasajeros.length} valorados
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introCard}>
          <Star
            size={24}
            color={COLORS.warning}
            fill={COLORS.warning}
            strokeWidth={2}
          />
          <Text style={styles.introText}>
            Valora a tus pasajeros para ayudar a construir una comunidad de
            confianza. Tu opinión es anónima para otros pasajeros.
          </Text>
        </View>

        {pasajeros.map(renderPasajero)}
      </ScrollView>

      {!todosEnviados && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.footerButton}
            onPress={handleEnviarTodas}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <CheckCircle2
                  size={20}
                  color={COLORS.white}
                  strokeWidth={2.5}
                />
                <Text style={styles.footerButtonText}>
                  Enviar todas (
                  {pasajeros.length - Object.keys(enviados).length} pendientes)
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {todosEnviados && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.footerButton, styles.footerButtonSuccess]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <CheckCircle2 size={20} color={COLORS.white} strokeWidth={2.5} />
            <Text style={styles.footerButtonText}>¡Listo! Volver</Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: FONTS.md,
    fontWeight: "bold",
    color: COLORS.gray800,
  },
  headerSubtitle: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
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
  },
  emptyButton: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: FONTS.sm,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: 100,
  },
  introCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
    backgroundColor: COLORS.warningSoft,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  introText: {
    flex: 1,
    fontSize: FONTS.sm,
    color: COLORS.gray700,
    lineHeight: 20,
  },
  pasajeroCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  pasajeroHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    color: COLORS.white,
    fontSize: FONTS.lg,
    fontWeight: "bold",
  },
  pasajeroInfo: {
    flex: 1,
  },
  pasajeroName: {
    fontSize: FONTS.md,
    fontWeight: "600",
    color: COLORS.gray800,
  },
  pasajeroSubtext: {
    fontSize: FONTS.xs,
    color: COLORS.gray400,
    marginTop: 2,
  },
  enviadoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  enviadoText: {
    fontSize: FONTS.xs,
    color: COLORS.success,
    fontWeight: "600",
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  ratingNumber: {
    fontSize: FONTS.sm,
    fontWeight: "600",
    color: COLORS.warning,
    marginLeft: SPACING.xs,
  },
  comentarioInput: {
    backgroundColor: COLORS.gray50,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONTS.sm,
    color: COLORS.gray800,
    minHeight: 80,
    marginBottom: SPACING.md,
  },
  enviarButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
  },
  enviarButtonText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: FONTS.sm,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  footerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
  },
  footerButtonSuccess: {
    backgroundColor: COLORS.success,
  },
  footerButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: FONTS.md,
  },
});

export default ValorarPasajerosScreen;
