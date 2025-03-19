import type { Plugin } from '../plugin.js';

/**
 * Plugin that generates a virtual module for Metro support.
 */
export function dumpMetadata(): Plugin {
  return {
    name: 'core/dump-metadata',
    title: 'Dump Metadata',

    async moduleGenerated({ moduleOutput, context }): Promise<void> {
      const exportsPromise = moduleOutput.writeTo(
        `${context.name}.exports.json`,
        JSON.stringify(context.exports, null, 2)
      );

      const importsPromise = await moduleOutput.writeTo(
        `${context.name}.imports.json`,
        JSON.stringify(context.imports, null, 2)
      );

      await Promise.all([exportsPromise, importsPromise]);
    },
  };
}
