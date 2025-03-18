import type { AnyBuilder } from './common.js';
import type { SourceWriter } from './source-writer.js';

export const types = {
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

export type TypeAction = (t: typeof types) => TypeBuilder;

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

  public asVector(): TypeBuilder {
    return new TypeBuilder(`std::vector<${this.type}>`);
  }

  public asSharedPtr(): TypeBuilder {
    return new TypeBuilder(`std::shared_ptr<${this.type}>`);
  }

  public asConst(): TypeBuilder {
    return new TypeBuilder(`const ${this.type}`);
  }

  public asRef(): TypeBuilder {
    return new TypeBuilder(`${this.type}&`);
  }

  public asConstRef(): TypeBuilder {
    return new TypeBuilder(`const ${this.type}&`);
  }

  public asPtr(): TypeBuilder {
    return new TypeBuilder(`${this.type}*`);
  }

  public asConstPtr(): TypeBuilder {
    return new TypeBuilder(`const ${this.type}*`);
  }
}
