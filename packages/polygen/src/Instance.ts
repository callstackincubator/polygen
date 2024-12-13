import { Memory } from './Memory';
import NativeWASM, { type OpaqueModuleNativeHandle } from './NativePolygen';
import type { ImportObject } from './WebAssembly';

export class Instance {
  // @ts-ignore
  #imports: ImportObject;

  public exports: any;

  constructor(module: OpaqueModuleNativeHandle, imports: ImportObject) {
    this.#imports = imports;
    const instance = NativeWASM.createModuleInstance(module, imports) as any;
    this.exports = instance.exports;

    for (const memoryName in instance.memories) {
      this.exports[memoryName] = new Memory(instance.memories[memoryName]);
    }
  }
}
