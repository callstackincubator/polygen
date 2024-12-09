import { Module } from './Module';
import { Instance } from './Instance';
import type { BufferSource } from './types';

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

export async function instantiate(
  bufferOrView: BufferSource,
  imports?: ImportObject
): Promise<Instance>;
export async function instantiate(
  module: Module,
  imports?: ImportObject
): Promise<Instance>;
export async function instantiate(
  source: Module | BufferSource,
  imports: ImportObject = {}
): Promise<Instance> {
  if (source instanceof Module) {
    return new Instance(source.nativeHandle, imports);
  } else {
    const module = await compile(source);
    return new Instance(module.nativeHandle, imports);
  }
}
