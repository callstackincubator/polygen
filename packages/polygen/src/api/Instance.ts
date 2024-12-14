import NativeWASM, { type OpaqueModuleNativeHandle } from '../NativePolygen';
import { Memory, type MemoryDescriptor } from './Memory';
import type { ImportObject } from './WebAssembly';

export class Instance {
  // @ts-ignore
  #imports: ImportObject;

  public exports: any;
  private memories: Record<string, MemoryDescriptor> = {};

  constructor(module: OpaqueModuleNativeHandle, imports: ImportObject) {
    this.#imports = imports;
    NativeWASM.createModuleInstance(this, module, imports);

    for (const memoryName in this.memories) {
      this.exports[memoryName] = new Memory(this.memories[memoryName]!);
    }
  }
}
