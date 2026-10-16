const { withAppBuildGradle } = require("@expo/config-plugins");

/**
 * Expo Config Plugin para habilitar la firma de release en android/app/build.gradle
 * Permite que gradle use las propiedades MYAPP_UPLOAD_* para firmar con el keystore de subida.
 */
function withAndroidSigning(config) {
  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    if (!contents.includes("MYAPP_UPLOAD_STORE_FILE")) {
      const releaseSigningConfig = `
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }`;

      // Insertar release dentro de signingConfigs { ... }
      contents = contents.replace(
        /(signingConfigs\s*\{[\s\S]*?debug\s*\{[\s\S]*?\})/,
        `$1${releaseSigningConfig}`
      );

      // Apuntar buildTypes.release a signingConfigs.release cuando esté presente
      contents = contents.replace(
        /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig\s+signingConfigs\.debug/,
        `$1signingConfig project.hasProperty('MYAPP_UPLOAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug`
      );

      config.modResults.contents = contents;
    }

    return config;
  });
}

module.exports = withAndroidSigning;
