// YouConnext - Movement Stream Service (SSE Client)
// Conexión unidireccional HTTP persistente para balance y movimientos en T+0 segundos
// Diseñado con cierre inteligente en segundo plano para ahorro de batería

import httpClient from "./httpClient";
import { getAuthToken } from "./tokenStorage";

class MovementStreamService {
  constructor() {
    this.xhr = null;
    this.abortController = null;
    this.listeners = new Set();
    this.reconnectTimeout = null;
    this.retryCount = 0;
    this.isExplicitlyClosed = true;
    this.isConnected = false;
    this.lastProcessedIndex = 0;
    this.currentEventType = "message";
  }

  /**
   * Inicia la conexión SSE con el backend si no está ya activa.
   */
  async connect() {
    this.isExplicitlyClosed = false;

    // Si ya hay una conexión abierta o conectándose, no duplicar
    if (this.isConnected || this.xhr) {
      return;
    }

    try {
      const token = httpClient.token || (await getAuthToken());
      if (!token) {
        if (typeof __DEV__ !== "undefined" && __DEV__) {
          console.log("[SSE] No hay token de autenticación disponible. Esperando inicio de sesión...");
        }
        return;
      }

      const streamUrl = `${httpClient.baseUrl}/api/payment/movements/stream`;
      this.lastProcessedIndex = 0;
      this.currentEventType = "message";

      if (typeof __DEV__ !== "undefined" && __DEV__) {
        console.log(`[SSE] Conectando a canal de movimientos en ${streamUrl}`);
      }

      // Implementación resiliente con XMLHttpRequest (soporte universal garantizado en React Native)
      const xhr = new XMLHttpRequest();
      this.xhr = xhr;

      xhr.open("GET", streamUrl, true);
      xhr.setRequestHeader("Accept", "text/event-stream");
      xhr.setRequestHeader("Cache-Control", "no-cache");
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      xhr.onreadystatechange = () => {
        if (this.xhr !== xhr) return;

        if (xhr.readyState === 2) {
          // Headers recibidos
          if (xhr.status >= 200 && xhr.status < 300) {
            this.isConnected = true;
            this.retryCount = 0;
            this.notifyListeners("connected", { status: "connected" });
          } else {
            console.warn(`[SSE] Conexión rechazada por el servidor con status ${xhr.status}`);
            this._handleDisconnect();
          }
        } else if (xhr.readyState === 3) {
          // Streaming de datos parciales
          this._processStreamChunks(xhr.responseText);
        } else if (xhr.readyState === 4) {
          // Conexión finalizada o interrumpida
          this._handleDisconnect();
        }
      };

      xhr.onerror = () => {
        if (this.xhr !== xhr) return;
        this.notifyListeners("error", { message: "Error de red en canal SSE" });
        this._handleDisconnect();
      };

      xhr.ontimeout = () => {
        if (this.xhr !== xhr) return;
        this._handleDisconnect();
      };

      xhr.send();
    } catch (err) {
      console.error("[SSE] Error al iniciar la conexión:", err);
      this._handleDisconnect();
    }
  }

  /**
   * Parsea los fragmentos de texto acumulados según la especificación SSE (RFC 8895).
   */
  _processStreamChunks(responseText) {
    if (!responseText) return;

    const newContent = responseText.substring(this.lastProcessedIndex);
    if (!newContent) return;

    const lines = newContent.split(/\r\n|\r|\n/);
    // Guardar el residuo no terminado para el siguiente chunk si la última línea no termina en newline
    const endsWithNewline = responseText.endsWith("\n") || responseText.endsWith("\r");
    const completeLines = endsWithNewline ? lines : lines.slice(0, -1);
    
    // Actualizar el índice procesado
    let processedLength = 0;
    for (let i = 0; i < completeLines.length; i++) {
      processedLength += completeLines[i].length + 1; // +1 por el caracter divisor
    }
    this.lastProcessedIndex += Math.min(processedLength, newContent.length);

    let eventType = this.currentEventType || "message";
    let dataBuffer = "";

    for (const rawLine of completeLines) {
      const line = rawLine.trim();

      // Línea vacía: fin de un evento SSE, emitir si hay datos acumulados
      if (line === "") {
        if (dataBuffer.length > 0) {
          this._dispatchEvent(eventType, dataBuffer);
          dataBuffer = "";
          eventType = "message";
          this.currentEventType = "message";
        }
        continue;
      }

      // Comentario SSE (ej. :ping para heartbeat cada 25s) -> Mantener vivo sin acción
      if (line.startsWith(":")) {
        continue;
      }

      if (line.startsWith("event:")) {
        eventType = line.substring(6).trim();
        this.currentEventType = eventType;
      } else if (line.startsWith("data:")) {
        const chunk = line.substring(5).trim();
        dataBuffer = dataBuffer ? `${dataBuffer}\n${chunk}` : chunk;
      }
    }

    if (dataBuffer.length > 0 && endsWithNewline) {
      this._dispatchEvent(eventType, dataBuffer);
      this.currentEventType = "message";
    }
  }

  /**
   * Despacha un evento tipado a los observadores registrados.
   */
  _dispatchEvent(eventType, dataString) {
    let parsedData = dataString;
    try {
      parsedData = JSON.parse(dataString);
    } catch {
      // Dejar como string crudo si no es JSON
    }

    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.log(`[SSE Event] ${eventType}:`, parsedData);
    }

    this.notifyListeners(eventType, parsedData);
  }

  /**
   * Gestiona la desconexión involuntaria y programa la reconexión con backoff exponencial.
   */
  _handleDisconnect() {
    this.isConnected = false;
    this.xhr = null;
    this.lastProcessedIndex = 0;

    if (this.isExplicitlyClosed) {
      return;
    }

    // Backoff exponencial: 1s, 2s, 4s, 8s, hasta un máximo de 30s
    const delay = Math.min(30000, 1000 * Math.pow(2, this.retryCount));
    this.retryCount++;

    clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      if (!this.isExplicitlyClosed) {
        this.connect();
      }
    }, delay);
  }

  /**
   * Cierra de forma inmediata y limpia el socket SSE.
   * Regla de Oro Móvil: Debe invocarse al perder foco o cuando la app pasa a segundo plano.
   */
  disconnect() {
    this.isExplicitlyClosed = true;
    this.isConnected = false;

    clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = null;

    if (this.xhr) {
      try {
        this.xhr.abort();
      } catch {}
      this.xhr = null;
    }

    this.lastProcessedIndex = 0;
    this.currentEventType = "message";

    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.log("[SSE] Conexión cerrada limpiamente (0 consumo en segundo plano)");
    }
  }

  /**
   * Suscribe una función para escuchar eventos SSE.
   * @param {function(type: string, data: any): void} callback
   * @returns {function(): void} Función para desuscribirse
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notifica a todos los suscriptores activos.
   */
  notifyListeners(type, payload) {
    for (const listener of this.listeners) {
      try {
        listener(type, payload);
      } catch (err) {
        console.error("[SSE] Error en callback de oyente:", err);
      }
    }
  }
}

export const movementStreamService = new MovementStreamService();
export default movementStreamService;
