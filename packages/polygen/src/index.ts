import {
  compile,
  compileStreaming,
  instantiate,
  instantiateStreaming,
  validate,
} from './WebAssembly';
import { Module } from './Module';
import { Instance } from './Instance';
import { Memory } from './Memory';
import { Global } from './Global';

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
