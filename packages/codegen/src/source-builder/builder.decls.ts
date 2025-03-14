import { SourceBlockBuilder } from './builder.block.js';
import {
  type ExpressionAction,
  ExpressionBuilder,
  exprs,
} from './builder.expr.js';
import { type TypeAction, TypeBuilder, types } from './builder.types.js';
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
  private bodyAction?: BuilderAction<SourceBlockBuilder>;

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
      this.returnType = type(types).toString();
    }
    return this;
  }

  addParameter(block: FunctionParameter): this {
    this.parameters.push(block);
    return this;
  }

  withBody(block: BuilderAction<SourceBlockBuilder>): this {
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
        this.bodyAction!(new SourceBlockBuilder(false, writer));
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
  private initializerMultiline: boolean = false;

  constructor(name: string, typeBuilder?: TypeBuilder) {
    this._name = name;
    this._type = typeBuilder ?? types.auto;
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
      this._type = type(types);
    }
    return this;
  }

  withInitializer(
    expressionBuilder: ExpressionBuilder | ExpressionAction,
    multiLine: boolean = false
  ): this {
    if (expressionBuilder instanceof ExpressionBuilder) {
      this.expressionBuilder = expressionBuilder;
    } else {
      this.expressionBuilder = expressionBuilder(exprs);
    }
    this.initializerMultiline = multiLine;
    return this;
  }

  build(writer: SourceWriter) {
    writer.write(`${this._type.toString()} ${this._name}`);
    if (this.expressionBuilder) {
      writer.write(' { ');
      if (this.initializerMultiline) {
        writer.writeLine('');
        writer.withIndent(() => {
          this.expressionBuilder!.build(writer);
        });
        writer.writeLine('');
      } else {
        this.expressionBuilder.build(writer);
      }
      writer.write(' }');
    }
    writer.write(';');
  }
}
