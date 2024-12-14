import type { BufferSource } from '../types';
import { Instance } from './Instance';
import { Module } from './Module';

/**
 * Type representing object with imports
 */
export type ImportObject = Record<string, any>;

/**
 * Validates the specified WebAssembly binary module.
 *
 * As all WebAssembly modules must be known at compile-time and pre-compiled,
 * instead of passing module contents, we are accepting a module name
 * prefixed with magic number.
 *
 * @param bufferOrView ArrayBuffer or DataView containing the WebAssembly module to validate
 */
export function validate(_bufferOrView: BufferSource): boolean {
  // TODO: move this to Native side
  // const view = ArrayBuffer.isView(bufferOrView)
  //   ? (bufferOrView as DataView)
  //   : new DataView(bufferOrView);

  // const isCorrect =
  // view.getInt8(0) === MAGIC[0] && view.getInt8(1) === MAGIC[1];

  // if (!isCorrect) {
  //   console.warn(
  //     '[polygen] Validation of WebAssembly module failed. Only precompiled modules are allowed.'
  //   );
  // }

  return true;
}

/**
 * Compiles the provided WebAssembly binary module.
 *
 * @param bufferOrView ArrayBuffer or DataView containing the WebAssembly module to compile
 * @return A WebAssemblyModule instance constructed from the binary data.
 */
export async function compile(bufferOrView: BufferSource): Promise<Module> {
  return new Module(
    ArrayBuffer.isView(bufferOrView) ? bufferOrView.buffer : bufferOrView
  );
}

export async function compileStreaming(
  source: Response | PromiseLike<Response>
): Promise<Module> {
  const response = await source;
  const buffer = await response.arrayBuffer();
  return compile(buffer);
}

export async function instantiate(
  source: Module | BufferSource,
  imports: ImportObject = {}
): Promise<Instance> {
  if (source instanceof Module) {
    return new Instance(source, imports);
  } else {
    const module = await compile(source);
    return new Instance(module, imports);
  }
}

export interface WebAssemblyInstantiatedSource {
  instance: Instance;
  module: Module;
}

export async function instantiateStreaming(
  source: Response | PromiseLike<Response>,
  importObject?: ImportObject
): Promise<WebAssemblyInstantiatedSource> {
  const module = await compileStreaming(source);
  const instance = instantiate(module, importObject);
  // @ts-ignore
  return { module, instance };
}
