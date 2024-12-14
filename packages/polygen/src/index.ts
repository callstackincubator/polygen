/// <reference path="./wasm-loader.d.ts" />
import { Global } from './api/Global';
import { Instance } from './api/Instance';
import { Memory } from './api/Memory';
import { Module } from './api/Module';
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
  CompileError,
  LinkError,
} as const;

export type Schema = typeof impl;

export const WebAssembly = impl;

export * from './WebAssembly-global';
