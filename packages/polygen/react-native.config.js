/**
 * @type {import('@react-native-community/cli-types').UserDependencyConfig}
 */
module.exports = {
  resolver: {
    unstable_enablePackageExports: true,
  },
  dependency: {
    platforms: {
      android: {
        cmakeListsPath: 'build/generated/source/polygen/jni/CMakeLists.txt',
      },
      ios: {
        scriptPhases: [
          {
            name: '[Polygen] Generate Codegen Artifacts',
            execution_position: 'before_compile',
            script: './scripts/regenerate.sh',
          },
        ],
      },
    },
  },
};
