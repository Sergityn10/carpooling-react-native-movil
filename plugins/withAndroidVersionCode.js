/**
 * Expo Config Plugin para sobrescribir android.versionCode desde la variable
 * de entorno ANDROID_VERSION_CODE (por ejemplo, en GitHub Actions).
 * Si la variable no está definida, conserva el valor configurado en app.json.
 */
const MAX_ANDROID_VERSION_CODE = 2100000000;

function withAndroidVersionCode(config) {
  const rawVersionCode = process.env.ANDROID_VERSION_CODE?.trim();
  if (!rawVersionCode) {
    return config;
  }

  if (!/^\d+$/.test(rawVersionCode)) {
    throw new Error(
      `[withAndroidVersionCode] ANDROID_VERSION_CODE debe ser un entero positivo válido, recibido: "${rawVersionCode}"`
    );
  }

  const versionCode = Number.parseInt(rawVersionCode, 10);
  if (versionCode < 1 || versionCode > MAX_ANDROID_VERSION_CODE) {
    throw new Error(
      `[withAndroidVersionCode] ANDROID_VERSION_CODE fuera de rango (1-${MAX_ANDROID_VERSION_CODE}): ${versionCode}`
    );
  }

  return {
    ...config,
    android: {
      ...config.android,
      versionCode,
    },
  };
}

module.exports = withAndroidVersionCode;
