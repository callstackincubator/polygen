import { BinaryReader } from '@callstack/polygen-binary-utils';
import { WebAssemblyDecodeError } from './errors.js';
import {
  readFunctionType,
  readGlobalType,
  readMemoryType,
  readTableType,
} from './type-reader.js';
import type {
  CustomSection,
  Export,
  ExportDescriptor,
  ExportSection,
  FunctionSection,
  Global,
  GlobalSection,
  Import,
  ImportDescriptor,
  ImportSection,
  MemorySection,
  Section,
  TableSection,
  TypeSection,
} from './types.js';
import { readString, readVector } from './utils.js';

type SectionReader =
  | ((reader: BinaryReader) => Section | undefined)
  | ((reader: BinaryReader, size: number) => Section | undefined);

/**
 * A map of section handlers used for processing various sections of a binary format.
 * Each entry in the map associates a section identifier with a corresponding function, known
 * as a 'SectionReader', that is responsible for reading or handling that specific section.
 *
 * The handlers are intended for a sequential process that needs to interpret or skip sections
 * in a structured binary data, such as a WebAssembly module. The keys in the map correspond to
 * section indices, and the values are the functions that execute the appropriate processing
 * for that section.
 *
 * This allows for a modular approach, where new sections can be handled by adding new handler
 * functions and assigning them to the appropriate section index in this map.
 *
 * Sections 0-11 are processed with specified functions, while sections 8-12 are designated to
 * be skipped by using the 'skipSection' handler.
 */
const HANDLERS = new Map<number, SectionReader>([
  [0, readCustomSection],
  [1, readTypeSection],
  [2, readImportSection],
  [3, readFunctionSection],
  [4, readTableSection],
  [5, readMemorySection],
  [6, readGlobalSection],
  [7, readExportSection],
  [8, skipSection],
  [9, skipSection],
  [10, skipSection],
  [11, skipSection],
  [12, skipSection],
]);

/**
 * Reads the descriptor from the given BinaryReader and returns a Descriptor object.
 *
 * @param reader - An instance of BinaryReader used to read the descriptor information.
 * @return A Descriptor object that represents the type and index
 *         of the descriptor read from the binary data.
 *         The type is one of 'function', 'table', 'memory', or 'global'.
 * @throws WebAssemblyDecodeError if an unknown descriptor byte is encountered.
 */
function readImportDescriptor(reader: BinaryReader): ImportDescriptor {
  const startOffset = reader.currentOffset;
  const byte = reader.readByte();
  switch (byte) {
    case 0: {
      const index = reader.readUnsignedLEB128();
      return { type: 'function', index };
    }
    case 1: {
      const table = readTableType(reader);
      return { type: 'table', table };
    }
    case 2: {
      const memory = readMemoryType(reader);
      return { type: 'memory', memory };
    }
    case 3: {
      const global = readGlobalType(reader);
      return { type: 'global', global };
    }
    default:
      throw new WebAssemblyDecodeError(
        `Unknown descriptor '${byte.toString(16)}', expected one of [0x00, 0x01, 0x02, 0x03]`,
        startOffset
      );
  }
}

/**
 * Reads the descriptor from the given BinaryReader and returns a Descriptor object.
 *
 * @param reader - An instance of BinaryReader used to read the descriptor information.
 * @return A Descriptor object that represents the type and index
 *         of the descriptor read from the binary data.
 *         The type is one of 'function', 'table', 'memory', or 'global'.
 * @throws WebAssemblyDecodeError if an unknown descriptor byte is encountered.
 */
function readExportDescriptor(reader: BinaryReader): ExportDescriptor {
  const startOffset = reader.currentOffset;
  const byte = reader.readByte();
  const index = reader.readUnsignedLEB128();
  switch (byte) {
    case 0:
      return { type: 'function', index };
    case 1:
      return { type: 'table', index };
    case 2:
      return { type: 'memory', index };
    case 3:
      return { type: 'global', index };
    default:
      throw new WebAssemblyDecodeError(
        `Unknown descriptor '${byte.toString(16)}', expected one of [0x00, 0x01, 0x02, 0x03]`,
        startOffset
      );
  }
}

/**
 * Reads the section header from the given BinaryReader and returns the section ID and size.
 *
 * @param reader - The BinaryReader instance used to read the section header from a binary stream.
 * @return A tuple where the first element is the section ID as a number, and the second element is the section size as a number.
 */
function readSectionHeader(reader: BinaryReader): [number, number] {
  const id = reader.readByte();
  const size = reader.readUnsignedLEB128();
  return [id, size];
}

/**
 * Skips a section of a binary stream.
 *
 * @param reader The BinaryReader instance used to read the binary stream.
 * @param size The number of bytes to skip in the binary stream.
 * @return Always returns undefined.
 */
function skipSection(reader: BinaryReader, size: number): Section | undefined {
  reader.skip(size);
  return undefined;
}

/**
 * Reads a custom section from a binary reader and returns its representation.
 *
 * This function assumes the binary reader points to beginning of the section.
 *
 * @param reader - An instance of BinaryReader used to read the section data.
 * @param size - Size of the section
 * @return An object representing the section.
 */
function readCustomSection(reader: BinaryReader, size: number): CustomSection {
  const startOffset = reader.currentOffset;
  const name = readString(reader);
  const nameLength = reader.currentOffset - startOffset;
  const remainingBytesCount = size - nameLength;
  const data = reader.readBytes(remainingBytesCount);
  return { type: 'custom', name: name, data };
}

/**
 * Reads a type section from a binary reader and returns its representation.
 *
 * This function assumes the binary reader points to beginning of the section.
 *
 * @param reader - An instance of BinaryReader used to read the section data.
 * @return An object representing the section.
 */
function readTypeSection(reader: BinaryReader): TypeSection {
  const types = readVector(reader, () => readFunctionType(reader));
  return { type: 'type', types };
}

/**
 * Reads an import section from a binary reader and returns its representation.
 *
 * This function assumes the binary reader points to beginning of the section.
 *
 * @param reader - An instance of BinaryReader used to read the section data.
 * @return An object representing the section.
 */
function readImportSection(reader: BinaryReader): ImportSection {
  function readImport(): Import {
    const module = readString(reader);
    const name = readString(reader);
    const descriptor = readImportDescriptor(reader);
    return { module, name, descriptor };
  }
  const imports = readVector(reader, readImport);
  return { type: 'import', imports };
}

/**
 * Reads a function section from a binary reader and returns its representation.
 *
 * This function assumes the binary reader points to beginning of the section.
 *
 * @param reader - An instance of BinaryReader used to read the section data.
 * @return An object representing the section.
 */
function readFunctionSection(reader: BinaryReader): FunctionSection {
  const indices = readVector(reader, () => reader.readUnsignedLEB128());
  return { type: 'function', indices };
}

/**
 * Reads a table section from a binary reader and returns its representation.
 *
 * This function assumes the binary reader points to beginning of the section.
 *
 * @param reader - An instance of BinaryReader used to read the section data.
 * @return An object representing the section.
 */
function readTableSection(reader: BinaryReader): TableSection {
  const tables = readVector(reader, () => readTableType(reader));
  return { type: 'table', tables };
}

/**
 * Reads a memory section from the given binary reader.
 *
 * This function assumes the binary reader points to beginning of the section.
 *
 * @param reader - An instance of BinaryReader used to read the section data.
 * @return An object representing the section.
 */
function readMemorySection(reader: BinaryReader): MemorySection {
  const memories = readVector(reader, () => readMemoryType(reader));
  return { type: 'memory', memories };
}

/**
 * Reads a global section from a binary reader and returns its representation.
 *
 * This function assumes the binary reader points to beginning of the section.
 *
 * @param reader - An instance of BinaryReader used to read the section data.
 * @return An object representing the section.
 */
function readGlobalSection(reader: BinaryReader): GlobalSection {
  function readGlobal(): Global {
    const type = readGlobalType(reader);
    reader.skipUntilByte(0x0b); // we do not parse exprs
    return { type };
  }
  const globals = readVector(reader, readGlobal);
  return { type: 'global', globals };
}

/**
 * Reads the export section from a binary data stream using a BinaryReader.
 *
 * This function assumes the binary reader points to beginning of the section.
 *
 * @param reader - An instance of BinaryReader used to read data from the binary stream.
 * @return An object representing the section.
 */
function readExportSection(reader: BinaryReader): ExportSection {
  function readExport(): Export {
    const name = readString(reader);
    const descriptor = readExportDescriptor(reader);
    return { name, descriptor };
  }
  const exports = readVector(reader, readExport);
  return { type: 'export', exports };
}

/**
 * Reads sections from the provided BinaryReader and yields each parsed section.
 *
 * @param reader - The BinaryReader instance used to read sections from binary data.
 * @returns An iterable iterator of Section objects parsed from the binary reader.
 * @throws WebAssemblyDecodeError if an unknown section ID is encountered.
 */
export function* readSections(reader: BinaryReader): IterableIterator<Section> {
  while (!reader.isEmpty) {
    const startOffset = reader.currentOffset;
    const [id, size] = readSectionHeader(reader);
    const end = reader.currentOffset + size;
    const handler = HANDLERS.get(id);
    if (!handler) {
      throw new WebAssemblyDecodeError(
        `Unknown section with ID '${id.toString(16)}'`,
        startOffset
      );
    }
    const section = handler(reader, size);
    if (section) {
      yield section;
    }

    if (reader.currentOffset !== end) {
      throw new WebAssemblyDecodeError(
        `Section handler for ID '${id}' did not consume all bytes, ${end - reader.currentOffset} bytes remaining`,
        reader.currentOffset
      );
    }
  }
}
