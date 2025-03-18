import fs from 'node:fs/promises';
import path from 'node:path';
import { execa } from 'execa';

const waToolkitPath = process.env.WABT_PATH;
let finalWasm2cPath: string | undefined;

/**
 * Error class for wasm2c validation errors.
 */
export class Wasm2cError extends Error {
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
 * Validates the presence of the `wasm2c` binary.
 *
 * Binary is searched in `PATH` and in `WABT_PATH` environment variable.
 * If not found, an error message is logged indicating the missing configuration,
 * and the process exits with a failure code.
 *
 * @return No value is returned from this function.
 */
export async function ensureBinaryAvailable() {
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
 * Returns the output files for a given configuration.
 *
 * @param inputFile Path to the input WASM module
 * @param outputDir Path to the directory containing the output files
 * @param options Optional configuration for the generation process
 */
export function getOutputFilesFor(
  inputFile: string,
  outputDir: string,
  options?: Wasm2cGenerateOptions
): string[] {
  const defaultModuleName = path.basename(inputFile, '.wasm');
  const moduleName = options?.moduleName ?? defaultModuleName;
  const outputDirectory = path.dirname(outputDir);
  return [
    `${outputDirectory}/${moduleName}.c`, // source must be first
    `${outputDirectory}/${moduleName}.h`,
  ];
}

/**
 * Generates C source files from a given WebAssembly input file.
 *
 * @param inputPath The path to the WebAssembly (.wasm) input file.
 * @param outputDir Directory path where the generated C source file will be saved.
 * @param options Optional configuration for the generation process, including the module name.
 * @return A promise that resolves once the C source file generation is complete.
 */
export async function generateCSources(
  inputPath: string,
  outputDir: string,
  options?: Wasm2cGenerateOptions
): Promise<string[]> {
  await ensureBinaryAvailable();
  const generatedFiles = getOutputFilesFor(inputPath, outputDir, options);

  const defaultModuleName = path.basename(inputPath, '.wasm');
  const moduleName = options?.moduleName ?? defaultModuleName;
  const args = [inputPath, '-o', generatedFiles[0]!];

  args.push('--module-name');
  args.push(moduleName);

  await fs.mkdir(path.dirname(outputDir), { recursive: true });
  await execa(finalWasm2cPath!, args);

  // Check generated files exist
  const statPromises = generatedFiles.map((file) => fs.stat(file));
  const results = await Promise.allSettled(statPromises);

  let i = 0;
  for (const res of results) {
    if (res.status !== 'fulfilled' || !res.value?.isFile()) {
      throw new Wasm2cError(`Failed to generate file ${generatedFiles[i]}`);
    }

    i += 1;
  }

  return generatedFiles;
}
