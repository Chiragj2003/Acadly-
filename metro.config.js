const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Optimize Metro file watching and exclude non-source directories on Windows
config.resolver.blockList = [
  /.*[\/\\]\.git[\/\\].*/,
  /.*[\/\\]supabase[\/\\].*/,
  /.*[\/\\]docs[\/\\].*/,
  /.*[\/\\]\.agents[\/\\].*/,
];

module.exports = withNativeWind(config, { input: "./src/global.css" });
