import { type ConfigT } from 'metro-config';
import type { CustomResolver } from 'metro-resolver';
import path from 'node:path';
import fs from 'node:fs';
import { Project } from '@callstack/polygen-core-build';

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export function getPolygenMetroConfig(): DeepPartial<ConfigT> {
  const project = Project.findClosestSync();

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

  return {
    resolver: {
      resolveRequest,
      // sourceExts: ['ts', 'tsx', 'js', 'jsx', 'json', 'wasm'],
    },
  };
}
