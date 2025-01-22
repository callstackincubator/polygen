import { WebAssemblyDecodeError } from './reader/errors.js';
import { readModuleRaw } from './reader/module-reader.js';
import type {
  Export,
  ExportDescriptor,
  ExportSection,
  FunctionSection,
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
  private importsByType: Record<ModuleSymbol['kind'], ModuleSymbol[]> = {
    function: [],
    global: [],
    memory: [],
    table: [],
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

    const types = getSection<TypeSection>('type')?.types ?? [];
    const processedImports = getSection<ImportSection>('import')?.imports?.map(
      (i) => mapImport(i, types)
    );
    this.addImports(processedImports ?? []);

    const indices = getSection<FunctionSection>('function')?.indices ?? [];
    const functions = indices
      .map((i) => types?.[i])
      .filter(Boolean) as FunctionType[];
    this.addFunctions(functions);

    const globals = getSection<GlobalSection>('global')?.globals?.map(
      (g) => g.type
    );
    this.addGlobals(globals ?? []);
    this.addMemories(getSection<MemorySection>('memory')?.memories ?? []);
    this.addTables(getSection<TableSection>('table')?.tables ?? []);

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

  public addImport(imp: ModuleImport) {
    this.imports.push(imp);
    this.importsByType[imp.target.kind].push(imp.target);
  }

  public addImports(imports: ModuleImport[]) {
    this.imports = this.imports.concat(imports);

    const grouped = Object.groupBy(
      imports.map((i) => i.target),
      (i) => i.kind
    );
    this.importsByType.function.push(...(grouped.function ?? []));
    this.importsByType.global.push(...(grouped.global ?? []));
    this.importsByType.memory.push(...(grouped.memory ?? []));
    this.importsByType.table.push(...(grouped.table ?? []));
  }

  public addExport(exported: Export) {
    this.exports.push(mapExport(this, exported));
  }

  public addExports(exports: Export[]) {
    this.exports = this.exports.concat(exports.map((e) => mapExport(this, e)));
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
    const importsOfType = this.importsByType[descriptor.type];
    if (descriptor.index < importsOfType.length) {
      return importsOfType[descriptor.index];
    }

    const localIndex = descriptor.index - importsOfType.length;
    switch (descriptor.type) {
      case 'function':
        return this.functions[localIndex];
      case 'global':
        return this.globals[localIndex];
      case 'memory':
        return this.memories[localIndex];
      case 'table':
        return this.tables[localIndex];
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

/**
 * Resolves an import descriptor into a corresponding module symbol.
 *
 * @param descriptor - The descriptor that needs to be resolved into a module symbol.
 *                      It specifies the type and index of the symbol within the module.
 * @param types - Array of module types.
 * @returns The module symbol corresponding to the descriptor, or `undefined` if the descriptor
 *          cannot be resolved. The symbol can be a function, global, memory, or table, depending
 *          on the descriptor's type.
 */
function resolveImportDescriptor(
  descriptor: ImportDescriptor,
  types: FunctionType[]
): ModuleSymbol | undefined {
  switch (descriptor.type) {
    case 'function':
      const targetType = types[descriptor.index];
      if (!targetType) {
        throw new WebAssemblyDecodeError(
          `Could not decode import descriptor with index: ${descriptor.index}`
        );
      }

      return {
        kind: 'function',
        parametersTypes: targetType.parameterTypes,
        resultTypes: targetType.returnTypes,
      };
    case 'global':
      return mapGlobal(descriptor.global);
    case 'memory':
      return mapMemory(descriptor.memory);
    case 'table':
      return mapTable(descriptor.table);
  }
}

function mapImport(imp: Import, types: FunctionType[]): ModuleImport {
  const target = resolveImportDescriptor(imp.descriptor, types);

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

function mapExport(module: Module, exp: Export): ModuleExport {
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
