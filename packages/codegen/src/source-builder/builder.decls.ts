import {
  EXPRESSION_FACTORY,
  type ExpressionAction,
  ExpressionBuilder,
} from './builder.expr.js';
import { SourceBuilder } from './builder.js';
import { TYPE_FACTORY, type TypeAction, TypeBuilder } from './builder.types.js';
import type { AnyBuilder, BuilderAction } from './common.js';
import type { SourceWriter } from './source-writer.js';

interface FunctionParameter {
  type: string;
  name: string;
}

export class FunctionBuilder implements AnyBuilder {
  private name: string;
  private returnType: string = 'void';
  private parameters: FunctionParameter[] = [];
  private bodyAction?: BuilderAction<SourceBuilder>;

  constructor(
    name: string,
    returnTypeBuilder?: TypeBuilder,
    parameters: FunctionParameter[] = []
  ) {
    this.name = name;
    this.returnType = returnTypeBuilder?.toString() ?? 'void';
    this.parameters = parameters;
  }

  withReturnType(type: TypeBuilder | TypeAction): this {
    if (type instanceof TypeBuilder) {
      this.returnType = type.toString();
    } else {
      this.returnType = type(TYPE_FACTORY).toString();
    }
    return this;
  }

  addParameter(block: FunctionParameter): this {
    this.parameters.push(block);
    return this;
  }

  withBody(block: BuilderAction<SourceBuilder>): this {
    this.bodyAction = block;
    return this;
  }

  build(writer: SourceWriter) {
    writer.write(`${this.returnType} ${this.name}`);
    writer.write('(');
    writer.writeCommaList(
      this.parameters,
      (param) => `${param.type} ${param.name}`
    );
    writer.write(')');

    if (this.bodyAction) {
      writer.writeLine('{');
      writer.withIndent(() => {
        const bodyBuilder = this.bodyAction!(new SourceBuilder(false, writer));
        writer.writeLine(bodyBuilder.toString());
      });
      writer.writeLine('}');
    } else {
      writer.writeLine(';');
    }
  }
}

export class VariableBuilder implements AnyBuilder {
  private _name: string;
  private _type: TypeBuilder;
  private expressionBuilder?: ExpressionBuilder;

  constructor(name: string, typeBuilder?: TypeBuilder) {
    this._name = name;
    this._type = typeBuilder ?? TYPE_FACTORY.auto;
  }

  get name(): string {
    return this._name;
  }

  get type(): TypeBuilder {
    return new TypeBuilder(this._type.toString());
  }

  withName(name: string): this {
    this._name = name;
    return this;
  }

  withType(type: TypeBuilder | TypeAction): this {
    if (type instanceof TypeBuilder) {
      this._type = type;
    } else {
      this._type = type(TYPE_FACTORY);
    }
    return this;
  }

  withInitializer(
    expressionBuilder: ExpressionBuilder | ExpressionAction
  ): this {
    if (expressionBuilder instanceof ExpressionBuilder) {
      this.expressionBuilder = expressionBuilder;
    } else {
      this.expressionBuilder = expressionBuilder(EXPRESSION_FACTORY);
    }
    return this;
  }

  build(writer: SourceWriter) {
    writer.write(`${this._type.toString()} ${this._name}`);
    if (this.expressionBuilder) {
      writer.write(` { ${this.expressionBuilder.build(writer)} }`);
    }
    writer.write(';');
  }
}
