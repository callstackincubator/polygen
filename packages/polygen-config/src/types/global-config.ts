import { PolygenModuleConfig } from './module-config';

export interface PolygenOutputConfig {
  /**
   * Path to output directory to store generated files.
   */
  directory?: string;
}

export interface ResolvedPolygenOutputConfig extends PolygenOutputConfig {
  directory: string;
}

export interface PolygenScanConfig {
  /**
   * List of patterns to scan for WebAssembly modules.
   */
  paths?: string[];
}

export interface ResolvedPolygenScanConfig {
  paths: string[];
}

/**
 * Interface for global Polygen configuration.
 */
export interface PolygenConfig {
  /**
   * Configuration for Polygen output
   */
  output?: PolygenOutputConfig;

  /**
   * Configuration for scanning for WebAssembly modules.
   */
  scan?: PolygenScanConfig;

  /**
   * List of modules to use.
   */
  modules: PolygenModuleConfig[];
}

export interface ResolvedPolygenConfig extends PolygenConfig {
  output: ResolvedPolygenOutputConfig;
  scan: ResolvedPolygenScanConfig;
}

export function polygenConfig(config: PolygenConfig): ResolvedPolygenConfig {
  const { output = {}, scan = {} } = config;

  const resolvedOutput: ResolvedPolygenOutputConfig = {
    ...output,
    directory: output.directory ?? 'node_modules/.polygen-out',
  };

  const resolvedScan: ResolvedPolygenScanConfig = {
    ...scan,
    paths: scan.paths ?? ['src/**/*.wasm'],
  };

  // Filter module list for undefined values
  //
  // This is mostly to filter out `AUTO_INSERT_PLACEHOLDER` in the list,
  // which is used only as a marker
  const modules = config.modules.filter(Boolean);

  return {
    ...config,
    output: resolvedOutput,
    scan: resolvedScan,
    modules,
  };
}
