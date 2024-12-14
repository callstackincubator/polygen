/**
 * Thrown when a compilation error occurs.
 */
export class CompileError extends Error {
  constructor(message: string, ...args: any[]) {
    super(message, ...args);
    this.name = 'CompileError';
  }
}

/**
 * Thrown when a linking error occurs.
 */
export class LinkError extends Error {
  constructor(message: string, ...args: any[]) {
    super(message, ...args);
    this.name = 'LinkError';
  }
}
