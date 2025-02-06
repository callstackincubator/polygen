import * as console from 'node:console';
/// <reference path="./wasm-loader.d.ts" preserve="true" />
import fs from 'node:fs';
import path from 'node:path';
import { Project } from '@callstack/polygen-project';
import { type ConfigT } from 'metro-config';
import type { CustomResolver } from 'metro-resolver';

interface PolygenConfig {
  addPolyfill?: boolean;
}

const OUTPUT_INFO = 'polygen-output.json';

export function withPolygenConfig(
  defaultConfig: ConfigT,
  _polygenConfig: PolygenConfig = {}
): ConfigT {
  const project = Project.findClosestSync();

  const resolveRequest: CustomResolver = (context, moduleName, platform) => {
    // If not a WASM module, skip
    if (!moduleName.endsWith('.wasm')) {
      return context.resolveRequest(context!, moduleName, platform);
    }

    // Load polygen-output.json to get the mapping of resolved external packages
    const polygenModuleMapping = JSON.parse(
      fs.readFileSync(project.pathToOutput(OUTPUT_INFO), 'utf-8')
    ).externalPackages as Record<string, string>;

    // Path to directory where the mock modules are located
    let mockModuleSubtreePath = project.pathToOutput('modules');
    // Path in target module
    let pathInModule = '';
    // Resolved absolute path to WASM file
    let absoluteWasmPath = '';

    // External dependency
    if (!moduleName.startsWith('.')) {
      const parts = moduleName.split('/');
      const packageName = parts[0]!;
      pathInModule = parts.slice(1).join('/');
      const resolvedPath = polygenModuleMapping[packageName];
      if (!resolvedPath) {
        throw new Error(
          `Attempting to import unknown external package '${packageName}'`
        );
      }
      mockModuleSubtreePath = project.pathToOutput('modules', packageName);
      absoluteWasmPath = project.pathTo(resolvedPath, pathInModule);
    }
    // local dependency
    else {
      mockModuleSubtreePath = project.pathToOutput('modules/#local');

      const requestingDirectory = path.dirname(context.originModulePath);
      pathInModule = project.globalPathToLocal(
        path.join(requestingDirectory, moduleName)
      );
      absoluteWasmPath = path.join(project.projectRoot, pathInModule);
    }

    if (!fs.existsSync(absoluteWasmPath)) {
      throw new Error(
        `WebAssembly module '${moduleName}' from ${context.originModulePath} does not exist.`
      );
    }

    const localJSPath = pathInModule.replace(/\.wasm$/, '.js');
    const mockModulePath = path.join(mockModuleSubtreePath, localJSPath);
    if (!mockModulePath || !fs.existsSync(mockModulePath)) {
      throw new Error(
        `Attempting to import unknown WASM module '${moduleName}' from ${context.originModulePath}.\n Did you forget to run \`polygen generate\`?`
      );
    }

    return { type: 'sourceFile', filePath: mockModulePath };
  };

  return {
    ...defaultConfig,
    resolver: {
      ...defaultConfig.resolver,
      unstable_enablePackageExports: true,
      resolveRequest,
    },
  };
}
