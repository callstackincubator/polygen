/**
 * Wasm2c configuration for specific WebAssembly module.
 *
 * These options are found under the `wasm2c` key of the module configuration.
 */
export interface Wasm2CModuleConfig {
  /**
   * Name of the module to use in generated code.
   *
   * By default, name of the module is inferred from the file name, which can make it
   * ugly in some cases. If you want to use a different name, you can specify it here.
   *
   * This name is really only visible in the generated C code, so it's mostly a cosmetic,
   * unless you work with this module stacktrace.
   */
  moduleName?: string;
}

/**
 * Common configuration for all modules.
 */
export interface PolygenModuleCommonConfig {
  /**
   * Wasm2c related configuration for this module.
   */
  wasm2c?: Wasm2CModuleConfig;

  // TODO: WebAssembly feature configuration
}

export interface PolygenLocalModuleConfig extends PolygenModuleCommonConfig {
  kind: 'local';

  /**
   * Path to the WebAssembly module.
   */
  path: string;
}

export interface PolygenExternalModuleConfig extends PolygenModuleCommonConfig {
  kind: 'external';

  /**
   * Name of the module.
   */
  packageName: string;

  /**
   * Path to the WebAssembly module.
   */
  path: string;
}

export type PolygenModuleConfig =
  | PolygenLocalModuleConfig
  | PolygenExternalModuleConfig;
