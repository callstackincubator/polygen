import * as path from 'node:path';
import { Module } from '@callstack/wasm-parser';
import { computeChecksumBuffer } from '../helpers/checksum.js';
import { W2CModuleCodegenContext } from './codegen-context.js';
import { W2CModuleTurboModuleContext } from './turbomodule-context.js';

/**
 * Represents the context of a WebAssembly module, providing metadata such as
 * its name, file path, and checksum.
 */
export class W2CModuleContext {
  /**
   * Name of the module, based on the filename.
   *
   * Unsafe to use as a symbol in source code, use `mangledName` instead.
   */
  public readonly name: string;

  /**
   * Path to the file that the metadata was loaded from.
   */
  public readonly sourceModulePath: string;

  /**
   * SHA-256 checksum of module contents
   */
  public readonly checksum: Buffer;

  /**
   * The parsed WebAssembly module.
   */
  public readonly module: Module;

  /**
   * Context for the wasm2c C code generation.
   */
  public readonly codegen: W2CModuleCodegenContext;

  /**
   * Context for the TurboModule code generation.
   */
  public readonly turboModule: W2CModuleTurboModuleContext;

  constructor(moduleBuffer: ArrayBuffer, sourceModulePath: string) {
    this.name = path.basename(sourceModulePath, '.wasm');
    this.module = new Module(moduleBuffer);
    this.sourceModulePath = sourceModulePath;
    this.checksum = computeChecksumBuffer(moduleBuffer);
    this.codegen = new W2CModuleCodegenContext(this.name, this.module);
    this.turboModule = new W2CModuleTurboModuleContext(this.name);
  }
}
