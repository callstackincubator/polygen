import NativeWASM, {
  NativeTableElementType,
  type OpaqueTableNativeHandle,
} from '../NativePolygen';

/**
 * Object describing table metadata
 *
 * This object specifies table details and is used when creating
 * table object from JavaScript code.
 */
export interface TableDescriptor {
  /**
   * String representing table element type.
   */
  element: 'anyfunc' | 'externref';

  /**
   * Initial number of pages.
   */
  initial: number;

  /**
   * Maximum number of pages for this memory.
   */
  maximum?: number;
}

/**
 * Helper function checking if specified object is a TableDescriptor.
 *
 * @param descriptor Object to check
 */
function isTableDescriptor(descriptor: any): descriptor is TableDescriptor {
  return 'element' in descriptor && 'initial' in descriptor;
}

/**
 * @spec https://webassembly.github.io/spec/js-api/index.html#memories
 */
export class Table {
  constructor(
    instance: OpaqueTableNativeHandle | TableDescriptor,
    value?: any
  ) {
    if (isTableDescriptor(instance)) {
      NativeWASM.createTable(
        this,
        {
          element:
            instance.element === 'anyfunc'
              ? NativeTableElementType.AnyFunc
              : NativeTableElementType.ExternRef,
          initialSize: instance.initial,
          maxSize: instance.maximum,
        },
        value
      );
    } else {
      if (!NativeWASM.copyNativeHandle(this, instance)) {
        throw new Error(
          'Invalid object passed to WebAssembly.Table() constructor'
        );
      }
    }
  }

  public get length(): number {
    return NativeWASM.getTableSize(this);
  }

  public grow(delta: number) {
    NativeWASM.growTable(this, delta);
  }

  public get(index: number) {
    return NativeWASM.getTableElement(this, index);
  }

  public set(index: number, value: any) {
    if (value == null || typeof value !== 'object') {
      return;
    }

    NativeWASM.setTableElement(this, index, value);
  }
}
