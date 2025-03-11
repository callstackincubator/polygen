import { SourceBuilder, SourceBuilderError } from './builder.js';
import type { SourceWriter } from './source-writer.js';

export class SourceFileBuilder extends SourceBuilder {
  constructor(writer?: SourceWriter) {
    super(false, writer);
  }

  //
  // ------------------------------------------------------------------------------------------ C++ STATEMENTS
  //
  writeIncludeGuard(): this {
    if (!this.isHeader) {
      throw new SourceBuilderError('Cannot add include guard to source file');
    }
    this.writer.writeLine(`#pragma once`);
    return this;
  }

  /**
   * Adds an include preprocesor directive.
   *
   * @param path Path to include
   * @param local Whenever to use local include or a system include
   */
  private include(path: string, local: boolean): this {
    if (local) {
      this.writer.writeLine(`#include "${path}"`);
    } else {
      this.writer.writeLine(`#include <${path}>`);
    }
    return this;
  }

  /**
   * Adds a local include preprocesor directive.
   *
   * @param path Path to include
   */
  includeLocal(path: string) {
    return this.include(path, true);
  }

  /**
   * Adds a system include preprocesor directive.
   *
   * @param path Path to include
   */
  includeSystem(path: string) {
    return this.include(path, false);
  }
}
