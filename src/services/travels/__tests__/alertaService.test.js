import test from "node:test";
import assert from "node:assert/strict";
import {
  TIPO_ALERTA,
  buildCreateAlertaPayload,
  extractCityName,
  findDuplicateAlerta,
  getAlertaErrorMessage,
  parseTripAlertNotificationData,
} from "../../../utils/alertaUtils.js";
import { createEventResolutionCache } from "../../../utils/eventResolutionCache.js";

test("buildCreateAlertaPayload validates and trims DESTINO and EVENTO payloads", () => {
  assert.deepEqual(
    buildCreateAlertaPayload({ tipo: "DESTINO", destino: "  Valencia  " }),
    { tipo: TIPO_ALERTA.DESTINO, destino: "Valencia" },
  );

  assert.deepEqual(
    buildCreateAlertaPayload({ tipo: "EVENTO", eventoId: "evt-uuid-123" }),
    { tipo: TIPO_ALERTA.EVENTO, eventoId: "evt-uuid-123" },
  );

  assert.throws(
    () => buildCreateAlertaPayload({ tipo: "DESTINO", destino: " " }),
    (err) => err.status === 400,
  );

  assert.throws(
    () => buildCreateAlertaPayload({ tipo: "EVENTO", eventoId: "" }),
    (err) => err.status === 400,
  );

  assert.throws(
    () => buildCreateAlertaPayload({ tipo: "OTRO" }),
    (err) => err.status === 400,
  );
});

test("extractCityName extracts clean city names from strings and Google Places objects", () => {
  assert.equal(extractCityName("Valencia, España"), "Valencia");
  assert.equal(
    extractCityName({
      address: "Valencia, Comunidad Valenciana, España",
      addressComponents: [
        { long_name: "Valencia", types: ["locality", "political"] },
        { long_name: "España", types: ["country", "political"] },
      ],
    }),
    "Valencia",
  );
  assert.equal(
    extractCityName({
      address: "Calle Mayor, 28013 Madrid",
      addressComponents: [
        { long_name: "Madrid", types: ["administrative_area_level_2"] },
      ],
    }),
    "Madrid",
  );
});

test("findDuplicateAlerta detects existing DESTINO and EVENTO alerts", () => {
  const existing = [
    { id: 1, tipo: "DESTINO", destino: "Valencia", activa: true },
    { id: 2, tipo: "EVENTO", eventoId: "UUID-ABC", activa: false },
  ];

  assert.equal(
    findDuplicateAlerta(existing, { tipo: "DESTINO", destino: "valencia" })?.id,
    1,
  );
  assert.equal(
    findDuplicateAlerta(existing, { tipo: "EVENTO", eventoId: "uuid-abc" })?.id,
    2,
  );
  assert.equal(
    findDuplicateAlerta(existing, { tipo: "DESTINO", destino: "Sevilla" }),
    null,
  );
});

test("getAlertaErrorMessage maps HTTP status codes to friendly Spanish copy", () => {
  assert.match(getAlertaErrorMessage({ status: 400, message: "" }), /no válidos/i);
  assert.match(getAlertaErrorMessage({ status: 401 }), /sesión ha expirado/i);
  assert.match(getAlertaErrorMessage({ status: 403 }), /permisos/i);
  assert.match(getAlertaErrorMessage({ status: 404 }), /no existe/i);
  assert.match(getAlertaErrorMessage({ status: 429 }), /demasiadas peticiones/i);
  assert.match(getAlertaErrorMessage({ status: 500 }), /no está disponible/i);
});

test("parseTripAlertNotificationData handles trip_alert_matched payloads and ignores others", () => {
  const valid = parseTripAlertNotificationData({
    type: "trip_alert_matched",
    tripId: 42,
    origin: "Madrid",
    destination: "Valencia",
    date: "15/11/2026",
    time: "18:30",
    price: "18 €",
    seats: 3,
    driverName: "Lucía",
  });

  assert.deepEqual(valid, {
    type: "trip_alert_matched",
    tripId: "42",
    origin: "Madrid",
    destination: "Valencia",
    date: "15/11/2026",
    time: "18:30",
    price: "18 €",
    seats: "3",
    driverName: "Lucía",
  });

  const nestedJson = parseTripAlertNotificationData(
    JSON.stringify({
      type: "trip.alert.matched",
      payload: JSON.stringify({ tripId: "uuid-trip-9", destination: "Sevilla" }),
    }),
  );
  assert.equal(nestedJson?.tripId, "uuid-trip-9");
  assert.equal(nestedJson?.destination, "Sevilla");

  assert.equal(
    parseTripAlertNotificationData({ type: "chat_message", tripId: "1" }),
    null,
  );
  assert.equal(
    parseTripAlertNotificationData({ type: "trip_alert_matched" }),
    null,
  );
});

test("createEventResolutionCache seeds catalog, fetches only missing IDs, and handles 404 fallback", async () => {
  const cache = createEventResolutionCache();
  cache.seed([{ id: "evt-1", name: "Hackathon YouConnext", start_date: "2026-11-15T09:00:00.000Z" }]);

  const calls = [];
  const snapshot = await cache.resolveMissing(
    ["evt-1", "evt-2", "evt-404"],
    async (id) => {
      calls.push(id);
      if (id === "evt-404") {
        throw new Error("Event not found");
      }
      return { event: { id, name: "Festival Verde", city: "Valencia" } };
    },
  );

  assert.deepEqual(calls, ["evt-2", "evt-404"]);
  assert.equal(snapshot["evt-1"].name, "Hackathon YouConnext");
  assert.equal(snapshot["evt-2"].name, "Festival Verde");
  assert.equal(snapshot["evt-404"].name, "Evento no disponible");
  assert.equal(snapshot["evt-404"].unavailable, true);

  // Second call should hit cache without refetching
  await cache.resolveMissing(["evt-1", "evt-2", "evt-404"], async (id) => {
    calls.push(`unexpected-${id}`);
    return null;
  });
  assert.equal(calls.length, 2);
});
