import type { Codegen, W2CGeneratedModule } from '@callstack/polygen-codegen';
import type { PolygenModuleConfig, Project } from '@callstack/polygen-project';

export interface CodegenPlugin {
  name: string;
  definition: PluginDefinition;
}

export interface PluginCodegenHooks {
  beforeModulesGenerated?(codegen: Codegen): Promise<void> | void;
  moduleGenerated(
    codegen: Codegen,
    moduleConfig: PolygenModuleConfig,
    module: W2CGeneratedModule
  ): Promise<void> | void;
}

export interface PluginDefinition extends PluginCodegenHooks {
  projectDidLoad?(project: Project): void;
}

export function definePlugin(
  name: string,
  definition: PluginDefinition
): CodegenPlugin {
  return {
    name,
    definition,
  };
}
