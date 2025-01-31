/**
 * @type {import('@react-native-community/cli-types').UserDependencyConfig}
 */
module.exports = {
  dependency: {
    platforms: {
      android: {
        cmakeListsPath: 'build/generated/source/polygen/jni/CMakeLists.txt',
      },
      ios: {},
    },
  },
};
