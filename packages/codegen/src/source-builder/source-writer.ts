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
    if (str.includes('\n') && !str.endsWith('\n')) {
      for (const line of str.split('\n')) {
        this.source += this.indentString(line + '\n');
      }
    } else {
      this.source += this.indentString(str);
    }
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

  /**
   * Write multiple items to the source code.
   *
   * @param elements Elements to write
   * @param builder Builder function to generate the line for each element
   * @param joiner How to join the generated elements
   */
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

  /**
   * Write a list of elements separated by a comma.
   *
   * @param elements Elements to write
   * @param builder Builder function to generate the source for each element
   */
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

  /**
   * Write a block of code with increased indentation.
   *
   * @param cb Callback to use to write the indented block
   */
  public withIndent(cb: () => void): this {
    this.pushIndent();
    cb();
    this.popIndent();

    return this;
  }

  /**
   * Returns the generated source code as a string.
   */
  public toString() {
    return this.source;
  }

  private indentString(str: string) {
    if (this.isFreshLine) {
      return ' '.repeat(this.indentLevel * this.indentSize) + str;
    }

    return str;
  }

  private get isFreshLine() {
    return this.source.endsWith('\n');
  }
}
