import type { ImportObject } from './WebAssembly';
import NativeWASM, {
  type OpaqueModuleNativeHandle,
  type OpaqueModuleInstanceNativeHandle,
} from './NativeWebAssembly';
import { Memory } from './Memory';

export class Instance {
  // @ts-ignore
  #nativeHandle: OpaqueModuleInstanceNativeHandle;
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
