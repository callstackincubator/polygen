import { Global } from './Global';
import { Instance } from './Instance';
import { Memory } from './Memory';
import { Module } from './Module';
import {
  compile,
  compileStreaming,
  instantiate,
  instantiateStreaming,
  validate,
} from './WebAssembly';

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
} as const;

export type Schema = typeof impl;

export const WebAssembly = impl;
