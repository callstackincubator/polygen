import NativeWASM, { InternalModuleMetadata } from '../NativePolygen';
import { Global } from './Global';
import { Memory } from './Memory';
import { Module } from './Module';
import { Table } from './Table';
import type { ImportObject } from './WebAssembly';
import { LinkError } from './errors';

export class Instance {
  // @ts-ignore
  #imports: ImportObject;

  public exports: any;
  private memories: Record<string, object> = {};
  private tables: Record<string, object> = {};

  constructor(module: Module, imports: ImportObject = {}) {
    this.#imports = imports;

    if (module instanceof Module) {
      validateImports(imports, module.metadata);
    } else {
      throw new TypeError('Invalid module type');
    }

    NativeWASM.createModuleInstance(this, module, imports);

    for (const memoryName in this.memories) {
      this.exports[memoryName] = new Memory(this.memories[memoryName]!);
    }

    for (const tableName in this.tables) {
      this.exports[tableName] = new Table(this.tables[tableName]!);
    }
  }
}

function validateImports(
  imports: ImportObject,
  metadata: InternalModuleMetadata
) {
  for (const importDesc of metadata.imports) {
    const mod = imports[importDesc.module];
    if (!mod) {
      throw new LinkError(
        `Imported module ${importDesc.module} is not provided`
      );
    }

    const value = mod[importDesc.name];
    if (!value) {
      throw new LinkError(
        `Imported symbol ${importDesc.module}.${importDesc.name} is not provided`
      );
    }

    switch (importDesc.kind) {
      case 'function':
        if (typeof value !== 'function') {
          throw new TypeError(
            `Imported symbol ${importDesc.module}.${importDesc.name} is not a function`
          );
        }
        break;
      case 'global':
        if (!(value instanceof Global)) {
          throw new TypeError(
            `Imported symbol ${importDesc.module}.${importDesc.name} is not a global`
          );
        }
        break;
      case 'memory':
        if (!(value instanceof Memory)) {
          throw new TypeError(
            `Imported symbol ${importDesc.module}.${importDesc.name} is not a memory`
          );
        }
        break;
      case 'table':
        throw new Error('Importing tables is not yet supported');
    }
  }
}
