import { WebAssemblyDecodeError } from './reader/errors.js';
import { readModuleRaw } from './reader/module-reader.js';
import type {
  Export,
  ExportDescriptor,
  ExportSection,
  FunctionType,
  GlobalSection,
  GlobalType,
  Import,
  ImportDescriptor,
  ImportSection,
  MemorySection,
  MemoryType,
  Section,
  TableSection,
  TableType,
  TypeSection,
} from './reader/types.js';
import type {
  ModuleExport,
  ModuleFunction,
  ModuleGlobal,
  ModuleImport,
  ModuleMemory,
  ModuleSymbol,
  ModuleTable,
} from './types.js';

/**
 * Class representing a WebAssembly Module.
 */
export class Module {
  private importsByType: Record<ModuleSymbol['kind'], number> = {
    function: 0,
    global: 0,
    memory: 0,
    table: 0,
  };

  /**
   * An array of module functions.
   */
  public functions: ModuleFunction[] = [];

  /**
   * An array of global variables in the module.
   */
  public globals: ModuleGlobal[] = [];

  /**
   * An array of tables in the module.
   */
  public tables: ModuleTable[] = [];

  /**
   * An array of memory blocks in the module.
   */
  public memories: ModuleMemory[] = [];

  /**
   * An array of module imports.
   */
  public imports: ModuleImport[] = [];

  /**
   * An array of module exports.
   */
  public exports: ModuleExport[] = [];

  constructor(buffer: ArrayBuffer) {
    const sections = Object.groupBy(
      readModuleRaw(buffer),
      (section) => section.type
    );

    function getSection<T extends Section>(type: T['type']): T | undefined {
      return sections[type]?.[0] as T | undefined;
    }

    this.addFunctions(getSection<TypeSection>('type')?.types ?? []);
    this.addGlobals(
      getSection<GlobalSection>('global')?.globals?.map((g) => g.type) ?? []
    );
    this.addMemories(getSection<MemorySection>('memory')?.memories ?? []);
    this.addTables(getSection<TableSection>('table')?.tables ?? []);

    this.addImports(getSection<ImportSection>('import')?.imports ?? []);
    this.addExports(getSection<ExportSection>('export')?.exports ?? []);
  }

  public addFunction(funcType: FunctionType) {
    this.functions.push(mapFunction(funcType));
  }

  public addFunctions(funcTypes: FunctionType[]) {
    this.functions = this.functions.concat(funcTypes.map(mapFunction));
  }

  public addGlobal(global: GlobalType) {
    this.globals.push(mapGlobal(global));
  }

  public addGlobals(globals: GlobalType[]) {
    this.globals = this.globals.concat(globals.map(mapGlobal));
  }

  public addTable(table: TableType) {
    this.tables.push(mapTable(table));
  }

  public addTables(tables: TableType[]) {
    this.tables = this.tables.concat(tables.map(mapTable));
  }

  public addMemory(memory: MemoryType) {
    this.memories.push(mapMemory(memory));
  }

  public addMemories(memories: MemoryType[]) {
    this.memories = this.memories.concat(memories.map(mapMemory));
  }

  public addImport(imp: Import) {
    this.imports.push(mapImport(this, imp));
    this.importsByType[imp.descriptor.type]++;
  }

  public addImports(imports: Import[]) {
    this.imports = this.imports.concat(imports.map((i) => mapImport(this, i)));

    const grouped = Object.groupBy(imports, (i) => i.descriptor.type);
    this.importsByType.function += grouped.function?.length ?? 0;
    this.importsByType.global += grouped.global?.length ?? 0;
    this.importsByType.memory += grouped.memory?.length ?? 0;
    this.importsByType.table += grouped.table?.length ?? 0;
  }

  public addExport(exported: Export) {
    this.exports.push(mapExport(this, exported));
  }

  public addExports(exports: Export[]) {
    this.exports = this.exports.concat(exports.map((e) => mapExport(this, e)));
  }

  /**
   * Resolves an import descriptor into a corresponding module symbol.
   *
   * @param descriptor - The descriptor that needs to be resolved into a module symbol.
   *                      It specifies the type and index of the symbol within the module.
   * @returns The module symbol corresponding to the descriptor, or `undefined` if the descriptor
   *          cannot be resolved. The symbol can be a function, global, memory, or table, depending
   *          on the descriptor's type.
   */
  resolveImportDescriptor(
    descriptor: ImportDescriptor
  ): ModuleSymbol | undefined {
    switch (descriptor.type) {
      case 'function':
        return this.functions[descriptor.index];
      case 'global':
        return mapGlobal(descriptor.global);
      case 'memory':
        return mapMemory(descriptor.memory);
      case 'table':
        return mapTable(descriptor.table);
    }
  }

  /**
   * Resolves an export descriptor to its corresponding module symbol.
   *
   * @param descriptor - The export descriptor indicating the type and index of the export.
   * @return The resolved module symbol if found, otherwise undefined.
   */
  resolveExportDescriptor(
    descriptor: ExportDescriptor
  ): ModuleSymbol | undefined {
    switch (descriptor.type) {
      case 'function':
        return this.functions[descriptor.index];
      case 'global':
        return this.globals[descriptor.index - this.importsByType.global];
      case 'memory':
        return this.memories[descriptor.index - this.importsByType.memory];
      case 'table':
        return this.tables[descriptor.index - this.importsByType.table];
    }
  }
}

function mapFunction(funcType: FunctionType): ModuleFunction {
  return {
    kind: 'function',
    parametersTypes: funcType.parameterTypes,
    resultTypes: funcType.returnTypes,
  };
}

function mapGlobal(global: GlobalType): ModuleGlobal {
  return {
    kind: 'global',
    type: global.valueType,
    isMutable: global.isMutable,
  };
}

function mapMemory(memory: MemoryType): ModuleMemory {
  return {
    kind: 'memory',
    minSize: memory.min,
    maxSize: memory.max,
  };
}

function mapTable(table: TableType): ModuleTable {
  return {
    kind: 'table',
    minSize: table.limits.min,
    maxSize: table.limits.max,
    elementType: table.elementType,
  };
}

function mapImport(module: Module, imp: Import) {
  const target = module.resolveImportDescriptor(imp.descriptor);

  if (!target) {
    throw new WebAssemblyDecodeError(
      `Could not resolve descriptor ${JSON.stringify(imp.descriptor)}`
    );
  }

  return {
    kind: 'import',
    module: imp.module,
    name: imp.name,
    target,
  };
}

function mapExport(module: Module, exp: Export) {
  const target = module.resolveExportDescriptor(exp.descriptor);

  if (!target) {
    throw new WebAssemblyDecodeError(
      `Could not resolve descriptor ${JSON.stringify(exp.descriptor)}`
    );
  }

  return {
    kind: 'export',
    name: exp.name,
    target,
  };
}
