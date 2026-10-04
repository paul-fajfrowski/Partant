const { getDefaultConfig } = require('expo/metro-config');
const { createHash } = require('node:crypto');
const config = getDefaultConfig(__dirname);
// Expo inlines public variables. Separate cached transforms when switching between
// the local demonstration and connected release (including Xcode export:embed).
const publicEnvironment = Object.entries(process.env)
  .filter(([key]) => key.startsWith('EXPO_PUBLIC_'))
  .sort(([a], [b]) => a.localeCompare(b));
const fingerprint = createHash('sha256').update(JSON.stringify(publicEnvironment)).digest('hex');
config.cacheVersion = `${config.cacheVersion || '1'}-partant-${fingerprint}`;
module.exports = config;
