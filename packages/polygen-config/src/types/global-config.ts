import type { PolygenModuleConfig } from './module-config';

export interface PolygenOutputConfig {
  /**
   * Path to output directory to store generated files.
   */
  directory?: string;

  /**
   * Whether to split generated source files into separate files.
   */
  enableCodegenFileSplit?: boolean;

  /**
   * How much function should be in a single file before splitting.
   */
  codegenFileSplitThreshold?: number;
}

export type ResolvedPolygenOutputConfig = Required<PolygenOutputConfig>;

export interface PolygenScanConfig {
  /**
   * List of patterns to scan for WebAssembly modules.
   */
  paths?: string[];
}

export type ResolvedPolygenScanConfig = Required<PolygenScanConfig>;

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
