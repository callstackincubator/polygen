import type { Plugin } from '../plugin.js';

/**
 * Plugin that generates a virtual module for Metro support.
 */
export function dumpMetadata(): Plugin {
  return {
    name: 'core/dump-metadata',

    async moduleGenerated({ output, context }): Promise<void> {
      const exportsPromise = output.writeTo(
        `${context.name}.exports.json`,
        JSON.stringify(context.exports, null, 2)
      );

      const importsPromise = await output.writeTo(
        `${context.name}.imports.json`,
        JSON.stringify(context.imports, null, 2)
      );

      await Promise.all([exportsPromise, importsPromise]);
    },
  };
}
