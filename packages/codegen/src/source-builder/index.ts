import { FunctionBuilder, VariableBuilder } from './builder.decls.js';
import { ExpressionBuilder, exprs } from './builder.expr.js';
import { SourceFileBuilder } from './builder.file.js';
import { TypeBuilder, types } from './builder.types.js';

export const cpp = {
  VariableBuilder,
  FunctionBuilder,
  SourceFileBuilder,
  exprs,
  ExpressionBuilder,
  types,
  TypeBuilder,
};
