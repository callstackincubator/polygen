import type { FunctionBuilder, VariableBuilder } from './builder.decls.js';
import { TYPE_FACTORY, type TypeAction } from './builder.types.js';
import type { BuilderAction } from './common.js';
import { SourceWriter } from './source-writer.js';
// export { types, TypeBuilder } from './builder.types.js';
export { VariableBuilder } from './builder.decls.js';
export { SourceFileBuilder } from './builder.file.js';
export { FunctionBuilder } from './builder.decls.js';

export class SourceBuilderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SourceBuilderError';
  }
}

export class SourceBuilder {
  protected writer: SourceWriter;
  public readonly isHeader: boolean;

  constructor(isHeader: boolean, writer?: SourceWriter) {
    this.isHeader = isHeader;
    this.writer = writer ?? new SourceWriter();
  }

  //
  // ------------------------------------------------------------------------------------------ UTILITIES
  //
  /**
   * Returns the generated source code as a string.
   */
  toString(): string {
    return this.writer.toString();
  }

  /**
   * Adds vertical spacing to the source code.
   *
   * @param lines
   */
  spacing(lines: number = 1) {
    for (let i = 0; i < lines; ++i) {
      this.writer.writeLine('');
    }
    return this;
  }

  /**
   * Helper function to generate a type.
   *
   * @param builder Function that builds a type
   * @return C++ Type as string
   */
  type(builder: TypeAction): string {
    return builder(TYPE_FACTORY).toString();
  }

  /**
   * Inserts generated code for each element in the array using custom generator.
   *
   * @param elements
   * @param generator
   */
  writeManyLines<T>(
    elements: T[],
    generator: (element: T, builder: SourceBuilder) => string
  ): this {
    elements.forEach((element) => {
      this.writer.writeLine(generator(element, this));
    });
    return this;
  }

  //
  // ------------------------------------------------------------------------------------------ C++ STATEMENTS
  //
  /**
   * Adds a using namespace directive.
   * @param name Namespace to use
   */
  usingNamespace(name: string): this {
    this.writer.writeLine(`using namespace ${name};`);
    return this;
  }

  using(name: string, value: string): this {
    this.writer.writeLine(`using ${name} = ${value};`);
    return this;
  }

  return_(target: string) {
    this.writer.writeLine(`return ${target};`);
    return this;
  }

  //
  // ------------------------------------------------------------------------------------------ C++ DECLARATIONS
  //
  namespace(name: string, action: BuilderAction<SourceBuilder>): this {
    this.writer.writeLine(`namespace ${name} {`);
    this.spacing(1);
    this.writer.withIndent(() => action(this));
    this.spacing(1);
    this.writer.writeLine('}');
    return this;
  }

  defineFunction(builder: FunctionBuilder): this {
    builder.build(this.writer);
    return this;
  }

  defineVariable(builder: VariableBuilder): this {
    builder.build(this.writer);
    return this;
  }

  // UNSAFE
  insertRaw(source: string) {
    for (const line of source.split('\n')) {
      this.writer.writeLine(line);
    }
    return this;
  }
}
