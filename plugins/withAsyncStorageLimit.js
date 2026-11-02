const { withGradleProperties } = require("@expo/config-plugins");

/**
 * Expo Config Plugin para aumentar el tamaño máximo de la base de datos de AsyncStorage en Android.
 * Por defecto SQLite tiene un límite de 6 MB en Android que provoca errores SQLITE_FULL.
 * Este plugin configura AsyncStorage_db_size_in_MB a 50 MB (o el valor especificado).
 */
function withAsyncStorageLimit(config, options = {}) {
  const sizeInMB = options.sizeInMB || 50;

  return withGradleProperties(config, (config) => {
    const existingIndex = config.modResults.findIndex(
      (item) => item.type === "property" && item.key === "AsyncStorage_db_size_in_MB"
    );

    if (existingIndex !== -1) {
      config.modResults[existingIndex].value = String(sizeInMB);
    } else {
      config.modResults.push({
        type: "property",
        key: "AsyncStorage_db_size_in_MB",
        value: String(sizeInMB),
      });
    }

    return config;
  });
}

module.exports = withAsyncStorageLimit;
