import type { AnyBuilder, ToStringBuilder } from './common.js';
import type { SourceWriter } from './source-writer.js';

export const exprs = {
  initializerListOf: (
    elements: ToStringBuilder[],
    multiline: boolean = false
  ) =>
    new ExpressionBuilder(
      `{ ${elements.map((e) => e.toString()).join(multiline ? ',\n' : ', ')} }`
    ),

  listOf: (elements: ToStringBuilder[], multiline: boolean = false) =>
    new ExpressionBuilder(
      `${elements.map((e) => e.toString()).join(multiline ? ',\n' : ', ')}`
    ),

  string: (value: string) => new ExpressionBuilder(`"${value}"`),
  symbol: (name: string) => new ExpressionBuilder(name),
};

export type ExpressionAction = (e: typeof exprs) => ExpressionBuilder;

export class ExpressionBuilder implements AnyBuilder, ToStringBuilder {
  private expression: string;

  constructor(expr: ExpressionAction | string = '') {
    if (typeof expr === 'function') {
      this.expression = expr(exprs).toString();
    } else {
      this.expression = expr;
    }
  }

  build(writer: SourceWriter): void {
    writer.write(this.expression);
  }

  toString() {
    return this.expression;
  }
}
