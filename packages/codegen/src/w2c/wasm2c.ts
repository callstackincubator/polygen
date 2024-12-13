import consola from 'consola';
import path from 'path';
import { execa } from 'execa';

const waToolkitPath = process.env.WABT_PATH;

/**
 * Validates the presence of the `WABT_PATH` environment variable.
 * If the `WABT_PATH` environment variable is not set, an error message is logged indicating the missing configuration,
 * and the process exits with a failure code.
 *
 * @return No value is returned from this function.
 */
export function validate() {
  if (!waToolkitPath) {
    consola.error(
      'WABT_PATH environment variable is not set. Set it to a directory containing WABT toolkit'
    );
    process.exit(1);
  }
}

/**
 * Options for the wasm2c generation process.
 */
export interface Wasm2cGenerateOptions {
  /**
   * The name of the generated module.
   */
  moduleName?: string;
}

/**
 * Generates C source files from a given WebAssembly input file.
 *
 * @param inputFile The path to the WebAssembly (.wasm) input file.
 * @param outputSourceFile The path where the generated C source file will be saved.
 * @param options Optional configuration for the generation process, including the module name.
 * @return A promise that resolves once the C source file generation is complete.
 */
export async function generateCSources(
  inputFile: string,
  outputSourceFile: string,
  options?: Wasm2cGenerateOptions
) {
  validate();

  const binary = path.join(waToolkitPath!, 'wasm2c');
  const args = [inputFile, '-o', `${outputSourceFile}.c`];
  const defaultModuleName = path.basename(inputFile, '.wasm');
  const moduleName = options?.moduleName ?? defaultModuleName;

  args.push('--module-name');
  args.push(moduleName);

  await execa(binary, args);
}
