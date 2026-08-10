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
      const projectRoot = config.modRequest.projectRoot;
      const possiblePaths = [
        sourcePath,
        path.resolve(projectRoot, "GOOGLE_SERVICES_JSON"),
        path.resolve(projectRoot, "..", "GOOGLE_SERVICES_JSON"),
        path.resolve(projectRoot, "..", "..", "GOOGLE_SERVICES_JSON"),
      ];
      let found = false;
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          console.log(`[withGoogleServicesFile] Found file at: ${p}`);
          fs.copyFileSync(p, destPath);
          found = true;
          break;
        }
      }
      if (!found && process.env.GOOGLE_SERVICES_JSON) {
        console.log(
          "[withGoogleServicesFile] Using process.env.GOOGLE_SERVICES_JSON",
        );
        fs.writeFileSync(destPath, process.env.GOOGLE_SERVICES_JSON);
        found = true;
      }
      if (!found) {
        console.error("[withGoogleServicesFile] Searched paths:");
        possiblePaths.forEach((p) =>
          console.error(`  - ${p} (exists: ${fs.existsSync(p)})`),
        );
        throw new Error(
          "google-services.json not found. Either commit the file or set the GOOGLE_SERVICES_JSON EAS file environment variable.",
        );
      }
      return config;
    },
  ]);

  return config;
}

module.exports = withGoogleServicesFile;
