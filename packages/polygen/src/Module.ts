import NativeWASM, {
  type OpaqueModuleNativeHandle,
  type InternalModuleMetadata,
  type ModuleExportDescriptor,
  type ModuleImportDescriptor,
} from './NativePolygen';

/**
 * @spec https://webassembly.github.io/spec/js-api/index.html#modules
 */
export class Module {
  public nativeHandle: OpaqueModuleNativeHandle;
  metadata: InternalModuleMetadata;

  public constructor(buffer: ArrayBuffer) {
    this.nativeHandle = NativeWASM.loadModule(buffer);
    this.metadata = NativeWASM.getModuleMetadata(this.nativeHandle);
  }

  public static imports(mod: Module): ModuleImportDescriptor[] {
    return mod.metadata.imports;
  }

  public static exports(mod: Module): ModuleExportDescriptor[] {
    return mod.metadata.exports;
  }
}
