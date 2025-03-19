import type { ResolvedModule } from '@callstack/polygen-project';
import type { Codegen } from './codegen.js';
import type { W2CGeneratedModule } from './codegen/modules.js';
import type { OutputGenerator } from './helpers/output-generator.js';

export interface ModuleGeneratedContext {
  codegen: Codegen;
  moduleOutput: OutputGenerator;
  context: W2CGeneratedModule;
  module: ResolvedModule;
}

export interface HostProjectGeneratedContext {
  codegen: Codegen;
  rootOutput: OutputGenerator;
  projectOutput: OutputGenerator;
  generatedModules: W2CGeneratedModule[];
}

/**
 * Plugin interface that allows to hook into the code generation process.
 */
export interface Plugin {
  name: string;
  title: string;

  moduleGenerated?(callContext: ModuleGeneratedContext): Promise<void>;
  hostProjectGenerated?(
    callContext: HostProjectGeneratedContext
  ): Promise<void>;
}
