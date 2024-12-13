#!/usr/bin/env node
import { Command, Option } from 'commander';
import consola from 'consola';
import { oraPromise } from 'ora';
import chalk from 'chalk';
import { Project } from '@callstack/polygen-core-build';
import {
  type W2CGeneratorOptions,
  W2CModuleContext,
  W2CSharedContext,
  generateModule,
  generateHostModule,
  generateWasmJSModule,
} from '@callstack/polygen-codegen/w2c';
import type { ModuleSymbol } from '@callstack/wasm-parser';

const command = new Command('generate')
  .description('Generates React Native Modules from Wasm')
  .addOption(
    new Option('-o, --output-dir <outputDir>', 'Path to output directory')
  )
  .addOption(new Option('-f, --force', 'Generate code even if not outdated'))
  .addOption(
    new Option(
      '--force-number-coercion',
      'Force number coercion in module exports'
    )
  );

interface Options {
  outputDir?: string;
  force?: boolean;
  forceNumberCoercion?: boolean;
}

command.action(async (options: Options) => {
  const project = await Project.findClosest();
  if (options.outputDir) {
    consola.info(`Using ${chalk.dim(options.outputDir)} as output directory`);
    project.updateOptionsInMemory({ outputDirectory: options.outputDir });
  }

  const generatorOptions: W2CGeneratorOptions = {
    outputDirectory: project.fullOutputDirectory,
    singleProject: true,
    generateMetadata: true,
    forceGenerate: options.force ?? false,
    hackAutoNumberCoerce: options.forceNumberCoercion ?? false,
  };

  const modules = await project.getWebAssemblyModules();
  // const pathToRuntimeHeader = path.join(ASSETS_DIR, 'wasm-rt-weak.h');

  consola.info('Found', chalk.bold(modules.length), 'WebAssembly module(s)');
  const generatedModules: W2CModuleContext[] = [];

  for (const mod of modules) {
    const modPath = project.pathToSource(mod);

    const generatedModule = await oraPromise(
      async () => {
        const result = await generateModule(modPath, generatorOptions);
        await generateWasmJSModule(project, modPath);
        generatedModules.push(result);
        return result;
      },
      `Processing ${chalk.magenta(mod)} module`
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

    // const buildFile = await engine.renderFile('BUILD.bazel.liquid', {
    //   name,
    // });
    // await fs.writeFile(path.join(libOutputDir, 'BUILD'), buildFile);
    // await fs.copyFile(
    //   path.join(ASSETS_DIR, 'Info.plist'),
    //   path.join(libOutputDir, 'Info.plist')
    // );
  }

  const sharedContext = new W2CSharedContext(generatedModules);
  await generateHostModule(sharedContext, generatorOptions);
});

export default command;
