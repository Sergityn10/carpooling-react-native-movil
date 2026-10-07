# Algoritmos y Rendimiento - Índice Espacial y Optimizaciones

## 1. Estructura de Datos: R-Tree 2D en Memoria (`SpatialIndex`)

### 1.1 Implementación Actual
Ubicación: `app/services/routing/spatial-index.js`

- **Tipo:** R-Tree balanceado con nodos hoja e internos.
- **Entrada indexada:** Segmento vial individual (`Tramo[i] → Tramo[i+1]`).
- **Bounding Box por entrada:** `[minLng, minLat, maxLng, maxLat]` (enveloppe convexo del segmento).
- **Orden del árbol:** `maxEntries = 9` (configurable).
- **Datos adjuntos por entrada:**
  ```javascript
  {
    trayectoId: string,
    stepOrder: number,
    start: { lat, lng, address },
    end: { lat, lng, address },
    segDistKm: number,
    cumDistanceKm: number,
    metadata: { fecha, hora, plazas, disponible, precio, conductor, evento_id }
  }
  ```

### 1.2 Complejidad Algorítmica

| Operación | Complejidad | Notas |
|-----------|-------------|-------|
| Inserción bulk (inicialización) | O(N log N) | N = total segmentos |
| Inserción individual | O(log N) | Rebalanceo por splits |
| Eliminación | O(N) *actual* | Reconstrucción completa del árbol |
| Búsqueda BBox | **O(log N + K)** | K = resultados que intersectan |
| Búsqueda radio (punto + radio) | O(log N + K) | Usa BBox + proyección ortogonal |

> **Nota:** La eliminación actual reconstruye el árbol completo. Para alta frecuencia de cancelaciones, considerar *lazy deletion* + rebuild periódico.

---

## 2. Estrategia de Niveles de Detalle (LOD - Level of Detail)

| Zoom | precision | Geometría devuelta | Caso de uso |
|------|-----------|-------------------|-------------|
| 1-9 | `bounds` | Solo `{origen: {lat,lng}, destino: {lat,lng}}` | Vista país/región, clustering visual |
| 10-14 | `simplified` | Polilínea simplificada (Ramer-Douglas-Peucker ε ≈ 50-200m) | Vista ciudad/comarca |
| 15-18 | `full` | Todos los tramos originales (`Tramos` ordenados) | Vista calle/barrio, detalle exacto |
| 19+ | `full` | Tramos + puntos de recogida intermedios | Navegación precisa |

### 2.1 Simplificación Ramer-Douglas-Peucker (RDP)
- **Objetivo:** Reducir número de puntos manteniendo forma visual.
- **Implementación sugerida:** Librería `simplify-js` o implementación propia O(N log N).
- **Parámetro ε (tolerancia):** Función del zoom:
  - Zoom 10: ε = 200m
  - Zoom 12: ε = 50m
  - Zoom 14: ε = 15m

---

## 3. Clustering Espacial (Zoom Bajo)

### 3.1 Grid-based Binning (Recomendado para backend)
- Dividir viewport en celdas de ~0.01° (~1 km en latitud media).
- Contar trayectos únicos por celda (usando `origen_lat/lng` o centroide).
- Devolver: `{ clusterId, count, centerLat, centerLng, bounds }`.

### 3.2 Supercluster (Frontend)
- Enviar puntos individuales (origen/destino) al cliente.
- Usar `supercluster` (Mapbox) en el navegador para clustering dinámico.
- Ventaja: cero carga en backend, clustering fluido al hacer zoom.

---

## 4. Benchmarks y Límites Operativos

### 4.1 Consumo de Memoria (Estimación Node.js v20+)

| Trayectos Activos | Tramos Totales | RAM SpatialIndex | RAM Total Proceso |
|-------------------|----------------|------------------|-------------------|
| 1.000 | ~8.000 | ~3 MB | ~85 MB |
| 10.000 | ~80.000 | ~25 MB | ~140 MB |
| 50.000 | ~400.000 | ~120 MB | ~300 MB |
| 100.000 | ~800.000 | ~240 MB | ~500 MB |

> **Recomendación:** Para >50k trayectos concurrentes, migrar a **PostgreSQL + PostGIS** (índice GiST) o **Redis + RediSearch** y desactivar índice en memoria.

### 4.2 Latencia Objetivo (P95)

| Escenario | Latencia Esperada |
|-----------|-------------------|
| Búsqueda BBox (memoria) | 1-5 ms |
| Enriquecimiento DB (50 trayectos) | 15-40 ms |
| Serialización JSON + compresión | 5-15 ms |
| **Total End-to-End** | **< 100 ms** |

---

## 5. Sincronización Reactiva del Índice

### 5.1 Eventos que modifican el índice
| Evento | Acción | Origen |
|--------|--------|--------|
| Trayecto creado (status `programado`) | `globalSpatialIndex.addTrayecto()` | Controller POST `/api/trayecto` |
| Trayecto actualizado (tramos/horario) | `removeTrayecto()` + `addTrayecto()` | Controller PUT `/api/trayecto/:id` |
| Trayecto cancelado/finalizado | `globalSpatialIndex.removeTrayecto()` | Cron job / Controller PATCH status |
| Inicio servidor | `RoutingEngine.initialize(prisma)` | `app/index.js` startup |

### 5.2 Consistencia Eventual
- El índice en memoria es **eventualmente consistente** con la BD.
- Ventana de inconsistencia: milisegundos (event loop同步).
- Para consistencia fuerte en operaciones críticas, validar existencia en BD antes de reservar.

---

## 6. Optimizaciones Futuras (Roadmap)

1. **Lazy Deletion + Rebuild Batch:** Marcar entradas como eliminadas y reconstruir árbol cada N eliminaciones o cada T minutos.
2. **Sharding por Región:** Múltiples R-Trees por bounding box macro (ej. por comunidad autónoma).
3. **Persistencia del Índice:** Serializar R-Tree a disco (MessagePack/Protobuf) para warm-start instantáneo tras reinicio.
4. **PostGIS Migration:** Cuando el volumen supere 50k trayectos activos concurrentes.