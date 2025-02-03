import type { RefType } from '@callstack/wasm-parser';

export const HEADER = `
//
// THIS FILE WAS GENERATED BY \`react-native-wasm\`
//
// DO NOT EDIT THIS FILE. ANY CHANGES WILL BE LOST.
//
`.trimStart();

export const TABLE_KIND_TO_NATIVE_C_TYPE: Record<RefType, string> = {
  funcref: 'wasm_rt_funcref_table_t',
  externref: 'wasm_rt_externref_table_t',
};

export const TABLE_KIND_TO_CLASS_NAME: Record<RefType, string> = {
  funcref: 'FuncRefTable',
  externref: 'ExternRefTable',
};
