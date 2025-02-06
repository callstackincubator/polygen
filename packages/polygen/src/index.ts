import { Global } from './api/Global';
import { Instance } from './api/Instance';
import { Memory } from './api/Memory';
import { Module } from './api/Module';
import { Table } from './api/Table';
import {
  compile,
  compileStreaming,
  instantiate,
  instantiateStreaming,
  validate,
} from './api/WebAssembly';
import { CompileError, LinkError } from './api/errors';

const impl = {
  compile,
  compileStreaming,
  instantiate,
  instantiateStreaming,
  validate,
  Module,
  Instance,
  Memory,
  Global,
  Table,
  CompileError,
  LinkError,
} as const;

export type Schema = typeof impl;

export const WebAssembly = impl;

// Taken from https://github.com/microsoft/TypeScript/blob/main/src/lib/dom.generated.d.ts#L27309
type BufferSource = ArrayBufferView | ArrayBuffer;
