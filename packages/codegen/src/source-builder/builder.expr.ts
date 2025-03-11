import type { AnyBuilder } from './common.js';
import type { SourceWriter } from './source-writer.js';

export const EXPRESSION_FACTORY = {
  listOf: (elements: AnyBuilder[]) =>
    new ExpressionBuilder(
      `{ ${elements.map((e) => e.toString()).join(', ')} }`
    ),
};

export type ExpressionAction = (
  e: typeof EXPRESSION_FACTORY
) => ExpressionBuilder;

export class ExpressionBuilder implements AnyBuilder {
  private expression: string;

  constructor(expr: string = '') {
    this.expression = expr;
  }

  build(writer: SourceWriter): void {
    writer.write(this.expression);
  }
}
