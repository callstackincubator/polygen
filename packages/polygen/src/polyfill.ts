/// <reference path="../types/WebAssembly-global.d.ts" preserve="true" />
import { WebAssembly } from '@callstack/polygen';
global.WebAssembly = Object.freeze(WebAssembly) as any;

// TODO: remove
// @ts-ignore
globalThis.WebAssembly = Object.freeze(WebAssembly);
