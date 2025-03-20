import type {
  PolygenConfig,
  ResolvedPolygenConfig,
  ResolvedPolygenOutputConfig,
  ResolvedPolygenScanConfig,
} from './types/global-config';

export * from './types/global-config';
export * from './types/module-config';
export * from './helpers';
export const AUTO_INSERT_PLACEHOLDER = undefined;

export function polygenConfig(config: PolygenConfig): ResolvedPolygenConfig {
  const { output = {}, scan = {} } = config;

  if (!output.enableCodegenFileSplit && output.codegenFileSplitThreshold) {
    console.warn(
      'codegenFileSplitThreshold is set but enableCodegenFileSplit is not enabled'
    );
  }

  const resolvedOutput: ResolvedPolygenOutputConfig = {
    ...output,
    directory: output.directory ?? 'node_modules/.polygen-out',
    enableCodegenFileSplit: output.enableCodegenFileSplit ?? true,
    codegenFileSplitThreshold: 100,
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
