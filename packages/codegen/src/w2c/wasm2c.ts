import path from 'node:path';
import { execa } from 'execa';

const waToolkitPath = process.env.WABT_PATH;
let finalWasm2cPath: string | undefined;

/**
 * Error class for wasm2c validation errors.
 */
class Wasm2cError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'Wasm2cError';
  }
}

function assertVersion(output: string) {
  if (!output.startsWith('1.0.36')) {
    const version = output.split(' ')[0];
    throw new Wasm2cError(
      `Unsupported wasm2c version: ${version}. Please use version 1.0.36.`
    );
  }
}

async function findBinary(): Promise<string> {
  try {
    const { stdout, exitCode } = await execa`which wasm2c`;
    if (exitCode === 0) {
      return stdout.trim();
    }
  } catch (e) {}

  if (!waToolkitPath) {
    throw new Wasm2cError(
      'WABT_PATH environment variable is not set. Set it to a directory containing WABT toolkit'
    );
  }

  return `${waToolkitPath}/wasm2c`;
}

/**
 * Validates the presence of the `WABT_PATH` environment variable.
 * If the `WABT_PATH` environment variable is not set, an error message is logged indicating the missing configuration,
 * and the process exits with a failure code.
 *
 * @return No value is returned from this function.
 */
export async function validate() {
  if (finalWasm2cPath) {
    return;
  }

  finalWasm2cPath = await findBinary();

  try {
    const { stdout } = await execa(finalWasm2cPath!, ['--version']);
    assertVersion(stdout);
    return;
  } catch (e) {}
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
  await validate();

  const args = [inputFile, '-o', `${outputSourceFile}.c`];
  const defaultModuleName = path.basename(inputFile, '.wasm');
  const moduleName = options?.moduleName ?? defaultModuleName;

  args.push('--module-name');
  args.push(moduleName);

  await execa(finalWasm2cPath!, args);
}
