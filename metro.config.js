const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'ttf', 'otf', 'woff', 'woff2'],
    sourceExts: ['js', 'jsx', 'json', 'ts', 'tsx', 'svg'],
    platforms: ['ios', 'android', 'native', 'web'],
  },
  watchFolders: [
    path.resolve(__dirname, 'node_modules'),
  ],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);