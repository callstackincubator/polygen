import { mangleModuleName } from '../mangle.js';

/**
 * W2CModuleTurboModuleContext is a utility class designed to manage the generation of
 * class and function names related to React Native TurboModule bridging.
 * It provides structured naming conventions for module factory functions and context classes
 * based on a given module name.
 */
export class W2CModuleTurboModuleContext {
  public readonly generatedClassName: string;

  constructor(name: string) {
    this.generatedClassName = capitalize(mangleModuleName(name));
  }

  /**
   * Name of the function that creates a new instance of the module.
   */
  public get moduleFactoryFunctionName(): string {
    return `create${this.generatedClassName}Module`;
  }

  /**
   * Name of the class that represents the module context.
   */
  public get contextClassName(): string {
    return `${this.generatedClassName}ModuleContext`;
  }
}

function capitalize(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}
