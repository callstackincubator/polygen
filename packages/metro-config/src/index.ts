/// <reference path="./wasm-loader.d.ts" preserve="true" />
import fs from 'node:fs';
import path from 'node:path';
import { Project } from '@callstack/polygen-project';
import type { ConfigT } from 'metro-config';
import type { CustomResolver } from 'metro-resolver';

interface PolygenConfig {
  addPolyfill?: boolean;
}

const OUTPUT_INFO = 'polygen-output.json';

function splitExternalPackages(name: string): [string, string] {
  const parts = name.split('/');
  if (name.startsWith('@')) {
    return [parts.slice(0, 2).join('/'), parts.slice(2).join('/')];
  }

  return [parts[0]!, parts.slice(1).join('/')];
}

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
      fs.readFileSync(project.paths.pathToOutput(OUTPUT_INFO), 'utf-8')
    ).externalPackages as Record<string, string>;

    let packageName = '';
    // Path to directory where the mock modules are located
    let mockModuleSubtreePath = project.paths.pathToOutput('modules');
    // Path in target module
    let pathInModule;
    // Resolved absolute path to WASM file
    let absoluteWasmPath = '';

    // External dependency
    if (!moduleName.startsWith('.')) {
      [packageName, pathInModule] = splitExternalPackages(moduleName);
      const resolvedPath = polygenModuleMapping[packageName];
      if (!resolvedPath) {
        throw new Error(
          `Attempting to import unknown external package '${packageName}'`
        );
      }
      mockModuleSubtreePath = project.paths.pathToOutput(
        'modules',
        packageName
      );
      absoluteWasmPath = project.paths.pathTo(resolvedPath, pathInModule);
    }
    // local dependency
    else {
      mockModuleSubtreePath = project.paths.pathToOutput('modules/#local');

      const requestingDirectory = path.dirname(context.originModulePath);
      pathInModule = project.paths.globalPathToLocal(
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
