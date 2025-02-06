import type {
  PolygenExternalModuleConfig,
  PolygenLocalModuleConfig,
  PolygenModuleCommonConfig,
} from './types/module-config';

/**
 * Helper function to create a local module configuration.
 *
 * @param path Path to the WebAssembly module, relative to this project.
 * @param options Additional options for this module.
 *
 * @see PolygenLocalModuleConfig
 * @see PolygenModuleCommonConfig
 */
export function localModule(
  path: string,
  options: PolygenModuleCommonConfig = {}
): PolygenLocalModuleConfig {
  return {
    kind: 'local',
    path,
    ...options,
  };
}

export function externalModule(
  packageName: string,
  path: string,
  options: PolygenModuleCommonConfig = {}
): PolygenExternalModuleConfig {
  return {
    kind: 'external',
    packageName,
    path,
    ...options,
  };
}
