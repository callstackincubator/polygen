import type { Plugin } from '../../plugin.js';
import * as templates from '../../templates/host.js';

/**
 * Plugin that generates a virtual module for Metro support.
 */
export function reactNativeTurboModule(): Plugin {
  return {
    name: 'core/turbo-module',
    title: 'React Native TurboModule',

    async hostProjectGenerated({
      projectOutput,
      generatedModules,
    }): Promise<void> {
      await projectOutput.writeAllTo({
        'loader.cpp': templates.buildLoaderSource(generatedModules),
      });
    },
  };
}
