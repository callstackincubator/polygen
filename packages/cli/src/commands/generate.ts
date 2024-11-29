#!/usr/bin/env node
import { Command } from 'commander';
import consola from 'consola';
import { oraPromise } from 'ora';
import chalk from 'chalk';
import { Project } from '@callstack/polygen-core-build';
import {
  type AnySymbol,
  loadWasmModuleFromFile,
  SymbolSet,
} from '@callstack/polygen-codegen';
import { W2CGenerator, W2CModule } from '@callstack/polygen-codegen/w2c';
import fs from 'node:fs/promises';
import path from 'path';

const command = new Command('generate').description(
  'Generates React Native Modules from Wasm'
);

command.action(async () => {
  const project = await Project.findClosest();

  const w2cGenerator = new W2CGenerator({
    outputDirectory: project.fullOutputDirectory,
    singleProject: true,
    generateMetadata: true,
    forceGenerate: true,
  });

  const modules = await project.getWebAssemblyModules();
  // const pathToRuntimeHeader = path.join(ASSETS_DIR, 'wasm-rt-weak.h');

  consola.info('Found', chalk.bold(modules.length), 'WebAssembly module(s)');
  const generatedModules: W2CModule[] = [];

  for (const mod of modules) {
    const modPath = project.pathToSource(mod);
    const parsedModule = await oraPromise(
      loadWasmModuleFromFile(modPath),
      `Loading ${chalk.magenta(mod)} metadata`
    );

    const generatedModule = await oraPromise(
      async () => {
        const result = await w2cGenerator.generateModule(parsedModule);
        generatedModules.push(result);
        return result;
      },
      `Processing ${chalk.magenta(mod)} module`
    );

    const imports = generatedModule.imports;
    const exports = generatedModule.exports;
    const hglt = chalk.dim;

    function statsOf<T extends AnySymbol<TKey>, TKey = T['type']>(
      set: SymbolSet<AnySymbol<TKey>>
    ): string {
      const highlight = chalk.dim;
      const countOf = (type: TKey) => set.byType.get(type)?.size ?? 0;
      return [
        `${highlight(countOf('Function' as TKey))} functions`,
        `${highlight(countOf('Memory' as TKey))} memories`,
      ].join(', ');
    }

    consola.info(`  Found ${hglt(imports.size)} imports (${statsOf(imports)})`);
    consola.info(`  Found ${hglt(exports.size)} exports (${statsOf(exports)})`);

    const cleanName = path.basename(mod, '.wasm');
    const modulePath = path.join(
      project.fullOutputDirectory,
      'modules',
      `${cleanName}.js`
    );
    console.log('write to: ', modulePath);
    await fs.mkdir(path.dirname(modulePath), { recursive: true });
    await fs.writeFile(modulePath, `export default "${cleanName}"`, 'utf8');

    // const buildFile = await engine.renderFile('BUILD.bazel.liquid', {
    //   name,
    // });
    // await fs.writeFile(path.join(libOutputDir, 'BUILD'), buildFile);
    // await fs.copyFile(
    //   path.join(ASSETS_DIR, 'Info.plist'),
    //   path.join(libOutputDir, 'Info.plist')
    // );
  }

  await w2cGenerator.generateHostModule(generatedModules);
});

export default command;
