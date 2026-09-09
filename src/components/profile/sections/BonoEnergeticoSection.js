import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import {
  Zap,
  IdCard,
  Car,
  Phone,
  Camera,
  User as UserIcon,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  CircleHelp,
} from "lucide-react-native";
import { COLORS, SPACING } from "../../../constants";
import styles from "../profileStyles";
import SubViewHeader from "./SubViewHeader";

const FIELD_CONFIG = {
  dni: {
    icon: IdCard,
    label: "DNI/NIE",
    section: "mi-perfil",
  },
  coche: {
    icon: Car,
    label: "Vehículo",
    section: "mis-vehiculos",
  },
  telefono: {
    icon: Phone,
    label: "Teléfono",
    section: "mi-perfil",
  },
  avatar: {
    icon: Camera,
    label: "Foto de perfil",
    section: "mi-perfil",
  },
  nombre: {
    icon: UserIcon,
    label: "Nombre",
    section: "mi-perfil",
  },
  apellidos: {
    icon: UserIcon,
    label: "Apellidos",
    section: "mi-perfil",
  },
};

const BonoEnergeticoSection = ({ user, onNavigate, onBack }) => {
  const completitud = user.completitud;
  const completitudCae = user.completitud_cae;
  const [showCaeHelp, setShowCaeHelp] = useState(false);

  const renderCaeHelp = () => (
    <View style={styles.caeHelpCard}>
      <TouchableOpacity
        style={styles.caeHelpHeader}
        onPress={() => setShowCaeHelp(!showCaeHelp)}
        activeOpacity={0.7}
      >
        <View style={styles.caeHelpHeaderLeft}>
          <CircleHelp size={22} color={COLORS.warning} strokeWidth={2} />
          <Text style={styles.caeHelpTitle}>¿Qué son los CAEs?</Text>
        </View>
        {showCaeHelp ? (
          <ChevronUp size={20} color={COLORS.gray400} strokeWidth={2} />
        ) : (
          <ChevronDown size={20} color={COLORS.gray400} strokeWidth={2} />
        )}
      </TouchableOpacity>

      {showCaeHelp && (
        <View style={styles.caeHelpContent}>
          <View>
            <Text style={styles.caeHelpSectionTitle}>¿Qué son?</Text>
            <Text style={styles.caeHelpText}>
              Los CAEs (Certificados de Ahorro Energético) son certificados
              oficiales del Gobierno de España que premian el ahorro de energía
              y la reducción de emisiones de CO2. Compartir coche reduce el
              número de vehículos en circulación, por lo que cada viaje
              compartido genera ahorro energético certificable que se convierte
              en dinero real en tu monedero.
            </Text>
          </View>
          <View>
            <Text style={styles.caeHelpSectionTitle}>¿Cómo se consiguen?</Text>
            <View style={styles.caeHelpStepRow}>
              <View style={styles.caeHelpStepBadge}>
                <Text style={styles.caeHelpStepBadgeText}>1</Text>
              </View>
              <Text style={[styles.caeHelpText, { flex: 1 }]}>
                Completa tu perfil y registra tu vehículo (DNI/NIE, teléfono y
                coche registrado).
              </Text>
            </View>
            <View style={styles.caeHelpStepRow}>
              <View style={styles.caeHelpStepBadge}>
                <Text style={styles.caeHelpStepBadgeText}>2</Text>
              </View>
              <Text style={[styles.caeHelpText, { flex: 1 }]}>
                Publica trayectos como conductor y completa los viajes con
                pasajeros.
              </Text>
            </View>
            <View style={styles.caeHelpStepRow}>
              <View style={styles.caeHelpStepBadge}>
                <Text style={styles.caeHelpStepBadgeText}>3</Text>
              </View>
              <Text style={[styles.caeHelpText, { flex: 1 }]}>
                Por cada km compartido con pasajeros se calcula el ahorro de
                energía (kWh) generado.
              </Text>
            </View>
            <View style={styles.caeHelpStepRow}>
              <View style={styles.caeHelpStepBadge}>
                <Text style={styles.caeHelpStepBadgeText}>4</Text>
              </View>
              <Text style={[styles.caeHelpText, { flex: 1 }]}>
                Los kWh se convierten en euros según la tasación oficial vigente
                y se añaden a tu monedero (primero "en revisión" y luego
                "disponible" para retirar).
              </Text>
            </View>
          </View>
          <View>
            <Text style={styles.caeHelpSectionTitle}>¿Cuánto puedo ganar?</Text>
            <Text style={styles.caeHelpText}>
              El valor depende de la tasación por kWh establecida por el
              Ministerio para la Transición Ecológica. Cuantos más viajes
              completes con pasajeros, más energía ahorras y más CAEs generas.
              Puedes consultar tus CAEs generados en tu Monedero y en tu
              historial de viajes.
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  // Determinar prioridad: 1) CAES, 2) Perfil completo
  const caesFaltan =
    completitudCae &&
    completitudCae.porcentaje_total < 100 &&
    completitudCae.campos_faltantes?.length > 0;
  const perfilFaltan =
    completitud &&
    completitud.porcentaje_total < 100 &&
    completitud.campos_faltantes?.length > 0;

  const hasAnyData = completitud || completitudCae;

  const activeSection = !hasAnyData
    ? "loading"
    : caesFaltan
      ? "caes"
      : perfilFaltan
        ? "perfil"
        : "complete";

  const renderStepsList = (camposFaltantes, title) => {
    if (!camposFaltantes || camposFaltantes.length === 0) return null;
    return (
      <View style={styles.bonoStepsCard}>
        <Text style={styles.bonoStepsTitle}>{title}</Text>
        {camposFaltantes.map((campo, index) => {
          const config = FIELD_CONFIG[campo.campo] || {
            icon: Zap,
            label: campo.campo,
            section: "mi-perfil",
          };
          const IconComp = config.icon;

          return (
            <TouchableOpacity
              key={campo.campo || index}
              style={styles.bonoStepItem}
              onPress={() => onNavigate(config.section)}
              activeOpacity={0.7}
            >
              <View style={styles.bonoStepLeft}>
                <View style={styles.bonoStepIconWrapper}>
                  <IconComp size={20} color={COLORS.warning} strokeWidth={2} />
                </View>
                <View style={styles.bonoStepContent}>
                  <View style={styles.bonoStepHeader}>
                    <Text style={styles.bonoStepLabel}>{config.label}</Text>
                    <View style={styles.bonoStepBadge}>
                      <Text style={styles.bonoStepBadgeText}>
                        +{campo.porcentaje_otorga}%
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.bonoStepMessage}>
                    {campo.mensaje_sugerido}
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={COLORS.gray400} strokeWidth={2} />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderProgressCard = (porcentaje, subtitle, icon) => {
    const IconComp = icon || Zap;
    return (
      <View style={styles.bonoProgressCard}>
        <View style={styles.bonoProgressHeader}>
          <View style={styles.bonoProgressIconWrapper}>
            <IconComp size={28} color={COLORS.white} strokeWidth={2.5} />
          </View>
          <View style={styles.bonoProgressInfo}>
            <Text style={styles.bonoProgressTitle}>
              {porcentaje}% completado
            </Text>
            <Text style={styles.bonoProgressSubtitle}>{subtitle}</Text>
          </View>
        </View>
        <View style={styles.bonoProgressBarBg}>
          <View
            style={[styles.bonoProgressBarFill, { width: `${porcentaje}%` }]}
          />
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.sectionContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.sectionScroll}
    >
      <SubViewHeader title="Mi Bono Energético" onBack={onBack} />

      {renderCaeHelp()}

      {activeSection === "caes" && (
        <>
          {renderProgressCard(
            completitudCae.porcentaje_total,
            `${completitudCae.campos_faltantes.length} pasos para poder generar CAEs`,
            Car,
          )}
          {renderStepsList(
            completitudCae.campos_faltantes,
            "Pasos para generar CAEs",
          )}
        </>
      )}

      {activeSection === "perfil" && (
        <>
          {renderProgressCard(
            completitud.porcentaje_total,
            `${completitud.campos_faltantes.length} pasos restantes para completar tu perfil`,
            Zap,
          )}
          {renderStepsList(
            completitud.campos_faltantes,
            "Pasos para completar tu perfil",
          )}
        </>
      )}

      {activeSection === "complete" && (
        <View style={styles.bonoCompleteCard}>
          <CheckCircle2 size={48} color={COLORS.success} strokeWidth={2} />
          <Text style={styles.bonoCompleteTitle}>¡Todo configurado!</Text>
          <Text style={styles.bonoCompleteSubtitle}>
            Has completado todos los pasos. Tu bono energético está al máximo.
          </Text>
        </View>
      )}

      {activeSection === "loading" && (
        <View style={styles.bonoProgressCard}>
          <View style={styles.bonoProgressHeader}>
            <View style={styles.bonoProgressIconWrapper}>
              <Zap size={28} color={COLORS.white} strokeWidth={2.5} />
            </View>
            <View style={styles.bonoProgressInfo}>
              <Text style={styles.bonoProgressTitle}>Cargando...</Text>
              <Text style={styles.bonoProgressSubtitle}>
                Cargando información del perfil...
              </Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default BonoEnergeticoSection;
