import { type ConfigT } from 'metro-config';
import type { CustomResolver } from 'metro-resolver';
import path from 'node:path';
import fs from 'node:fs';
import { Project } from '@callstack/polygen-core-build';

interface PolygenConfig {
  addPolyfill?: boolean;
}

export function withPolygenConfig(
  defaultConfig: ConfigT,
  _polygenConfig: PolygenConfig = {}
): ConfigT {
  const project = Project.findClosestSync();
  // const addPolyfill = polygenConfig.addPolyfill ?? true;

  const resolveRequest: CustomResolver = (context, moduleName, platform) => {
    // If not a WASM module, skip
    if (!moduleName.endsWith('.wasm')) {
      return context.resolveRequest(context!, moduleName, platform);
    }

    // Relative path
    if (moduleName.startsWith('.')) {
      const cleanName = path.basename(moduleName, '.wasm');
      const callerDir = path.normalize(path.dirname(context.originModulePath));
      const pathToWasmModule = path.join(callerDir, moduleName);

      if (!fs.existsSync(pathToWasmModule)) {
        throw new Error(
          `WebAssembly module '${moduleName}' from ${context.originModulePath} does not exist.`
        );
      }

      const pathInSource = project.globalPathToLocal(
        path.join(callerDir, path.dirname(moduleName)),
        project.localSourceDir
      );
      const mockModulePath = project.pathToOutput(
        'modules',
        pathInSource,
        cleanName + '.js'
      );

      if (!fs.existsSync(mockModulePath)) {
        throw new Error(
          `Attempting to import unknown WASM module '${moduleName}' from ${context.originModulePath}.\n Did you forget to run \`polygen generate\`?`
        );
      }

      return { type: 'sourceFile', filePath: mockModulePath };
    } else {
      throw new Error('Global WASM imports are not supported yet.');
    }
  };

  // function getPolyfills(options: { platform: string | null }): readonly string[] {
  //   return [
  //     ...defaultConfig.serializer.getPolyfills(options),
  //     fileURLToPath(import.meta.resolve('@callstack/polygen/polyfill')),
  //   ];
  // }
  //
  // const serializerOverrides: Partial<ConfigT['serializer']> = {
  //   getPolyfills: addPolyfill
  //     ? getPolyfills
  //     : defaultConfig.serializer.getPolyfills,
  // };
  // console.log('getPolyfills', serializerOverrides?.getPolyfills?.({platform: 'ios'}));

  return {
    ...defaultConfig,
    resolver: {
      ...defaultConfig.resolver,
      unstable_enablePackageExports: true,
      resolveRequest,
      // sourceExts: ['ts', 'tsx', 'js', 'jsx', 'json', 'wasm'],
    },
    // serializer: {
    //   ...defaultConfig.serializer,
    //   ...serializerOverrides,
    // },
  };
}
