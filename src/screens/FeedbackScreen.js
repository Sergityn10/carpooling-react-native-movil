// YouConnextApp - src/screens/FeedbackScreen.js
// Pantalla de Feedback con Ciclo de Vida de 5 Fases, Consulta de Estados y Confirmación por el Usuario
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  RefreshControl,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ChevronLeft,
  PlusCircle,
  Inbox,
  Clock,
  Wrench,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Check,
  X,
  Sparkles,
  MessageSquare,
  Send,
  RefreshCw,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../constants";
import {
  DEFAULT_FEEDBACK_META,
  FEEDBACK_LIMITS,
  FEEDBACK_STATUS,
  FEEDBACK_STATUS_META,
} from "../constants/feedback";
import { feedbackService } from "../services/feedbackService";

const CACHE_KEY = "@youconnext_feedback_categories_cache";

// Formateador amigable de fechas
const formatDate = (isoString) => {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${mins}`;
  } catch {
    return "";
  }
};

export const FeedbackScreen = ({ navigation }) => {
  // Pestaña activa: 'create' (Nueva opinión) | 'mine' (Mis consultas)
  const [activeTab, setActiveTab] = useState("create");

  // Estados para Formulario de Creación
  const [meta, setMeta] = useState(DEFAULT_FEEDBACK_META);
  const [selectedCategory, setSelectedCategory] = useState(
    DEFAULT_FEEDBACK_META.categories[0].id,
  );
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Estados para Bandeja de Consultas Propias ("Mis consultas")
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [loadingMine, setLoadingMine] = useState(false);
  const [refreshingMine, setRefreshingMine] = useState(false);
  const [errorMine, setErrorMine] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});

  const toggleExpandCard = (id) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Estados para Modales de Acción de Verificación
  const [actionFeedback, setActionFeedback] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmComment, setConfirmComment] = useState("");
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Mapeo amigable de iconos textuales si el backend devuelve claves string
  const iconMap = {
    bug: "🐛",
    lightbulb: "💡",
    sparkles: "✨",
    gauge: "⚡",
    car: "🚗",
    building: "🏢",
    "message-square": "💬",
  };

  // 1. Carga de Categorías con Stale-While-Revalidate (0 ms con AsyncStorage)
  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached && isMounted) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed && Array.isArray(parsed.categories) && parsed.categories.length > 0) {
              setMeta(parsed);
              if (!selectedCategory || !parsed.categories.some((c) => c.id === selectedCategory)) {
                setSelectedCategory(parsed.categories[0].id);
              }
            }
          } catch {
            // noop
          }
        }

        const remoteMeta = await feedbackService.obtenerCategoriasFeedback();
        if (remoteMeta && isMounted) {
          const formattedMeta = {
            title: remoteMeta.title || DEFAULT_FEEDBACK_META.title,
            description: remoteMeta.description || DEFAULT_FEEDBACK_META.description,
            maxTitleLength: remoteMeta.maxTitleLength || FEEDBACK_LIMITS.MAX_TITLE_LENGTH,
            maxMessageLength: remoteMeta.maxMessageLength || FEEDBACK_LIMITS.MAX_MESSAGE_LENGTH,
            categories:
              Array.isArray(remoteMeta.categories) && remoteMeta.categories.length > 0
                ? remoteMeta.categories
                : DEFAULT_FEEDBACK_META.categories,
          };

          setMeta(formattedMeta);
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(formattedMeta));
        }
      } catch (err) {
        if (typeof __DEV__ !== "undefined" && __DEV__) {
          console.warn("Error cargando categorías de feedback:", err);
        }
      }
    }

    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Cargar Mis Feedbacks desde GET /api/feedback/mine
  const fetchMyFeedbacks = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshingMine(true);
      } else {
        setLoadingMine(true);
      }
      setErrorMine(null);

      const items = await feedbackService.obtenerMisFeedbacks();
      setMyFeedbacks(Array.isArray(items) ? items : []);
    } catch (err) {
      setErrorMine(
        err?.message || "No se pudieron cargar tus consultas en este momento.",
      );
    } finally {
      setLoadingMine(false);
      setRefreshingMine(false);
    }
  }, []);

  // Cargar consultas cuando se cambia a la pestaña 'mine'
  useEffect(() => {
    if (activeTab === "mine") {
      fetchMyFeedbacks();
    }
  }, [activeTab, fetchMyFeedbacks]);

  // Contador de feedbacks que requieren acción del usuario (pending_verification)
  const pendingActionsCount = useMemo(() => {
    return myFeedbacks.filter(
      (f) =>
        f.status === FEEDBACK_STATUS.PENDING_VERIFICATION ||
        f.requires_user_action === true,
    ).length;
  }, [myFeedbacks]);

  // Manejo de Envío de Nuevo Feedback
  const handleSubmitNew = async () => {
    const cleanTitle = title.trim();
    const cleanMessage = message.trim();
    const maxTitle = meta?.maxTitleLength || FEEDBACK_LIMITS.MAX_TITLE_LENGTH;
    const maxMessage = meta?.maxMessageLength || FEEDBACK_LIMITS.MAX_MESSAGE_LENGTH;

    if (!cleanTitle || cleanTitle.length < FEEDBACK_LIMITS.MIN_TITLE_LENGTH) {
      Alert.alert(
        "Título requerido",
        `Por favor, escribe un título de al menos ${FEEDBACK_LIMITS.MIN_TITLE_LENGTH} caracteres.`,
      );
      return;
    }

    if (cleanTitle.length > maxTitle) {
      Alert.alert(
        "Título muy largo",
        `El título no puede superar los ${maxTitle} caracteres.`,
      );
      return;
    }

    if (!selectedCategory) {
      Alert.alert(
        "Categoría requerida",
        "Por favor, selecciona una categoría para tu comentario.",
      );
      return;
    }

    if (
      !cleanMessage ||
      cleanMessage.length < FEEDBACK_LIMITS.MIN_MESSAGE_LENGTH
    ) {
      Alert.alert(
        "Mensaje requerido",
        `Por favor, describe tu feedback con al menos ${FEEDBACK_LIMITS.MIN_MESSAGE_LENGTH} caracteres.`,
      );
      return;
    }

    if (cleanMessage.length > maxMessage) {
      Alert.alert(
        "Mensaje muy largo",
        `El mensaje no puede exceder los ${maxMessage} caracteres.`,
      );
      return;
    }

    setSubmitting(true);
    try {
      await feedbackService.enviarFeedback({
        title: cleanTitle,
        category: selectedCategory,
        message: cleanMessage,
      });

      // Limpiar campos
      setTitle("");
      setMessage("");

      Alert.alert(
        "¡Gracias por tu aporte! 🎉",
        "Hemos recibido tu feedback. El equipo lo revisará en breve y podrás seguir su estado desde 'Mis consultas'.",
        [
          {
            text: "Ver mis consultas",
            onPress: () => {
              setActiveTab("mine");
              fetchMyFeedbacks();
            },
          },
          {
            text: "Enviar otro",
            style: "cancel",
          },
        ],
      );
    } catch (error) {
      if (
        error.message?.includes("FEEDBACK_RATE_LIMIT") ||
        error.status === 429
      ) {
        Alert.alert(
          "Límite temporal alcanzado",
          "Has enviado varios comentarios recientemente. Por favor, espera unos 15 minutos antes de enviar uno nuevo.",
        );
      } else {
        Alert.alert(
          "Error al enviar",
          error.message ||
            "No pudimos enviar tu feedback. Por favor, revisa tu conexión e inténtalo de nuevo.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Abrir Modal de Confirmación ("Sí, está resuelto")
  const handleOpenConfirm = (item) => {
    setActionFeedback(item);
    setConfirmComment("");
    setShowConfirmModal(true);
  };

  // Ejecutar Confirmación de Resolución -> POST /api/feedback/:id/confirm-resolution
  const handleExecuteConfirm = async () => {
    if (!actionFeedback?.id) return;
    setActionSubmitting(true);
    try {
      await feedbackService.confirmarResolucionFeedback(
        actionFeedback.id,
        confirmComment,
      );

      // Actualizar lista local de inmediato para feedback instantáneo
      setMyFeedbacks((prev) =>
        prev.map((f) =>
          f.id === actionFeedback.id
            ? {
                ...f,
                status: FEEDBACK_STATUS.RESOLVED,
                resolved_at: new Date().toISOString(),
                user_resolution_comment: confirmComment || null,
              }
            : f,
        ),
      );

      setShowConfirmModal(false);
      setActionFeedback(null);
      Alert.alert(
        "¡Problema resuelto! 🚀",
        "Muchas gracias por verificarlo y confirmarlo. Cerramos la consulta con éxito.",
      );
    } catch (err) {
      Alert.alert(
        "Error al confirmar",
        err?.message || "No se pudo confirmar la resolución. Inténtalo de nuevo.",
      );
    } finally {
      setActionSubmitting(false);
    }
  };

  // Abrir Modal de Rechazo ("Aún sigue fallando")
  const handleOpenReject = (item) => {
    setActionFeedback(item);
    setRejectReason("");
    setShowRejectModal(true);
  };

  // Ejecutar Rechazo de Resolución -> POST /api/feedback/:id/reject-resolution
  const handleExecuteReject = async () => {
    if (!actionFeedback?.id) return;
    const cleanReason = rejectReason.trim();

    if (cleanReason.length < 5) {
      Alert.alert(
        "Explicación requerida",
        "Por favor, detalla qué sigue fallando con al menos 5 caracteres para que el equipo técnico pueda solucionarlo.",
      );
      return;
    }

    setActionSubmitting(true);
    try {
      await feedbackService.rechazarResolucionFeedback(
        actionFeedback.id,
        cleanReason,
      );

      // Actualizar lista local devolviéndolo a in_progress
      setMyFeedbacks((prev) =>
        prev.map((f) =>
          f.id === actionFeedback.id
            ? {
                ...f,
                status: FEEDBACK_STATUS.IN_PROGRESS,
                user_resolution_comment: cleanReason,
              }
            : f,
        ),
      );

      setShowRejectModal(false);
      setActionFeedback(null);
      Alert.alert(
        "Reporte actualizado",
        "Hemos devuelto tu consulta al equipo técnico indicando los detalles proporcionados.",
      );
    } catch (err) {
      Alert.alert(
        "Error al actualizar",
        err?.message || "No se pudo actualizar el estado. Inténtalo de nuevo.",
      );
    } finally {
      setActionSubmitting(false);
    }
  };

  // Renderizador del Badge de Estado según el Ciclo de Vida (Robusto ante textos largos)
  const renderStatusBadge = (status) => {
    const statusMeta =
      FEEDBACK_STATUS_META[status] || FEEDBACK_STATUS_META.submitted;

    const renderStatusIcon = () => {
      switch (status) {
        case FEEDBACK_STATUS.SUBMITTED:
          return <Clock size={11} color={statusMeta.color} strokeWidth={2.4} />;
        case FEEDBACK_STATUS.RECEIVED:
          return <Inbox size={11} color={statusMeta.color} strokeWidth={2.4} />;
        case FEEDBACK_STATUS.IN_PROGRESS:
          return <Wrench size={11} color={statusMeta.color} strokeWidth={2.4} />;
        case FEEDBACK_STATUS.PENDING_VERIFICATION:
          return <Sparkles size={11} color={statusMeta.color} strokeWidth={2.4} />;
        case FEEDBACK_STATUS.RESOLVED:
          return <CheckCircle2 size={11} color={statusMeta.color} strokeWidth={2.5} />;
        case FEEDBACK_STATUS.DISCARDED:
        default:
          return <XCircle size={11} color={statusMeta.color} strokeWidth={2.4} />;
      }
    };

    return (
      <View
        style={[
          styles.statusBadge,
          {
            backgroundColor: statusMeta.bgColor,
            borderColor: statusMeta.borderColor,
          },
        ]}
      >
        {renderStatusIcon()}
        <Text
          style={[styles.statusBadgeText, { color: statusMeta.color }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {statusMeta.label}
        </Text>
      </View>
    );
  };

  // Renderizador de cada tarjeta de feedback en "Mis consultas"
  const renderFeedbackItem = ({ item }) => {
    const isPendingVerification =
      item.status === FEEDBACK_STATUS.PENDING_VERIFICATION ||
      item.requires_user_action === true;
    const isResolved = item.status === FEEDBACK_STATUS.RESOLVED;

    const categoryObj = meta.categories.find((c) => c.id === item.category);
    const categoryIcon = categoryObj
      ? iconMap[categoryObj.icon] || categoryObj.icon || "📌"
      : "📌";
    const categoryLabel = categoryObj?.label || item.category || "General";

    const isExpanded = Boolean(expandedCards[item.id]);
    const messageLines = (item.message || "").split(/\r\n|\r|\n/).length;
    const isLongMessage = (item.message || "").length > 130 || messageLines > 3;

    return (
      <View
        style={[
          styles.feedbackCard,
          isPendingVerification && styles.cardPendingVerification,
          isResolved && styles.cardResolved,
        ]}
      >
        {/* Cabecera de la tarjeta: Categoría (con flexShrink) y Badge de Estado (fijo y auto-ajustable) */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillIcon}>{categoryIcon}</Text>
            <Text
              style={styles.categoryPillLabel}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {categoryLabel}
            </Text>
          </View>
          {renderStatusBadge(item.status)}
        </View>

        {/* Título */}
        {item.title ? (
          <Text style={styles.cardTitle}>{item.title}</Text>
        ) : null}

        {/* Fecha con icono */}
        <View style={styles.cardDateRow}>
          <Clock size={11} color={COLORS.gray400} strokeWidth={2} />
          <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
        </View>

        {/* Mensaje original con soporte expandible si es muy largo */}
        <Text
          style={styles.cardMessage}
          numberOfLines={isExpanded ? undefined : 3}
          ellipsizeMode="tail"
        >
          {item.message}
        </Text>

        {isLongMessage && (
          <TouchableOpacity
            onPress={() => toggleExpandCard(item.id)}
            hitSlop={8}
            style={styles.expandTextBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.expandTextBtnText}>
              {isExpanded ? "Mostrar menos ↑" : "Leer mensaje completo ↓"}
            </Text>
          </TouchableOpacity>
        )}

        {/* Nota del Administrador / Equipo técnico si existe */}
        {item.admin_notes ? (
          <View style={styles.adminNotesBox}>
            <View style={styles.adminNotesHeader}>
              <MessageSquare size={13} color={COLORS.primaryDark} strokeWidth={2.4} />
              <Text style={styles.adminNotesTitle}>Respuesta de YouConnext</Text>
            </View>
            <Text style={styles.adminNotesContent}>{item.admin_notes}</Text>
          </View>
        ) : null}

        {/* TARJETA DE ACCIÓN REQUERIDA: Cambio realizado, pendiente de que el usuario lo pruebe */}
        {isPendingVerification && (
          <View style={styles.actionPromptCard}>
            <View style={styles.actionPromptTop}>
              <Sparkles size={16} color="#B45309" strokeWidth={2.4} />
              <Text style={styles.actionPromptTitle}>
                ¡Cambio técnico desplegado!
              </Text>
            </View>
            <Text style={styles.actionPromptSubtitle}>
              Hemos aplicado una corrección para tu reporte. Por favor, pruébala
              en la app y dinos si ya te funciona correctamente:
            </Text>

            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={() => handleOpenConfirm(item)}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                <Check size={15} color={COLORS.white} strokeWidth={2.6} />
                <Text style={styles.confirmBtnText} numberOfLines={1}>
                  Sí, está resuelto
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={() => handleOpenReject(item)}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                <X size={14} color="#B45309" strokeWidth={2.4} />
                <Text style={styles.rejectBtnText} numberOfLines={1}>
                  Aún sigue fallando
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Estado Resuelto Confirmado */}
        {isResolved && (
          <View style={styles.resolvedConfirmedBox}>
            <CheckCircle2 size={16} color={COLORS.primary} strokeWidth={2.5} style={styles.resolvedIcon} />
            <View style={styles.resolvedTextCol}>
              <Text style={styles.resolvedConfirmedTitle}>
                Solución confirmada por ti
              </Text>
              <Text style={styles.resolvedConfirmedDate}>
                {item.resolved_at
                  ? `Verificado el ${formatDate(item.resolved_at)}`
                  : "Incidencia resuelta"}
              </Text>
              {item.user_resolution_comment ? (
                <Text style={styles.resolvedUserComment}>
                  "{item.user_resolution_comment}"
                </Text>
              ) : null}
            </View>
          </View>
        )}
      </View>
    );
  };

  const currentCategory =
    meta.categories.find((c) => c.id === selectedCategory) ||
    meta.categories[0];
  const maxTitle = meta?.maxTitleLength || FEEDBACK_LIMITS.MAX_TITLE_LENGTH;
  const maxMessage = meta?.maxMessageLength || FEEDBACK_LIMITS.MAX_MESSAGE_LENGTH;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Barra Superior */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={10}
          accessibilityLabel="Volver al perfil"
        >
          <ChevronLeft size={22} color={COLORS.gray800} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.navBarTitle} numberOfLines={1}>
          Buzón y Consultas
        </Text>
        <View style={styles.navBarSpacer} />
      </View>

      {/* Selector de Pestañas Superiores */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "create" && styles.tabBtnActive]}
          onPress={() => setActiveTab("create")}
          activeOpacity={0.8}
        >
          <PlusCircle
            size={16}
            color={activeTab === "create" ? COLORS.primary : COLORS.gray500}
            strokeWidth={2.4}
          />
          <Text
            style={[
              styles.tabBtnText,
              activeTab === "create" && styles.tabBtnTextActive,
            ]}
          >
            Nueva opinión
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "mine" && styles.tabBtnActive]}
          onPress={() => setActiveTab("mine")}
          activeOpacity={0.8}
        >
          <Inbox
            size={16}
            color={activeTab === "mine" ? COLORS.primary : COLORS.gray500}
            strokeWidth={2.4}
          />
          <Text
            style={[
              styles.tabBtnText,
              activeTab === "mine" && styles.tabBtnTextActive,
            ]}
          >
            Mis consultas
          </Text>
          {pendingActionsCount > 0 ? (
            <View style={styles.badgeNotificationPill}>
              <Text style={styles.badgeNotificationText}>
                {pendingActionsCount}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      {/* CONTENIDO PESTAÑA 1: NUEVA OPINIÓN (FORMULARIO) */}
      {activeTab === "create" && (
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                {meta.title || "Buzón de Sugerencias y Feedback"}
              </Text>
              <Text style={styles.headerDescription}>
                {meta.description ||
                  "Tu opinión es fundamental para nosotros. Envíanos tus comentarios, reportes de fallos o propuestas de nuevas funciones para seguir mejorando YouConnext."}
              </Text>
            </View>

            {/* Selector de Categorías Dinámico */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>¿De qué trata tu comentario?</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesScroll}
              >
                {meta.categories.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  const icon = iconMap[cat.icon] || cat.icon || "📌";

                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryChip,
                        isSelected && styles.categoryChipSelected,
                      ]}
                      onPress={() => setSelectedCategory(cat.id)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                    >
                      <Text style={styles.categoryIcon}>{icon}</Text>
                      <Text
                        style={[
                          styles.categoryLabel,
                          isSelected && styles.categoryLabelSelected,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {currentCategory?.description ? (
                <View style={styles.categoryHintBox}>
                  <Text style={styles.categoryHintText}>
                    ℹ️ {currentCategory.description}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Campo Título Corto */}
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Text style={styles.sectionLabel}>Título corto</Text>
                <Text style={styles.counterText}>
                  {title.length} / {maxTitle}
                </Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Ej. Problema al confirmar trayecto"
                placeholderTextColor={COLORS.gray400}
                value={title}
                onChangeText={setTitle}
                maxLength={maxTitle}
                autoCapitalize="sentences"
                editable={!submitting}
              />
            </View>

            {/* Campo Mensaje */}
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Text style={styles.sectionLabel}>Mensaje de explicación</Text>
                <Text
                  style={[
                    styles.counterText,
                    message.length > 950 && styles.counterWarning,
                    message.length >= maxMessage && styles.counterLimit,
                  ]}
                >
                  {message.length} / {maxMessage}
                </Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Cuéntanos en detalle qué ha sucedido o cómo podemos mejorar..."
                placeholderTextColor={COLORS.gray400}
                value={message}
                onChangeText={setMessage}
                maxLength={maxMessage}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                editable={!submitting}
              />
            </View>

            {/* Botón de Envío */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                submitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmitNew}
              disabled={submitting}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <View style={styles.btnRow}>
                  <Send size={16} color={COLORS.white} strokeWidth={2.4} />
                  <Text style={styles.submitButtonText}>Enviar Feedback</Text>
                </View>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* CONTENIDO PESTAÑA 2: MIS CONSULTAS */}
      {activeTab === "mine" && (
        <View style={styles.container}>
          {loadingMine && !refreshingMine ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Cargando tus consultas...</Text>
            </View>
          ) : errorMine ? (
            <View style={styles.centerContainer}>
              <AlertCircle size={40} color={COLORS.error} strokeWidth={2.2} />
              <Text style={styles.errorTitle}>No pudimos cargar tus consultas</Text>
              <Text style={styles.errorSubtitle}>{errorMine}</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => fetchMyFeedbacks()}
                activeOpacity={0.8}
              >
                <RefreshCw size={15} color={COLORS.white} strokeWidth={2.4} />
                <Text style={styles.retryBtnText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : myFeedbacks.length === 0 ? (
            <View style={styles.centerContainer}>
              <View style={styles.emptyIconCircle}>
                <Inbox size={36} color={COLORS.gray400} strokeWidth={2} />
              </View>
              <Text style={styles.emptyTitle}>Aún no has enviado consultas</Text>
              <Text style={styles.emptySubtitle}>
                Cuando envíes una sugerencia o reportes un problema, podrás
                seguir aquí su estado y verificar las soluciones.
              </Text>
              <TouchableOpacity
                style={styles.createFirstBtn}
                onPress={() => setActiveTab("create")}
                activeOpacity={0.85}
              >
                <PlusCircle size={16} color={COLORS.white} strokeWidth={2.4} />
                <Text style={styles.createFirstBtnText}>Crear mi primera consulta</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={myFeedbacks}
              keyExtractor={(item) => item.id || String(Math.random())}
              renderItem={renderFeedbackItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshingMine}
                  onRefresh={() => fetchMyFeedbacks(true)}
                  colors={[COLORS.primary]}
                />
              }
            />
          )}
        </View>
      )}

      {/* MODAL 1: CONFIRMAR RESOLUCIÓN ("Sí, está resuelto") */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!actionSubmitting) setShowConfirmModal(false);
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircleSuccess}>
              <CheckCircle2 size={32} color={COLORS.primary} strokeWidth={2.5} />
            </View>
            <Text style={styles.modalTitle}>¿Confirmas que está resuelto?</Text>
            <Text style={styles.modalSubtitle}>
              Al confirmar, cerraremos tu consulta como solucionada con éxito.
              Puedes añadir un comentario breve opcional para el equipo:
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Ej. Ya me funciona perfectamente, ¡gracias!"
              placeholderTextColor={COLORS.gray400}
              value={confirmComment}
              onChangeText={setConfirmComment}
              maxLength={1024}
              multiline
              numberOfLines={3}
              editable={!actionSubmitting}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowConfirmModal(false)}
                disabled={actionSubmitting}
              >
                <Text style={styles.modalCancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  actionSubmitting && styles.submitButtonDisabled,
                ]}
                onPress={handleExecuteConfirm}
                disabled={actionSubmitting}
              >
                {actionSubmitting ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Confirmar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL 2: RECHAZAR RESOLUCIÓN ("Aún sigue fallando") */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!actionSubmitting) setShowRejectModal(false);
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircleWarning}>
              <AlertCircle size={32} color="#C2410C" strokeWidth={2.5} />
            </View>
            <Text style={styles.modalTitle}>¿El problema persiste?</Text>
            <Text style={styles.modalSubtitle}>
              Cuéntale al equipo qué sigue fallando para que puedan seguir
              investigando y devolver el ticket a desarrollo (mínimo 5 caracteres):
            </Text>

            <TextInput
              style={[styles.modalInput, styles.modalInputError]}
              placeholder="Explica qué error sigue apareciendo o en qué paso ocurre..."
              placeholderTextColor={COLORS.gray400}
              value={rejectReason}
              onChangeText={setRejectReason}
              maxLength={1024}
              multiline
              numberOfLines={4}
              editable={!actionSubmitting}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowRejectModal(false)}
                disabled={actionSubmitting}
              >
                <Text style={styles.modalCancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalRejectBtn,
                  (actionSubmitting || rejectReason.trim().length < 5) &&
                    styles.submitButtonDisabled,
                ]}
                onPress={handleExecuteReject}
                disabled={actionSubmitting || rejectReason.trim().length < 5}
              >
                {actionSubmitting ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.modalRejectBtnText}>Enviar a desarrollo</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.screenMargin,
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray50,
    alignItems: "center",
    justifyContent: "center",
  },
  navBarTitle: {
    fontFamily: FONTS.soraBold,
    fontSize: 16,
    color: COLORS.gray800,
  },
  navBarSpacer: {
    width: 36,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.screenMargin,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.gray50,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: COLORS.primarySoft,
  },
  tabBtnText: {
    fontFamily: FONTS.interMedium,
    fontSize: 13,
    color: COLORS.gray600,
  },
  tabBtnTextActive: {
    fontFamily: FONTS.interSemiBold,
    color: COLORS.primaryDark,
  },
  badgeNotificationPill: {
    backgroundColor: "#EA580C",
    borderRadius: RADIUS.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 2,
  },
  badgeNotificationText: {
    fontFamily: FONTS.interBold,
    fontSize: 10,
    color: COLORS.white,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.screenMargin,
    paddingBottom: SPACING.xxl * 2,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FONTS.soraBold,
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  headerDescription: {
    fontSize: 13,
    fontFamily: FONTS.interRegular,
    color: COLORS.gray600,
    lineHeight: 19,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: FONTS.soraSemiBold,
    color: COLORS.gray800,
    marginBottom: SPACING.sm,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  counterText: {
    fontSize: 11,
    fontFamily: FONTS.interRegular,
    color: COLORS.gray500,
  },
  counterWarning: {
    color: COLORS.warning,
    fontFamily: FONTS.interSemiBold,
  },
  counterLimit: {
    color: COLORS.error,
    fontFamily: FONTS.interBold,
  },
  categoriesScroll: {
    paddingVertical: SPACING.xs,
    paddingRight: SPACING.md,
    gap: SPACING.sm,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginRight: SPACING.xs,
  },
  categoryChipSelected: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryLabel: {
    fontSize: 13,
    fontFamily: FONTS.interMedium,
    color: COLORS.gray700,
  },
  categoryLabelSelected: {
    color: COLORS.primary,
    fontFamily: FONTS.interBold,
  },
  categoryHintBox: {
    marginTop: SPACING.sm,
    padding: SPACING.sm + 2,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
  },
  categoryHintText: {
    fontSize: 12,
    fontFamily: FONTS.interRegular,
    color: COLORS.gray600,
    lineHeight: 17,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderField,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 3,
    fontSize: 14,
    fontFamily: FONTS.interRegular,
    color: COLORS.black,
  },
  textArea: {
    minHeight: 125,
    paddingTop: SPACING.md,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.sm,
    ...SHADOWS.md,
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.primaryLight,
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontFamily: FONTS.soraBold,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.screenMargin * 1.5,
  },
  loadingText: {
    fontFamily: FONTS.interRegular,
    fontSize: 14,
    color: COLORS.gray600,
    marginTop: 12,
  },
  errorTitle: {
    fontFamily: FONTS.soraBold,
    fontSize: 16,
    color: COLORS.gray800,
    marginTop: 12,
    textAlign: "center",
  },
  errorSubtitle: {
    fontFamily: FONTS.interRegular,
    fontSize: 13,
    color: COLORS.gray600,
    marginTop: 4,
    textAlign: "center",
    lineHeight: 18,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    marginTop: 16,
    gap: 6,
  },
  retryBtnText: {
    fontFamily: FONTS.interSemiBold,
    fontSize: 13,
    color: COLORS.white,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: FONTS.soraBold,
    fontSize: 17,
    color: COLORS.gray800,
    marginBottom: 6,
    textAlign: "center",
  },
  emptySubtitle: {
    fontFamily: FONTS.interRegular,
    fontSize: 13,
    color: COLORS.gray600,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 20,
  },
  createFirstBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: RADIUS.md,
    gap: 8,
  },
  createFirstBtnText: {
    fontFamily: FONTS.soraBold,
    fontSize: 14,
    color: COLORS.white,
  },
  listContent: {
    padding: SPACING.screenMargin,
    paddingBottom: SPACING.xxl * 2,
    gap: SPACING.md,
  },
  feedbackCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md + 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  cardPendingVerification: {
    borderColor: "#FB923C",
    borderWidth: 1.5,
    backgroundColor: "#FFFAF5",
  },
  cardResolved: {
    borderColor: "#A7F3D0",
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 10,
    width: "100%",
  },
  categoryPill: {
    flexShrink: 1,
    maxWidth: "52%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gray50,
    borderRadius: RADIUS.full,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    gap: 5,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  categoryPillIcon: {
    fontSize: 13,
  },
  categoryPillLabel: {
    fontFamily: FONTS.interMedium,
    fontSize: 11.5,
    color: COLORS.gray700,
    flexShrink: 1,
  },
  statusBadge: {
    flexShrink: 0,
    maxWidth: "48%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: 4.5,
  },
  statusBadgeText: {
    fontFamily: FONTS.interSemiBold,
    fontSize: 11,
    lineHeight: 14,
    flexShrink: 1,
  },
  cardTitle: {
    fontFamily: FONTS.soraBold,
    fontSize: 15,
    color: COLORS.gray900,
    lineHeight: 20,
    marginBottom: 4,
    flexWrap: "wrap",
  },
  cardDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  cardDate: {
    fontFamily: FONTS.interRegular,
    fontSize: 11,
    color: COLORS.gray500,
  },
  cardMessage: {
    fontFamily: FONTS.interRegular,
    fontSize: 13.5,
    color: COLORS.gray700,
    lineHeight: 20,
  },
  expandTextBtn: {
    alignSelf: "flex-start",
    paddingVertical: 3,
    marginTop: 2,
    marginBottom: 6,
  },
  expandTextBtnText: {
    fontFamily: FONTS.interSemiBold,
    fontSize: 12,
    color: COLORS.primaryDark,
  },
  adminNotesBox: {
    backgroundColor: "#F4FAF6",
    borderRadius: RADIUS.md,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#D6E2DB",
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  adminNotesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  adminNotesTitle: {
    fontFamily: FONTS.soraSemiBold,
    fontSize: 11.5,
    color: COLORS.primaryDark,
  },
  adminNotesContent: {
    fontFamily: FONTS.interRegular,
    fontSize: 12.5,
    color: COLORS.gray800,
    lineHeight: 18,
  },
  actionPromptCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: RADIUS.md,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderLeftWidth: 3,
    borderLeftColor: "#F59E0B",
  },
  actionPromptTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  actionPromptTitle: {
    fontFamily: FONTS.soraBold,
    fontSize: 13,
    color: "#B45309",
  },
  actionPromptSubtitle: {
    fontFamily: FONTS.interRegular,
    fontSize: 12,
    color: COLORS.gray700,
    lineHeight: 17,
    marginBottom: 10,
  },
  actionButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  confirmBtn: {
    flex: 1.1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: RADIUS.md,
    gap: 5,
  },
  confirmBtnText: {
    fontFamily: FONTS.soraSemiBold,
    fontSize: 12,
    color: COLORS.white,
    flexShrink: 1,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1.2,
    borderColor: "#F59E0B",
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: RADIUS.md,
    gap: 4,
  },
  rejectBtnText: {
    fontFamily: FONTS.interSemiBold,
    fontSize: 11.5,
    color: "#B45309",
    flexShrink: 1,
  },
  resolvedConfirmedBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F0FDF4",
    padding: 12,
    borderRadius: RADIUS.md,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#DCFCE7",
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    gap: 8,
  },
  resolvedIcon: {
    marginTop: 2,
  },
  resolvedTextCol: {
    flex: 1,
  },
  resolvedConfirmedTitle: {
    fontFamily: FONTS.soraBold,
    fontSize: 12.5,
    color: COLORS.primaryDark,
    marginBottom: 2,
  },
  resolvedConfirmedDate: {
    fontFamily: FONTS.interRegular,
    fontSize: 11,
    color: COLORS.gray600,
  },
  resolvedUserComment: {
    fontFamily: FONTS.interRegular,
    fontSize: 12,
    color: COLORS.gray700,
    marginTop: 4,
    fontStyle: "italic",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.screenMargin,
  },
  modalCard: {
    width: "100%",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.lg,
  },
  modalIconCircleSuccess: {
    width: 54,
    height: 54,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 12,
  },
  modalIconCircleWarning: {
    width: 54,
    height: 54,
    borderRadius: RADIUS.full,
    backgroundColor: "#FFEDD5",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontFamily: FONTS.soraBold,
    fontSize: 17,
    color: COLORS.gray900,
    textAlign: "center",
    marginBottom: 6,
  },
  modalSubtitle: {
    fontFamily: FONTS.interRegular,
    fontSize: 13,
    color: COLORS.gray600,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 14,
  },
  modalInput: {
    backgroundColor: COLORS.gray50,
    borderWidth: 1,
    borderColor: COLORS.borderField,
    borderRadius: RADIUS.md,
    padding: 12,
    fontSize: 13.5,
    fontFamily: FONTS.interRegular,
    color: COLORS.gray900,
    minHeight: 70,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  modalInputError: {
    borderColor: "#FB923C",
  },
  modalButtonsRow: {
    flexDirection: "row",
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelBtnText: {
    fontFamily: FONTS.interMedium,
    fontSize: 13.5,
    color: COLORS.gray700,
  },
  modalConfirmBtn: {
    flex: 1.4,
    paddingVertical: 11,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  modalConfirmBtnText: {
    fontFamily: FONTS.soraBold,
    fontSize: 13.5,
    color: COLORS.white,
  },
  modalRejectBtn: {
    flex: 1.4,
    paddingVertical: 11,
    borderRadius: RADIUS.md,
    backgroundColor: "#C2410C",
    alignItems: "center",
    justifyContent: "center",
  },
  modalRejectBtnText: {
    fontFamily: FONTS.soraBold,
    fontSize: 13,
    color: COLORS.white,
  },
});

export default FeedbackScreen;
