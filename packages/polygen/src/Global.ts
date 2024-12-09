import NativeWASM, {
  type OpaqueMemoryNativeHandle,
  NativeType,
} from './NativePolygen';
import type { WebAssemblyType } from './types';

/**
 * Object describing global metadata
 *
 * This object specifies global variable details and is used when creating
 * global variable from JavaScript code.
 */
export interface GlobalDescriptor {
  /**
   * Type of the GlobalVariable.
   */
  type: WebAssemblyType;

  /**
   * Whenever the variable can be changed. By default, this is false.
   */
  mutable?: boolean;
}

/**
 * Helper function checking if specified object is a global descriptor.
 *
 * @param descriptor Object to check
 */
function isGlobalDescriptor(descriptor: any): descriptor is GlobalDescriptor {
  return 'type' in descriptor;
}

const TypeMapping: Record<WebAssemblyType, NativeType> = {
  i32: NativeType.I32,
  u32: NativeType.U32,
  i64: NativeType.I64,
  u64: NativeType.U64,
  f32: NativeType.F32,
  f64: NativeType.F64,
};

/**
 * @spec https://webassembly.github.io/spec/js-api/index.html#globals
 */
export class Global {
  constructor(
    instance: OpaqueMemoryNativeHandle | GlobalDescriptor,
    initialValue?: number
  ) {
    if (isGlobalDescriptor(instance)) {
      NativeWASM.createGlobal(
        this,
        {
          type: TypeMapping[instance.type],
          isMutable: instance.mutable ?? false,
        },
        initialValue ?? 0
      );
    }
  }

  get value() {
    return NativeWASM.getGlobalValue(this);
  }

  set value(newValue: number) {
    NativeWASM.setGlobalValue(this, newValue);
  }
}
