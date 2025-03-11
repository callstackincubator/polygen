/**
 * SourceWriter is a helper class to build source code strings with proper indentation.
 */
export class SourceWriter {
  /**
   * Current indentation level.
   */
  public indentLevel;

  /**
   * Current indentation size
   */
  public readonly indentSize;

  private source: string = '';

  constructor(indentLevel: number = 0, indentSize: number = 2) {
    this.indentLevel = indentLevel;
    this.indentSize = indentSize;
  }

  /**
   * Write a string to the source code.
   *
   * @param str String to write
   */
  public write(str: string): this {
    this.source += this.indentString(str);
    return this;
  }

  /**
   * Write a line to the source code.
   *
   * @param line Line to write
   */
  public writeLine(line: string): this {
    return this.write(`${line}\n`);
  }

  public writeMany<T>(
    elements: T[],
    builder: (element: T, writer: SourceWriter) => string | unknown,
    joiner: string
  ): this {
    elements.forEach((element, index) => {
      const res = builder(element, this);
      if (typeof res === 'string') {
        this.write(res);
      }

      if (index < elements.length - 1) {
        this.write(joiner);
      }
    });

    return this;
  }

  public writeCommaList<T>(
    elements: T[],
    builder: (element: T, writer: SourceWriter) => string | unknown
  ): this {
    return this.writeMany(elements, builder, ', ');
  }

  /**
   * Increase the indentation level.
   */
  public pushIndent(): this {
    this.indentLevel += this.indentSize;
    return this;
  }

  /**
   * Decrease the indentation level.
   */
  public popIndent(): this {
    this.indentLevel -= this.indentSize;
    return this;
  }

  public withIndent(cb: () => void): this {
    this.pushIndent();
    cb();
    this.popIndent();

    return this;
  }

  public toString() {
    return this.source;
  }

  private indentString(str: string) {
    return ' '.repeat(this.indentLevel * this.indentSize) + str.trimStart();
  }
}
