type StringMapperFunc<T> = (val: T) => string;
type StringMapper<T> = T extends string
  ? StringMapperFunc<T> | undefined
  : StringMapperFunc<T>;

/**
 * Helper function to map a value to a string using a mapper function.
 *
 * @param value
 * @param mapper
 */
function mapString<T>(value: T, mapper: StringMapper<T>): string {
  return mapper ? mapper(value) : (value as string);
}

export function toStringLiteral(
  value: string,
  mapper?: StringMapper<string>
): string;
export function toStringLiteral<T>(value: T, mapper: StringMapper<T>): string;
export function toStringLiteral<T = string>(
  value: T,
  mapper: StringMapper<T>
): string {
  const strVal = mapString(value, mapper);
  return `"${strVal.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

export function toArgumentList(
  values: string[],
  mapper?: StringMapper<string>
): string;
export function toArgumentList<T>(values: T[], mapper: StringMapper<T>): string;
export function toArgumentList<T>(
  values: T[],
  mapper: StringMapper<T>
): string {
  return values
    .map((el) => mapString(el, mapper))
    .join(', ')
    .trimEnd()
    .replace(/,$/, '');
}

export function toInitializerList(
  values: string[],
  mapper?: StringMapper<string>
): string;
export function toInitializerList<T>(
  values: T[],
  mapper: StringMapper<T>
): string;
export function toInitializerList<T>(values: T[], mapper: StringMapper<T>) {
  return `{ ${toArgumentList(values, mapper)} }`;
}
