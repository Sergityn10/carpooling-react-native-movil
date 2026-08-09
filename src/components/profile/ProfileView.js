// YouConnext - ProfileView (seccionado)
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Alert, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useUser } from "../../context/UserContext";
import { trayectoService } from "../../services/travels/trayectoService";
import { reservaService } from "../../services/travels/reservaService";
import { carService } from "../../services/carService";
import { paymentService } from "../../services/paymentService";
import { usuarioService } from "../../services/usuarioService";
import styles from "./profileStyles";
import SubViewHeader from "./sections/SubViewHeader";
import MiPerfilSection from "./sections/MiPerfilSection";
import MainMenuSection from "./sections/MainMenuSection";
import HistorialSection from "./sections/HistorialSection";
import VehiculosSection from "./sections/VehiculosSection";
import MonederoSection from "./sections/MonederoSection";
import BonoEnergeticoSection from "./sections/BonoEnergeticoSection";

const ProfileView = ({
  user,
  navigation,
  onLogout,
  initialSubView = "menu",
}) => {
  const { actualizarUsuario } = useUser();
  const [currentSubView, setCurrentSubView] = useState(initialSubView);
  const [editingSection, setEditingSection] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || "",
    surname: user.surname || "",
    email: user.email || "",
    phone: user.phone || "",
    dni: user.dni || "",
    fecha_nacimiento: user.fecha_nacimiento || "",
    genero: user.genero || "",
    about_me: user.about_me || "",
    ciudad: user.ciudad || "",
    provincia: user.provincia || "",
    codigo_postal: user.codigo_postal || "",
    direccion: user.direccion || "",
    pais: user.pais || "",
  });
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerDate, setDatePickerDate] = useState(
    user.fecha_nacimiento
      ? new Date(user.fecha_nacimiento)
      : new Date(2000, 0, 1),
  );

  const [viajes, setViajes] = useState([]);
  const [loadingViajes, setLoadingViajes] = useState(false);
  const [errorViajes, setErrorViajes] = useState(null);
  const [publicStats, setPublicStats] = useState({
    completed_trips: 0,
    kwh_generated: 0,
    eur_generated: 0,
  });
  const [resumingPagoId, setResumingPagoId] = useState(null);
  const [expandedViajeId, setExpandedViajeId] = useState(null);
  const [viajePasajeros, setViajePasajeros] = useState({});
  const [loadingPasajeros, setLoadingPasajeros] = useState({});

  // Estados para gestión de coches
  const [coches, setCoches] = useState([]);
  const [loadingCoches, setLoadingCoches] = useState(false);
  const [errorCoches, setErrorCoches] = useState(null);
  const [showCocheForm, setShowCocheForm] = useState(false);
  const [editingCocheId, setEditingCocheId] = useState(null);
  const [savingCoche, setSavingCoche] = useState(false);
  const [cocheFormData, setCocheFormData] = useState({
    matricula: "",
    marca: "",
    modelo: "",
    color: "Blanco",
    tipo_combustible: "Gasolina",
    num_plazas: "5",
    year: String(new Date().getFullYear()),
  });

  // Estados de autocompletado para coches
  const [showMarcaSuggestions, setShowMarcaSuggestions] = useState(false);
  const [showModeloSuggestions, setShowModeloSuggestions] = useState(false);

  // Estados del monedero / Stripe
  const [walletBalance, setWalletBalance] = useState(null);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [walletPayouts, setWalletPayouts] = useState([]);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [walletError, setWalletError] = useState(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [processingPayout, setProcessingPayout] = useState(false);
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [stripeConnectStatus, setStripeConnectStatus] = useState(null);
  const [stripeOnboardingLoading, setStripeOnboardingLoading] = useState(false);
  const [caeData, setCaeData] = useState(null);

  // Sincronizar formData cuando el user del contexto se actualiza
  // Solo dependemos de campos primitivos para evitar loops
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        surname: user.surname || "",
        email: user.email || "",
        phone: user.phone || "",
        dni: user.dni || "",
        fecha_nacimiento: user.fecha_nacimiento || "",
        genero: user.genero || "",
        about_me: user.about_me || "",
        ciudad: user.ciudad || "",
        provincia: user.provincia || "",
        codigo_postal: user.codigo_postal || "",
        direccion: user.direccion || "",
        pais: user.pais || "",
      });
      setSelectedPlace(null);
      if (user.fecha_nacimiento) {
        setDatePickerDate(new Date(user.fecha_nacimiento));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user?.id,
    user?.name,
    user?.surname,
    user?.phone,
    user?.dni,
    user?.about_me,
    user?.ciudad,
  ]);

  const fetchCoches = useCallback(async () => {
    setLoadingCoches(true);
    setErrorCoches(null);
    try {
      const res = await carService.obtenerCochesUsuario(user.id);
      if (res && res.status === "Success") {
        setCoches(res.cars || []);
      } else {
        setCoches([]);
      }
    } catch (err) {
      console.error("Error al cargar coches de perfil:", err);
      setErrorCoches("No se pudieron cargar tus vehículos.");
    } finally {
      setLoadingCoches(false);
    }
  }, [user.id]);

  useEffect(() => {
    if (currentSubView === "mis-vehiculos") {
      fetchCoches();
    }
  }, [currentSubView, fetchCoches]);

  const fetchWalletData = useCallback(async () => {
    setLoadingWallet(true);
    setWalletError(null);
    try {
      const [balanceRes, txRes, payoutsRes, linkedRes, stripeRes] =
        await Promise.allSettled([
          paymentService.getWalletBalance(),
          paymentService.getWalletTransactions(20, 0),
          paymentService.getWalletPayouts(10, 0),
          paymentService.getLinkedAccounts(),
          paymentService.getStripeConnect(),
        ]);
      if (balanceRes.status === "fulfilled" && balanceRes.value?.balances) {
        setWalletBalance(balanceRes.value.balances);
      }
      if (balanceRes.status === "fulfilled" && balanceRes.value?.cae) {
        setCaeData(balanceRes.value.cae);
      } else {
        setCaeData(null);
      }
      if (txRes.status === "fulfilled" && txRes.value?.transactions) {
        setWalletTransactions(txRes.value.transactions);
      }
      if (payoutsRes.status === "fulfilled" && payoutsRes.value?.payouts) {
        setWalletPayouts(payoutsRes.value.payouts);
      }
      if (linkedRes.status === "fulfilled" && linkedRes.value?.cuentas) {
        setLinkedAccounts(linkedRes.value.cuentas);
      }
      if (stripeRes.status === "fulfilled" && stripeRes.value?.account) {
        const acct = stripeRes.value.account;
        setStripeConnectStatus({
          hasAccount: true,
          chargesEnabled: acct.charges_enabled || false,
          payoutsEnabled: acct.payouts_enabled || false,
          detailsSubmitted: acct.details_submitted || false,
        });
      } else {
        setStripeConnectStatus({ hasAccount: false });
      }
    } catch (err) {
      console.error("Error al cargar datos del monedero:", err);
      setWalletError("No se pudieron cargar los datos del monedero.");
    } finally {
      setLoadingWallet(false);
    }
  }, []);

  useEffect(() => {
    if (currentSubView === "monedero") {
      fetchWalletData();
    }
  }, [currentSubView, fetchWalletData]);

  useEffect(() => {
    paymentService
      .getWalletBalance()
      .then((res) => {
        if (res?.balances) setWalletBalance(res.balances);
        if (res?.cae) setCaeData(res.cae);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    reservaService
      .obtenerStatsUsuario(user.id)
      .then((res) => {
        const stats = res?.data || res || {};
        const trayectos = stats.trayectos || {};
        const reservas = stats.reservas || {};
        const cae = stats.cae || {};
        setPublicStats({
          completed_trips:
            (trayectos.finalizados ?? 0) + (reservas.completadas ?? 0),
          kwh_generated: cae.kwh_generados ?? 0,
          eur_generated: cae.eur_generados ?? 0,
        });
      })
      .catch((err) => {
        console.warn("[ProfileView] stats error:", err?.message);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchViajes = useCallback(async () => {
    setLoadingViajes(true);
    setErrorViajes(null);
    try {
      const [conductorRes, pasajeroRes] = await Promise.allSettled([
        trayectoService.obtenerMisTrayectos({ limit: 100 }),
        reservaService.obtenerMisReservas(user.id, { limit: 100 }),
      ]);

      let misTrayectos = [];
      if (conductorRes.status === "fulfilled") {
        const raw = conductorRes.value;
        misTrayectos = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
            ? raw.data
            : Array.isArray(raw?.trayectos)
              ? raw.trayectos
              : [];
      } else {
        console.warn(
          "Error al cargar trayectos como conductor:",
          conductorRes.reason,
        );
      }

      let misReservas = [];
      if (pasajeroRes.status === "fulfilled") {
        const raw = pasajeroRes.value;
        misReservas = raw?.pasajerosList || raw?.data?.pasajerosList || [];
      } else {
        console.warn(
          "Error al cargar reservas como pasajero:",
          pasajeroRes.reason,
        );
      }

      const condViajes = misTrayectos.map((t) => ({
        id: t.id,
        origen: t.origen,
        destino: t.destino,
        hora: t.hora || t.fecha,
        plazas: t.plazas,
        disponible: t.disponible,
        precio: t.precio,
        conductorName: `${user.name} ${user.surname}`,
        conductor_id: user.id,
        status: t.status || t.estado || "pendiente",
        rol: "conductor",
        keyId: `cond-${t.id}`,
        originalData: t,
      }));

      const pasViajes = misReservas.map((r) => {
        const t = r.trayecto || {};
        return {
          id: t.id,
          id_reserva: r.id_reserva,
          origen: t.origen || "Sin especificar",
          destino: t.destino || "Sin especificar",
          hora: t.hora || t.fecha || r.createdAt,
          plazas: t.plazas,
          precio: t.precio,
          conductorName: t.conductor || "Conductor",
          conductor_id: t.conductor_id,
          status: t.status || t.estado || "pendiente",
          reservaStatus: r.status,
          rol: "pasajero",
          keyId: `pas-${r.id_reserva}`,
          originalData: t,
        };
      });

      const todos = [...condViajes, ...pasViajes];
      todos.sort((a, b) => {
        const dateA = new Date(a.hora);
        const dateB = new Date(b.hora);
        return dateB - dateA;
      });

      setViajes(todos);
    } catch (err) {
      console.error("Error al cargar viajes de perfil:", err);
      setErrorViajes("No se pudieron cargar tus viajes.");
    } finally {
      setLoadingViajes(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchViajes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentSubView === "historial") {
      fetchViajes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSubView]);

  const handleTogglePasajeros = async (viajeId) => {
    if (expandedViajeId === viajeId) {
      setExpandedViajeId(null);
      return;
    }
    setExpandedViajeId(viajeId);
    if (viajePasajeros[viajeId]) return;
    setLoadingPasajeros((prev) => ({ ...prev, [viajeId]: true }));
    try {
      const data = await reservaService.obtenerReservasPorTrayecto(viajeId);
      const lista = data?.pasajerosList || data || [];
      setViajePasajeros((prev) => ({ ...prev, [viajeId]: lista }));
    } catch (err) {
      console.warn("Error al cargar pasajeros:", err);
      setViajePasajeros((prev) => ({ ...prev, [viajeId]: [] }));
    } finally {
      setLoadingPasajeros((prev) => ({ ...prev, [viajeId]: false }));
    }
  };

  const handleRetomarPago = async (idReserva) => {
    setResumingPagoId(idReserva);
    try {
      await reservaService.resumePago(idReserva, "youconnext://perfil");
      const checkoutRes = await paymentService.getCheckoutLink(idReserva);
      if (checkoutRes?.checkout_url) {
        await Linking.openURL(checkoutRes.checkout_url);
      } else {
        Alert.alert(
          "Error",
          checkoutRes?.message || "No se pudo retomar el pago.",
        );
      }
    } catch (error) {
      Alert.alert("Error", error?.message || "No se pudo retomar el pago.");
    } finally {
      setResumingPagoId(null);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlaceSelect = (place) => {
    if (!place) {
      setSelectedPlace(null);
      setFormData((prev) => ({
        ...prev,
        direccion: "",
        ciudad: "",
        provincia: "",
        codigo_postal: "",
        pais: "",
      }));
      return;
    }
    setSelectedPlace(place);
    const addr = place.address || "";

    let ciudad = "";
    let provincia = "";
    let codigoPostal = "";
    let pais = "";

    const components = place.addressComponents || [];
    for (const c of components) {
      const types = c.types || [];
      if (types.includes("locality")) {
        ciudad = c.long_name || "";
      } else if (types.includes("administrative_area_level_2")) {
        if (!provincia) provincia = c.long_name || "";
      } else if (types.includes("administrative_area_level_1")) {
        provincia = c.long_name || "";
      } else if (types.includes("postal_code")) {
        codigoPostal = c.long_name || "";
      } else if (types.includes("country")) {
        pais = c.long_name || "";
      }
    }

    setFormData((prev) => ({
      ...prev,
      direccion: addr,
      ciudad: ciudad || prev.ciudad,
      provincia: provincia || prev.provincia,
      codigo_postal: codigoPostal || prev.codigo_postal,
      pais: pais || prev.pais,
    }));
  };

  const handleDateChange = (event, selectedDate) => {
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split("T")[0];
      setFormData((prev) => ({ ...prev, fecha_nacimiento: formattedDate }));
      setDatePickerDate(selectedDate);
    }
    setShowDatePicker(false);
  };

  const handleSaveSection = async (section) => {
    setSaving(true);
    try {
      let datosToUpdate = {};
      if (section === "datos-personales") {
        if (!formData.name.trim()) {
          Alert.alert("Error", "El nombre es obligatorio.");
          setSaving(false);
          return;
        }
        datosToUpdate = {
          name: formData.name.trim(),
          surname: formData.surname.trim(),
          fecha_nacimiento: formData.fecha_nacimiento,
          genero: formData.genero,
        };
      } else if (section === "datos-cuenta") {
        datosToUpdate = {
          phone: formData.phone.trim(),
          dni: formData.dni.trim(),
        };
      } else if (section === "sobre-mi") {
        datosToUpdate = {
          about_me: formData.about_me,
        };
      } else if (section === "ubicacion") {
        datosToUpdate = {
          direccion: formData.direccion.trim(),
          ciudad: formData.ciudad.trim(),
          provincia: formData.provincia.trim(),
          codigo_postal: formData.codigo_postal.trim(),
          pais: formData.pais.trim(),
        };
      }

      await actualizarUsuario(datosToUpdate);
      Alert.alert(
        "Sección actualizada",
        "Tus datos se han guardado correctamente.",
      );
      setEditingSection(null);
    } catch (error) {
      Alert.alert("Error", error.message || "No se pudo actualizar.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSection = (section) => {
    if (section === "datos-personales") {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        surname: user.surname || "",
        fecha_nacimiento: user.fecha_nacimiento || "",
        genero: user.genero || "",
      }));
    } else if (section === "datos-cuenta") {
      setFormData((prev) => ({
        ...prev,
        phone: user.phone || "",
        dni: user.dni || "",
      }));
    } else if (section === "ubicacion") {
      setFormData((prev) => ({
        ...prev,
        direccion: user.direccion || "",
        ciudad: user.ciudad || "",
        provincia: user.provincia || "",
        codigo_postal: user.codigo_postal || "",
        pais: user.pais || "",
      }));
      setSelectedPlace(null);
    } else if (section === "sobre-mi") {
      setFormData((prev) => ({
        ...prev,
        about_me: user.about_me || "",
      }));
    }
    setEditingSection(null);
  };

  const handleEditSection = (section) => {
    setFormData({
      name: user.name || "",
      surname: user.surname || "",
      email: user.email || "",
      phone: user.phone || "",
      dni: user.dni || "",
      fecha_nacimiento: user.fecha_nacimiento || "",
      genero: user.genero || "",
      about_me: user.about_me || "",
      ciudad: user.ciudad || "",
      provincia: user.provincia || "",
      codigo_postal: user.codigo_postal || "",
      direccion: user.direccion || "",
      pais: user.pais || "",
    });
    setEditingSection(section);
  };

  const formatCentsToEuros = (cents) => {
    if (typeof cents !== "number") return "0,00";
    return (cents / 100).toLocaleString("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getWalletBalanceEuros = () => {
    if (!walletBalance || walletBalance.length === 0) return "0,00";
    return formatCentsToEuros(walletBalance[0].balance_cents);
  };

  const handleWithdraw = async () => {
    const euros = parseFloat(payoutAmount.replace(",", "."));
    if (!euros || euros <= 0) {
      Alert.alert("Error", "Introduce una cantidad válida.");
      return;
    }
    const cents = Math.round(euros * 100);
    setProcessingPayout(true);
    try {
      await paymentService.createWalletPayout({
        amount: cents,
        currency: "eur",
        method: "standard",
      });
      Alert.alert(
        "Retirada procesada",
        "Tu solicitud de retirada está en proceso.",
      );
      setShowPayoutModal(false);
      setPayoutAmount("");
      fetchWalletData();
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo procesar la retirada.");
    } finally {
      setProcessingPayout(false);
    }
  };

  const handleViewStripeAccount = async () => {
    try {
      const res = await paymentService.createStripeLoginLink({
        return_url: "youconnext://perfil",
      });
      if (res?.loginLink?.url) {
        await Linking.openURL(res.loginLink.url);
      } else {
        Alert.alert(
          "Aviso",
          "No tienes una cuenta Stripe Connect configurada.",
        );
      }
    } catch (err) {
      Alert.alert(
        "Cuenta no configurada",
        "Primero debes configurar tu cuenta Stripe Connect para acceder al panel.",
      );
    }
  };

  const handleSetupStripeConnect = async () => {
    setStripeOnboardingLoading(true);
    try {
      const linkRes = await paymentService.getStripeConnectLink({
        return_url: "youconnext://perfil",
        refresh_url: "youconnext://perfil",
      });
      if (linkRes?.accountLink?.url) {
        await Linking.openURL(linkRes.accountLink.url);
      } else {
        Alert.alert("Error", "No se pudo generar el link de onboarding.");
      }
      fetchWalletData();
    } catch (err) {
      Alert.alert(
        "Error",
        err.message || "No se pudo generar el link de onboarding.",
      );
    } finally {
      setStripeOnboardingLoading(false);
    }
  };

  const handleSetupPaymentMethod = async () => {
    try {
      const linkRes = await paymentService.getStripeConnectLink({
        return_url: "youconnext://perfil",
        refresh_url: "youconnext://perfil",
      });
      if (linkRes?.accountLink?.url) {
        await Linking.openURL(linkRes.accountLink.url);
      } else {
        Alert.alert("Error", "No se pudo generar el link de onboarding.");
      }
    } catch (err) {
      Alert.alert(
        "Error",
        err.message || "No se pudo generar el link de onboarding.",
      );
    }
  };

  const handlePickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync(false);
      if (permissionResult.status !== "granted") {
        Alert.alert(
          "Permisos necesarios",
          "Necesitas conceder acceso a la galería para cambiar tu foto de perfil.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      if (!asset.base64) {
        Alert.alert("Error", "No se pudo procesar la imagen.");
        return;
      }

      const mime = asset.mimeType || "image/jpeg";
      const dataUri = `data:${mime};base64,${asset.base64}`;

      setUploadingImage(true);
      await actualizarUsuario({ img_perfil: dataUri });
      Alert.alert("Éxito", "Foto de perfil actualizada correctamente.");
    } catch (err) {
      Alert.alert(
        "Error",
        err.message || "No se pudo actualizar la foto de perfil.",
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCocheInputChange = (field, value) => {
    if (field === "_showMarcaSuggestions") {
      setShowMarcaSuggestions(value);
      return;
    }
    if (field === "_showModeloSuggestions") {
      setShowModeloSuggestions(value);
      return;
    }
    setCocheFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateOrUpdateCoche = async () => {
    const {
      matricula,
      marca,
      modelo,
      color,
      tipo_combustible,
      num_plazas,
      year,
    } = cocheFormData;

    if (!matricula.trim()) {
      Alert.alert("Error", "La matrícula es obligatoria.");
      return;
    }
    const matriculaLimpia = matricula.trim().toUpperCase().replace(/\s+/g, "");
    const formatoMatricula = /^\d{4}[BCDFGHJKLMNPRSTVWXYZ]{3}$/;
    if (!formatoMatricula.test(matriculaLimpia)) {
      Alert.alert(
        "Matrícula no válida",
        "El formato correcto es 4 números seguidos de 3 consonantes (sin vocales).\nEjemplo: 1234 BCD\n\nAsegúrate de que no contiene vocales (A, E, I, O, U), ni las letras Q o Ñ.",
      );
      return;
    }
    if (!marca.trim()) {
      Alert.alert("Error", "La marca es obligatoria.");
      return;
    }
    if (!modelo.trim()) {
      Alert.alert("Error", "El modelo es obligatorio.");
      return;
    }
    if (!num_plazas || isNaN(Number(num_plazas)) || Number(num_plazas) <= 0) {
      Alert.alert("Error", "Introduce un número válido de plazas.");
      return;
    }
    if (
      !year ||
      isNaN(Number(year)) ||
      Number(year) < 1900 ||
      Number(year) > new Date().getFullYear() + 1
    ) {
      Alert.alert("Error", "Introduce un año de fabricación válido.");
      return;
    }

    setSavingCoche(true);
    try {
      const payload = {
        matricula: matricula.trim().toUpperCase(),
        marca: marca.trim(),
        modelo: modelo.trim(),
        color: color.trim() || "Blanco",
        tipo_combustible: tipo_combustible,
        num_plazas: Number(num_plazas),
        year: Number(year),
      };

      if (editingCocheId) {
        const res = await carService.actualizarCoche(editingCocheId, payload);
        if (res && res.status === "Success") {
          Alert.alert("Éxito", "Vehículo actualizado correctamente.");
          handleResetCocheForm();
          fetchCoches();
        } else {
          Alert.alert(
            "Error",
            res?.message || "No se pudo actualizar el vehículo.",
          );
        }
      } else {
        const res = await carService.crearCoche(payload);
        if (res && res.status === "Success") {
          Alert.alert("Éxito", "Vehículo registrado correctamente.");
          handleResetCocheForm();
          fetchCoches();
        } else {
          Alert.alert(
            "Error",
            res?.message || "No se pudo registrar el vehículo.",
          );
        }
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error.message || "No se pudo procesar la solicitud.",
      );
    } finally {
      setSavingCoche(false);
    }
  };

  const handleDeleteCoche = (cocheId) => {
    Alert.alert(
      "Eliminar vehículo",
      "¿Estás seguro de que quieres eliminar este vehículo?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await carService.eliminarCoche(cocheId);
              if (res && res.status === "Success") {
                Alert.alert("Éxito", "Vehículo eliminado correctamente.");
                fetchCoches();
              } else {
                Alert.alert(
                  "Error",
                  res?.message || "No se pudo eliminar el vehículo.",
                );
              }
            } catch (error) {
              Alert.alert("Error", "No se pudo eliminar el vehículo.");
            }
          },
        },
      ],
    );
  };

  const handleEditCocheClick = (coche) => {
    setCocheFormData({
      matricula: coche.matricula || "",
      marca: coche.marca || "",
      modelo: coche.modelo || "",
      color: coche.color || "Blanco",
      tipo_combustible: coche.tipo_combustible || "Gasolina",
      num_plazas: String(coche.num_plazas || "5"),
      year: String(coche.year || new Date().getFullYear()),
    });
    setEditingCocheId(coche.id_coche);
    setShowCocheForm(true);
  };

  const handleResetCocheForm = () => {
    setCocheFormData({
      matricula: "",
      marca: "",
      modelo: "",
      color: "Blanco",
      tipo_combustible: "Gasolina",
      num_plazas: "5",
      year: String(new Date().getFullYear()),
    });
    setEditingCocheId(null);
    setShowCocheForm(false);
    setShowMarcaSuggestions(false);
    setShowModeloSuggestions(false);
  };

  const handleBackToMenu = () => {
    setEditingSection(null);
    setCurrentSubView("menu");
  };

  const renderPlaceholder = (title, subtitle, Icon) => (
    <View style={styles.placeholderContainer}>
      <View style={styles.placeholderIconBg}>
        <Icon size={40} color="#D1D5DB" strokeWidth={1.5} />
      </View>
      <Text style={styles.placeholderTitle}>{title}</Text>
      <Text style={styles.placeholderSubtitle}>{subtitle}</Text>
    </View>
  );

  const renderSection = () => {
    switch (currentSubView) {
      case "menu":
        return (
          <MainMenuSection
            user={user}
            navigation={navigation}
            onLogout={onLogout}
            publicStats={publicStats}
            walletBalanceEuros={getWalletBalanceEuros()}
            onNavigate={setCurrentSubView}
          />
        );
      case "mi-perfil":
        return (
          <MiPerfilSection
            user={user}
            navigation={navigation}
            formData={formData}
            editingSection={editingSection}
            saving={saving}
            showDatePicker={showDatePicker}
            datePickerDate={datePickerDate}
            uploadingImage={uploadingImage}
            selectedPlace={selectedPlace}
            onInputChange={handleInputChange}
            onDateChange={handleDateChange}
            onShowDatePicker={() => setShowDatePicker(true)}
            onPlaceSelect={handlePlaceSelect}
            onSaveSection={handleSaveSection}
            onCancelSection={handleCancelSection}
            onEditSection={handleEditSection}
            onPickImage={handlePickImage}
            onBack={handleBackToMenu}
          />
        );
      case "historial":
        return (
          <HistorialSection
            viajes={viajes}
            loadingViajes={loadingViajes}
            errorViajes={errorViajes}
            expandedViajeId={expandedViajeId}
            viajePasajeros={viajePasajeros}
            loadingPasajeros={loadingPasajeros}
            resumingPagoId={resumingPagoId}
            navigation={navigation}
            onRetry={fetchViajes}
            onTogglePasajeros={handleTogglePasajeros}
            onRetomarPago={handleRetomarPago}
            onBack={handleBackToMenu}
          />
        );
      case "mis-vehiculos":
        return (
          <VehiculosSection
            showCocheForm={showCocheForm}
            editingCocheId={editingCocheId}
            savingCoche={savingCoche}
            cocheFormData={cocheFormData}
            showMarcaSuggestions={showMarcaSuggestions}
            showModeloSuggestions={showModeloSuggestions}
            coches={coches}
            loadingCoches={loadingCoches}
            errorCoches={errorCoches}
            onCocheInputChange={handleCocheInputChange}
            onCreateOrUpdateCoche={handleCreateOrUpdateCoche}
            onResetCocheForm={handleResetCocheForm}
            onEditCoche={handleEditCocheClick}
            onDeleteCoche={handleDeleteCoche}
            onFetchCoches={fetchCoches}
            onShowCocheForm={() => setShowCocheForm(true)}
            onBack={handleBackToMenu}
          />
        );
      case "rutinas":
        return (
          <ScrollView
            style={styles.sectionContent}
            showsVerticalScrollIndicator={false}
          >
            <SubViewHeader title="Mi rutina" onBack={handleBackToMenu} />
            {renderPlaceholder(
              "Mis rutinas",
              "Crea rutinas para tus trayectos frecuentes y automatiza tus viajes.",
              Calendar,
            )}
          </ScrollView>
        );
      case "bono-energetico":
        return (
          <BonoEnergeticoSection
            user={user}
            onNavigate={setCurrentSubView}
            onBack={handleBackToMenu}
          />
        );
      case "monedero":
        return (
          <MonederoSection
            walletBalance={walletBalance}
            walletBalanceEuros={getWalletBalanceEuros()}
            caeData={caeData}
            loadingWallet={loadingWallet}
            walletError={walletError}
            walletTransactions={walletTransactions}
            walletPayouts={walletPayouts}
            linkedAccounts={linkedAccounts}
            stripeConnectStatus={stripeConnectStatus}
            stripeOnboardingLoading={stripeOnboardingLoading}
            showPayoutModal={showPayoutModal}
            payoutAmount={payoutAmount}
            processingPayout={processingPayout}
            onSetPayoutAmount={setPayoutAmount}
            onShowPayoutModal={() => setShowPayoutModal(true)}
            onClosePayoutModal={() => {
              setShowPayoutModal(false);
              setPayoutAmount("");
            }}
            onWithdraw={handleWithdraw}
            onViewStripeAccount={handleViewStripeAccount}
            onSetupStripeConnect={handleSetupStripeConnect}
            onSetupPaymentMethod={handleSetupPaymentMethod}
            onRetryWallet={fetchWalletData}
            onBack={handleBackToMenu}
          />
        );
      default:
        return (
          <MainMenuSection
            user={user}
            navigation={navigation}
            onLogout={onLogout}
            publicStats={publicStats}
            walletBalanceEuros={getWalletBalanceEuros()}
            onNavigate={setCurrentSubView}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.contentContainer}>{renderSection()}</View>
    </SafeAreaView>
  );
};

export default ProfileView;
