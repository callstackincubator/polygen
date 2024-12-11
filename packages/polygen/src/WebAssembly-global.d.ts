// Taken from https://github.com/microsoft/TypeScript/blob/main/src/lib/dom.generated.d.ts#L27309
type BufferSource = ArrayBufferView | ArrayBuffer;

declare namespace WebAssembly {
  interface CompileError extends Error {}

  var CompileError: {
    prototype: CompileError;
    new (message?: string): CompileError;
    (message?: string): CompileError;
  };

  /** [MDN Reference](https://developer.mozilla.org/docs/WebAssembly/JavaScript_interface/Global) */
  interface Global<T extends ValueType = ValueType> {
    value: ValueTypeMap[T];
    valueOf(): ValueTypeMap[T];
  }

  var Global: {
    prototype: Global;
    new <T extends ValueType = ValueType>(
      descriptor: GlobalDescriptor<T>,
      v?: ValueTypeMap[T]
    ): Global<T>;
  };

  /** [MDN Reference](https://developer.mozilla.org/docs/WebAssembly/JavaScript_interface/Instance) */
  interface Instance {
    /** [MDN Reference](https://developer.mozilla.org/docs/WebAssembly/JavaScript_interface/Instance/exports) */
    readonly exports: Exports;
  }

  var Instance: {
    prototype: Instance;
    new (module: Module, importObject?: Imports): Instance;
  };

  interface LinkError extends Error {}

  var LinkError: {
    prototype: LinkError;
    new (message?: string): LinkError;
    (message?: string): LinkError;
  };

  /** [MDN Reference](https://developer.mozilla.org/docs/WebAssembly/JavaScript_interface/Memory) */
  interface Memory {
    /** [MDN Reference](https://developer.mozilla.org/docs/WebAssembly/JavaScript_interface/Memory/buffer) */
    readonly buffer: ArrayBuffer;
    /** [MDN Reference](https://developer.mozilla.org/docs/WebAssembly/JavaScript_interface/Memory/grow) */
    grow(delta: number): number;
  }

  var Memory: {
    prototype: Memory;
    new (descriptor: MemoryDescriptor): Memory;
  };

  /** [MDN Reference](https://developer.mozilla.org/docs/WebAssembly/JavaScript_interface/Module) */
  interface Module {}

  var Module: {
    prototype: Module;
    new (bytes: BufferSource): Module;
    /** [MDN Reference](https://developer.mozilla.org/docs/WebAssembly/JavaScript_interface/Module/customSections_static) */
    customSections(moduleObject: Module, sectionName: string): ArrayBuffer[];
    /** [MDN Reference](https://developer.mozilla.org/docs/WebAssembly/JavaScript_interface/Module/exports_static) */
    exports(moduleObject: Module): ModuleExportDescriptor[];
    /** [MDN Reference](https://developer.mozilla.org/docs/WebAssembly/JavaScript_interface/Module/imports_static) */
    imports(moduleObject: Module): ModuleImportDescriptor[];
  };

  interface RuntimeError extends Error {}

  var RuntimeError: {
    prototype: RuntimeError;
    new (message?: string): RuntimeError;
    (message?: string): RuntimeError;
  };

  /** [MDN Reference](https://developer.mozilla.org/docs/WebAssembly/JavaScript_interface/Table) */
  interface Table {
    /** [MDN Reference](https://developer.mozilla.org/docs/WebAssembly/JavaScript_interface/Table/length) */
    readonly length: number;
    /** [MDN Reference](https://developer.mozilla.org/docs/WebAssembly/JavaScript_interface/Table/get) */
    get(index: number): any;
    /** [MDN Reference](https://developer.mozilla.org/docs/WebAssembly/JavaScript_interface/Table/grow) */
    grow(delta: number, value?: any): number;
    /** [MDN Reference](https://developer.mozilla.org/docs/WebAssembly/JavaScript_interface/Table/set) */
    set(index: number, value?: any): void;
  }

  var Table: {
    prototype: Table;
    new (descriptor: TableDescriptor, value?: any): Table;
  };

  interface GlobalDescriptor<T extends ValueType = ValueType> {
    mutable?: boolean;
    value: T;
  }

  interface MemoryDescriptor {
    initial: number;
    maximum?: number;
    shared?: boolean;
  }

  interface ModuleExportDescriptor {
    kind: ImportExportKind;
    name: string;
  }

  interface ModuleImportDescriptor {
    kind: ImportExportKind;
    module: string;
    name: string;
  }

  interface TableDescriptor {
    element: TableKind;
    initial: number;
    maximum?: number;
  }

  interface ValueTypeMap {
    anyfunc: Function;
    externref: any;
    f32: number;
    f64: number;
    i32: number;
    i64: bigint;
    v128: never;
  }

  interface WebAssemblyInstantiatedSource {
    instance: Instance;
    module: Module;
  }

  type ImportExportKind = 'function' | 'global' | 'memory' | 'table';
  type TableKind = 'anyfunc' | 'externref';
  type ExportValue = Function | Global | Memory | Table;
  type Exports = Record<string, ExportValue>;
  type ImportValue = ExportValue | number;
  type Imports = Record<string, ModuleImports>;
  type ModuleImports = Record<string, ImportValue>;
  type ValueType = keyof ValueTypeMap;
  /** [MDN Reference](https://developer.mozilla.org/docs/WebAssembly/JavaScript_interface/compile_static) */
  function compile(bytes: BufferSource): Promise<Module>;
  /** [MDN Reference](https://developer.mozilla.org/docs/WebAssembly/JavaScript_interface/compileStreaming_static) */
  function compileStreaming(
    source: Response | PromiseLike<Response>
  ): Promise<Module>;
  /** [MDN Reference](https://developer.mozilla.org/docs/WebAssembly/JavaScript_interface/instantiate_static) */
  function instantiate(
    bytes: BufferSource,
    importObject?: Imports
  ): Promise<WebAssemblyInstantiatedSource>;
  function instantiate(
    moduleObject: Module,
    importObject?: Imports
  ): Promise<Instance>;
  /** [MDN Reference](https://developer.mozilla.org/docs/WebAssembly/JavaScript_interface/instantiateStreaming_static) */
  function instantiateStreaming(
    source: Response | PromiseLike<Response>,
    importObject?: Imports
  ): Promise<WebAssemblyInstantiatedSource>;
  /** [MDN Reference](https://developer.mozilla.org/docs/WebAssembly/JavaScript_interface/validate_static) */
  function validate(bytes: BufferSource): boolean;
}
