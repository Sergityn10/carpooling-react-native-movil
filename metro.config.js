// YouConnext - Metro Config
// Fixes socket.io-client / engine.io-client ESM build importing .node.js files
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.endsWith(".node.js")) {
    const fixedName = moduleName.replace(/\.node\.js$/, ".js");
    return context.resolveRequest(context, fixedName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
