const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { getPolygenMetroConfig } = require('@callstack/polygen-metro-config');

const root = path.resolve(__dirname, '..', '..');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // unstable_enablePackageExports: true,
  },
  watchFolders: [root],
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

module.exports = mergeConfig(
  getDefaultConfig(__dirname),
  getPolygenMetroConfig(),
  config
);
