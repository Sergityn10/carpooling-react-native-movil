const {
  withProjectBuildGradle,
  withAppBuildGradle,
  withDangerousMod,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const GOOGLE_SERVICES_VERSION = "4.4.2";

function withGoogleServicesFile(config) {
  config = withProjectBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;
    if (!buildGradle.includes("com.google.gms:google-services")) {
      config.modResults.contents = buildGradle.replace(
        /dependencies\s*\{/,
        `dependencies {\n    classpath('com.google.gms:google-services:${GOOGLE_SERVICES_VERSION}')`,
      );
    }
    return config;
  });

  config = withAppBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;
    if (!buildGradle.includes("com.google.gms.google-services")) {
      config.modResults.contents = buildGradle.replace(
        'apply plugin: "com.facebook.react"',
        'apply plugin: "com.facebook.react"\napply plugin: "com.google.gms.google-services"',
      );
    }
    return config;
  });

  config = withDangerousMod(config, [
    "android",
    async (config) => {
      const sourcePath = path.resolve(
        config.modRequest.projectRoot,
        "google-services.json",
      );
      const destPath = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "google-services.json",
      );
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
      } else {
        const envContent = process.env.GOOGLE_SERVICES_JSON;
        if (envContent) {
          const decoded = Buffer.from(envContent, "base64").toString("utf-8");
          fs.writeFileSync(destPath, decoded);
        } else {
          throw new Error(
            "google-services.json not found. Either commit the file or set the GOOGLE_SERVICES_JSON EAS file environment variable.",
          );
        }
      }
      return config;
    },
  ]);

  return config;
}

module.exports = withGoogleServicesFile;
