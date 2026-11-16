// YouConnext - Shared Event Resolution Cache for Alertas de Trayectos
import { eventService } from "./eventService";
import { createEventResolutionCache } from "../utils/eventResolutionCache";

const cacheInstance = createEventResolutionCache();

export const eventCache = {
  seedEventsCache(eventsList) {
    cacheInstance.seed(eventsList);
  },
  getCachedEvent(id) {
    return cacheInstance.get(id);
  },
  getSnapshot() {
    return cacheInstance.getSnapshot();
  },
  async resolveEventsByIds(ids) {
    return cacheInstance.resolveMissing(ids, (id) =>
      eventService.getEventById(id),
    );
  },
  clearEventCache() {
    cacheInstance.clear();
  },
};

export default eventCache;
