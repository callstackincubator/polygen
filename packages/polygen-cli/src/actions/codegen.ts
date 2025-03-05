import {
  Codegen,
  type CodegenOptions,
  type GeneratedSymbol,
  type PluginDispatchOptions,
  type W2CGeneratedModule,
} from '@callstack/polygen-codegen';
import type { GeneratedEntityKind } from '@callstack/polygen-codegen';
import { Project, type ResolvedModule } from '@callstack/polygen-project';
import chalk from 'chalk';
import consola from 'consola';
import { oraPromise } from 'ora';

export interface GenerateOptions {
  outputDir?: string;
  force?: boolean;
}

function printCodegenStats(generatedModule: W2CGeneratedModule) {
  const hglt = chalk.dim;
  const { imports, exports } = generatedModule;

  function statsOf(set: GeneratedSymbol[]): string {
    const highlight = chalk.dim;
    const grouped = Object.groupBy(
      set,
      (s) => s.target.kind as GeneratedEntityKind
    );
    const countOf = (type: GeneratedEntityKind) => grouped[type]?.length ?? 0;
    return [
      `${highlight(countOf('function'))} functions`,
      `${highlight(countOf('memory'))} memories`,
      `${highlight(countOf('global'))} globals`,
      `${highlight(countOf('table'))} tables`,
    ].join(', ');
  }

  consola.info(`  Found ${hglt(imports.length)} imports (${statsOf(imports)})`);
  consola.info(`  Found ${hglt(exports.length)} exports (${statsOf(exports)})`);
}

/**
 * Generates code for a single module.
 *
 * @param generator
 * @param moduleMeta
 */
export async function generateModule(
  generator: Codegen,
  moduleMeta: ResolvedModule
): Promise<W2CGeneratedModule> {
  const pluginOptions: PluginDispatchOptions = {
    beforePluginDispatch: (plugin) => {
      consola.debug(`Executing plugin ${chalk.bold(plugin.title)}`);
    },
    afterPluginDispatch: (plugin) => {},
  };
  const [generatedModule, imports] = await oraPromise(
    async () => generator.generateModule(moduleMeta, pluginOptions),
    `Processing ${moduleMeta.kind} module ${chalk.bold(moduleMeta.path)}`
  );

  printCodegenStats(generatedModule);

  return generatedModule;
}

/**
 * Generate command logic.
 *
 * Generates code for all defined modules for a project.
 * If project is not passed, closest project is found.
 *
 * @note Extracted as a function so that it can be called from other commands.
 *
 * @param options Generate options
 * @param project Optionally loaded project
 */
export async function generate(options: GenerateOptions, project?: Project) {
  project ??= await Project.findClosest();

  const generatorOptions: CodegenOptions = {
    outputDirectory: project.paths.fullOutputDirectory,
    singleProject: true,
    generateMetadata: true,
    forceGenerate: options.force ?? false,
  };
  const codegen = await Codegen.create(project, generatorOptions);
  const allModules = project.modules.webAssemblyModules;

  consola.info(
    'Generating code for',
    chalk.bold(allModules.length),
    'WebAssembly module(s)'
  );

  for (const mod of allModules) {
    const resolvedModule = await project.modules.resolvePolygenModule(mod);
    await generateModule(codegen, resolvedModule);
  }

  await codegen.generateHostModule();
  consola.success('Generated host module');

  const generateImportsPromises = codegen.context.importedModules
    .values()
    .map(async (mod) => {
      await codegen.generateImportedModule(mod);
      consola.success(`Generated import ${chalk.magenta(mod.name)} bridge`);
    });

  await Promise.allSettled(generateImportsPromises);
  await codegen.finalize();

  consola.info(
    `Run ${chalk.bold('pod install')} to regenerate XCode project and make sure new source files are included`
  );
}
