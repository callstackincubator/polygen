import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { UnsafeObject } from 'react-native/Libraries/Types/CodegenTypes';

export type NativeImportObject = UnsafeObject;
export type UnsafeArrayBuffer = UnsafeObject;

/**
 * WebAssembly type
 */
export enum NativeType {
  I32 = 0,
  U32 = 1,
  I64 = 2,
  U64 = 3,
  F32 = 4,
  F64 = 5,
}

/**
 * WebAssembly Table element type
 */
export enum NativeTableElementType {
  AnyFunc = 0,
  ExternRef = 1,
}

/**
 * @spec https://webassembly.github.io/spec/js-api/index.html#modules
 */
export enum NativeSymbolKind {
  Function = 'function',
  Table = 'table',
  Memory = 'memory',
  Global = 'global',
}

/**
 * Describes a single export from a module.
 *
 * Returned from the call to `WebAssembly.Module.exports()`.
 *
 * @spec https://webassembly.github.io/spec/js-api/index.html#modules
 */
export interface ModuleExportDescriptor {
  /**
   * Name of the exported symbol.
   */
  readonly name: string;

  /**
   * Exported symbol kind.
   */
  readonly kind: NativeSymbolKind;
}

/**
 * Describes a single import from a module.
 *
 * Returned from the call to `WebAssembly.Module.imports()`.
 *
 * @spec https://webassembly.github.io/spec/js-api/index.html#modules
 */
export interface ModuleImportDescriptor {
  /**
   * Name of the module to import from.
   */
  readonly module: string;

  /**
   * Name of the imported symbol.
   */
  readonly name: string;

  /**
   * Imported symbol kind.
   */
  readonly kind: NativeSymbolKind;
}

/**
 * Representation of internal precomputed module metadata.
 */
export interface InternalModuleMetadata {
  /**
   * All module imports.
   */
  readonly imports: ModuleImportDescriptor[];

  /**
   * All module exports.
   */
  readonly exports: ModuleExportDescriptor[];
}

export interface NativeGlobalDescriptor {
  readonly type: NativeType;
  readonly isMutable: boolean;
}

export interface NativeTableDescriptor {
  readonly initialSize: number;
  readonly maxSize?: number;
  readonly element: NativeTableElementType;
}

/**
 * Opaque handle representing WebAssembly Module.
 */
export type OpaqueModuleNativeHandle = UnsafeObject;

/**
 * Opaque handle representing WebAssembly Module instance.
 */
export type OpaqueModuleInstanceNativeHandle = UnsafeObject;

/**
 * Opaque handle representing WebAssembly memory instance.
 */
export type OpaqueMemoryNativeHandle = UnsafeObject;

/**
 * Opaque handle representing WebAssembly global instance.
 */
export type OpaqueGlobalNativeHandle = UnsafeObject;

/**
 * Opaque handle representing WebAssembly Table instance.
 */
export type OpaqueTableNativeHandle = UnsafeObject;

export interface Spec extends TurboModule {
  // Modules
  loadModule(
    holder: OpaqueModuleNativeHandle,
    moduleData: UnsafeArrayBuffer
  ): InternalModuleMetadata;
  unloadModule(module: OpaqueModuleNativeHandle): void;
  getModuleMetadata(module: OpaqueModuleNativeHandle): InternalModuleMetadata;

  // Module instances
  createModuleInstance(
    holder: OpaqueModuleInstanceNativeHandle,
    mod: OpaqueModuleNativeHandle,
    importObject: NativeImportObject
  ): void;
  destroyModuleInstance(instance: OpaqueModuleInstanceNativeHandle): void;

  // Memory
  createMemory(
    holder: OpaqueMemoryNativeHandle,
    initial: number,
    maximum?: number
  ): void;
  getMemoryBuffer(instance: OpaqueMemoryNativeHandle): UnsafeArrayBuffer;
  growMemory(instance: OpaqueMemoryNativeHandle, delta: number): void;

  // Globals
  createGlobal(
    holder: OpaqueGlobalNativeHandle,
    descriptor: NativeGlobalDescriptor,
    initialValue: number
  ): void;
  getGlobalValue(instance: OpaqueGlobalNativeHandle): number;
  setGlobalValue(instance: OpaqueGlobalNativeHandle, newValue: number): void;

  // Tables
  createTable(
    holder: OpaqueTableNativeHandle,
    descriptor: NativeTableDescriptor,
    initial?: unknown
  ): void;
  growTable(instance: OpaqueTableNativeHandle, delta: number): void;
  getTableElement(instance: OpaqueTableNativeHandle, index: number): unknown;
  setTableElement(
    instance: OpaqueTableNativeHandle,
    index: number,
    value: unknown
  ): void;
  getTableSize(instance: OpaqueTableNativeHandle): number;
}

export default TurboModuleRegistry.getEnforcing<Spec>('Polygen');
