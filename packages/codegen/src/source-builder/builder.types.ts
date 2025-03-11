import type { AnyBuilder } from './common.js';
import type { SourceWriter } from './source-writer.js';

export const TYPE_FACTORY = {
  get auto() {
    return new TypeBuilder('auto');
  },

  get string() {
    return new TypeBuilder('std::string');
  },

  get stringVector() {
    return this.string.asVector();
  },

  of(name: string) {
    return new TypeBuilder(name);
  },

  function(returnType: TypeBuilder, args: TypeBuilder[]) {
    const argsStr = args.map((a) => a.toString());
    const returnTypeStr = returnType.toString();
    return new TypeBuilder(
      `std::function<${returnTypeStr}(${argsStr.join(', ')})>`
    );
  },

  map(key: TypeBuilder, value: TypeBuilder) {
    return new TypeBuilder(
      `std::unordered_map<${key.toString()}, ${value.toString()}>`
    );
  },
};

export type TypeAction = (t: typeof TYPE_FACTORY) => TypeBuilder;

export class TypeBuilder implements AnyBuilder {
  private type: string;

  constructor(type: string) {
    this.type = type;
  }

  build(writer: SourceWriter): void {
    writer.write(this.type);
  }

  public toString(): string {
    return this.type;
  }

  public asVector(): this {
    this.type = `std::vector<${this.type}>`;
    return this;
  }

  public asSharedPtr(): this {
    this.type = `std::shared_ptr<${this.type}>`;
    return this;
  }

  public asConst(): this {
    this.type = `const ${this.type}`;
    return this;
  }

  public asRef(): this {
    this.type = `${this.type}&`;
    return this;
  }

  public asConstRef(): this {
    this.type = `const ${this.type}&`;
    return this;
  }

  public asPtr(): this {
    this.type = `${this.type}*`;
    return this;
  }

  public asConstPtr(): this {
    this.type = `const ${this.type}*`;
    return this;
  }
}
