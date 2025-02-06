import {
  FileExternallyChangedError,
  FileOverwriteError,
  W2CGenerator,
  type W2CGeneratorOptions,
  W2CSharedContext,
} from '@callstack/polygen-codegen';
import { Project } from '@callstack/polygen-project';
import type { ModuleSymbol } from '@callstack/wasm-parser';
import chalk from 'chalk';
import { Command, Option } from 'commander';
import consola from 'consola';
import { oraPromise } from 'ora';

const command = new Command('generate')
  .description('Generates React Native Modules from Wasm')
  .addOption(
    new Option('-o, --output-dir <outputDir>', 'Path to output directory')
  )
  .addOption(new Option('-f, --force', 'Generate code even if not outdated'));

interface Options {
  outputDir?: string;
  force?: boolean;
}

command.action(async (options: Options) => {
  const project = await Project.findClosest();
  if (options.outputDir) {
    consola.info(`Using ${chalk.dim(options.outputDir)} as output directory`);
    project.updateOptionsInMemory({ output: { directory: options.outputDir } });
  }

  if (options.force) {
    consola.warn('Using force overwrite flag, all files will be overwritten');
  }

  const generatorOptions: W2CGeneratorOptions = {
    outputDirectory: project.fullOutputDirectory,
    singleProject: true,
    generateMetadata: true,
    forceGenerate: options.force ?? false,
  };
  const generator = await W2CGenerator.create(project, generatorOptions);
  const allModules = project.webAssemblyModules;

  consola.info(
    'Generating code for',
    chalk.bold(allModules.length),
    'WebAssembly module(s)'
  );

  try {
    for (const mod of allModules) {
      const generatedModule = await oraPromise(
        async () => generator.generateModule(mod),
        `Processing ${mod.kind} module ${chalk.bold(mod.path)}`
      );

      const imports = generatedModule.codegen.imports;
      const exports = generatedModule.codegen.exports;
      const hglt = chalk.dim;

      function statsOf(set: ModuleSymbol[]): string {
        const highlight = chalk.dim;
        const grouped = Object.groupBy(set, (s) => s.kind);
        const countOf = (type: ModuleSymbol['kind']) =>
          grouped[type]?.length ?? 0;
        return [
          `${highlight(countOf('function'))} functions`,
          `${highlight(countOf('memory'))} memories`,
          `${highlight(countOf('global'))} globals`,
          `${highlight(countOf('table'))} tables`,
        ].join(', ');
      }

      consola.info(
        `  Found ${hglt(imports.length)} imports (${statsOf(imports.map((i) => i.target))})`
      );
      consola.info(
        `  Found ${hglt(exports.length)} exports (${statsOf(exports.map((i) => i.target))})`
      );
    }

    const sharedContext = new W2CSharedContext(generator.generatedModules);
    await generator.generateHostModule(sharedContext);
    consola.success('Generated host module');

    const generateImportsPromises = sharedContext.importedModules.map(
      async (mod) => {
        await generator.generateImportedModule(mod);
        consola.success(`Generated import ${chalk.magenta(mod.name)} bridge`);
      }
    );

    await Promise.allSettled(generateImportsPromises);
    await generator.finalize();

    consola.info(
      `Run ${chalk.bold('pod install')} to regenerate XCode project and make sure new source files are included`
    );
  } catch (error: unknown) {
    if (error instanceof FileExternallyChangedError) {
      consola.error(
        `File ${chalk.magenta(error.path)} has been changed externally`
      );
      consola.info(
        `Use ${chalk.bold('-f')} flag to force generate and overwrite files`
      );
    } else if (error instanceof FileOverwriteError) {
      consola.error(
        `File ${chalk.magenta(error.path)} already exists and would be overwritten`
      );
      consola.info(
        `Use ${chalk.bold('-f')} flag to force generate and overwrite files`
      );
    } else {
      consola.error('Error generating modules:', error);
    }
  }
});

export default command;
