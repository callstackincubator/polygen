import type { SourceWriter } from './source-writer.js';

export interface AnyBuilder {
  build(writer: SourceWriter): void;
}

export interface ToStringBuilder {
  toString(): string;
}

export type BuilderAction<T> = (builder: T) => T;
