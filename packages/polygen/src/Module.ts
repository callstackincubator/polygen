import NativeWASM, {
  type OpaqueModuleNativeHandle,
  type InternalModuleMetadata,
  type ModuleExportDescriptor,
  type ModuleImportDescriptor,
} from './NativePolygen';

const MAGIC = new Uint8Array('CKWASM'.split('').map((e) => e.charCodeAt(0)));

/**
 * @spec https://webassembly.github.io/spec/js-api/index.html#modules
 */
export class Module {
  public nativeHandle: OpaqueModuleNativeHandle;
  metadata: InternalModuleMetadata;

  public constructor(buffer: ArrayBuffer) {
    this.nativeHandle = NativeWASM.loadModule(buffer);
    this.metadata = NativeWASM.getModuleMetadata(this.nativeHandle);

    if (!isFakeModule(buffer)) {
      // TODO: add documentation link
      console.warn(
        '[polygen] Loaded a WebAssembly module from ArrayBuffer, use a loader plugin instead. ' +
          'This method is meant only for development purposes, ' +
          'and should not be used in production.'
      );
    }
  }

  public static imports(mod: Module): ModuleImportDescriptor[] {
    return mod.metadata.imports;
  }

  public static exports(mod: Module): ModuleExportDescriptor[] {
    return mod.metadata.exports;
  }
}

function isFakeModule(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 6) {
    return false;
  }

  const view = new DataView(buffer);
  return MAGIC.every((byte, i) => view.getUint8(i) === byte);
}
