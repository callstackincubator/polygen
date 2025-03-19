/**
 * Encodes a single unsafe character.
 *
 * Encoding is a done by returning a codepoint value in base16,
 * prefixed with `0x`.
 *
 * For example, a space character ' ', will be replaced with `0x20`.
 *
 * This function encodes all characters, even safe ones.
 * It is up to the caller to encode only unsafe characters.
 *
 * @param c character to encode
 * @returns Encoded character
 */
function escapeChar(c: string) {
  return '0x' + c.codePointAt(0)!.toString(16).toUpperCase();
}

/**
 * Encodes WebAssembly module name.
 *
 * This function encodes WebAssembly module name according to `w2c` logic.
 *
 * The process covers:
 *  - replacing single underscore characters with double ones,
 *  - replacing any unsafe characters with encoded ones.
 *
 * @see mangleName
 *
 * @param name Name of the module to mangle
 * @returns Encoded module name
 */
export function mangleModuleName(name: string): string {
  return mangle(name, true);
}

/**
 * Encodes WebAssembly symbol name.
 *
 * This function encodes WebAssembly symbol name according to `w2c` logic.
 *
 * The process covers:
 *  - if the name starts with underscore, it is mangled (probably due to C symbol mangling)
 *
 * @see mangleModuleName
 *
 * @param name Name of the symbol to mangle
 * @returns mangled symbol name
 */
export function mangleName(name: string): string {
  return mangle(name, false);
}

// taken from
// https://github.com/WebAssembly/wabt/blob/main/src/c-writer.cc#L746
/**
 * Name mangling transforms arbitrary Wasm names into "safe" C names
 * in a deterministic way. To avoid collisions, distinct Wasm names must be
 * transformed into distinct C names.
 *
 * The rules implemented here are:
 * 1) any hex digit ('A' through 'F') that follows the sequence "0x"
 *    is escaped
 * 2) any underscore at the beginning, at the end, or following another
 *    underscore, is escaped
 * 3) if double_underscores is set, underscores are replaced with
 *    two underscores.
 * 4) otherwise, any alphanumeric character is kept as-is,
 *    and any other character is escaped
 *
 * "Escaped" means the character is represented with the sequence "0xAB",
 * where A B are hex digits ('0'-'9' or 'A'-'F') representing the character's
 * numeric value.
 *
 * Module names are mangled with double_underscores=true to prevent
 * collisions between, e.g., a module "alfa" with export
 * "bravo_charlie" vs. a module "alfa_bravo" with export "charlie".
 */
export function mangle(name: string, doubleUnderscores: boolean): string {
  let result = '';
  let lastWasUnderscore = false;
  type State = 'any' | 'zero' | 'zerox' | 'zeroxhexdigit';
  let state: State = 'any';
  const hexDigitRegex = /^[0-9a-fA-F]$/;
  const alphaNumUnderscoreRegex = /^[0-9_a-zA-Z]$/;

  function appendEscaped(char: string) {
    result += escapeChar(char);
    lastWasUnderscore = false;
    state = 'any';
  }

  function appendVerbatim(char: string) {
    result += char;
    lastWasUnderscore = char === '_';
  }

  Array.prototype.forEach.call(name, (char, i) => {
    switch (state) {
      case 'any':
        state = char === '0' ? 'zero' : 'any';
        break;
      case 'zero':
        state = char === 'x' ? 'zerox' : 'any';
        break;
      case 'zerox':
        state = hexDigitRegex.test(char) ? 'zeroxhexdigit' : 'any';
        break;
      default:
        break;
    }

    if (state === 'zeroxhexdigit') {
      appendEscaped(char);
      return;
    }

    if (
      char === '_' &&
      (i === 0 || i === name.length - 1 || lastWasUnderscore)
    ) {
      appendEscaped(char);
      return;
    }

    if (doubleUnderscores && char === '_') {
      appendVerbatim('__');
      return;
    }

    if (alphaNumUnderscoreRegex.test(char)) {
      appendVerbatim(char);
    } else {
      appendEscaped(char);
    }
  });

  return result;
}
