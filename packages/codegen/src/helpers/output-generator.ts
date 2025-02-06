import type { Stats } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Represents a map of written files and their last modified times.
 */
export type WrittenFilesMap = Record<string, number>;

/**
 * Error thrown when a file would be overwritten by the output generator.
 */
export class FileOverwriteError extends Error {
  public path: string;

  constructor(path: string) {
    super(`File ${path} already exists and would be overwritten`);
    this.path = path;
    this.name = 'FileOverwriteError';
  }
}

/**
 * Error thrown when a file would be overwritten by the output generator.
 */
export class FileExternallyChangedError extends Error {
  public path: string;

  constructor(path: string) {
    super(`File ${path} was changed externally`);
    this.path = path;
    this.name = 'FileExternallyChangedError';
  }
}

/**
 * Represents configuration options for the output generator.
 *
 * This interface is used to configure the behavior of the output generation process,
 * such as specifying directories for assets and output, and optionally enforcing
 * regeneration of outputs.
 */
export interface OutputGeneratorOptions {
  /**
   * Path to the directory containing the assets to be used during the generation process.
   */
  assetsDirectory: string;

  /**
   * Path to the directory where the generated output should be stored.
   */
  outputDirectory: string;

  /**
   * An optional flag that, if set to true, forces the generation process to overwrite existing outputs.
   */
  forceGenerate?: boolean;
}

/**
 * Helper class that generates output files and copies assets.
 */
export class OutputGenerator {
  /**
   * Configuration options for the output generator.
   */
  public readonly options: OutputGeneratorOptions;

  /**
   * Set of files that have been written by the output generator.
   */
  public readonly writtenFiles: WrittenFilesMap = {};

  /**
   * A map of previously written files, used to determine if the output files are outdated.
   */
  private readonly previousWrittenFiles?: WrittenFilesMap;

  /**
   * Local path within output directory that is currently bound to this output generator.
   *
   * For root generator this is empty, for any generator created by `forPath` method this
   * is the path that was passed to it.
   */
  private boundNestedPath: string[] = [];

  /**
   * Root output generator instance.
   *
   * For root generator this is the same instance, for any generator created by `forPath` method
   * this is the root generator instance.
   */
  private rootGenerator: OutputGenerator;

  constructor(
    options: OutputGeneratorOptions,
    previousWrittenFiles?: WrittenFilesMap
  ) {
    this.options = Object.freeze(options);
    this.previousWrittenFiles = previousWrittenFiles;
    this.rootGenerator = this;
  }

  /**
   * Generates an OutputGenerator with an updated output directory by appending the given nested directory path
   * to the base output directory.
   *
   * @param nestedDirPath The relative path to the nested directory to append to the output directory.
   * @return A new OutputGenerator instance with the updated output directory path.
   */
  public forPath(nestedDirPath: string): OutputGenerator {
    const generator = new OutputGenerator(
      this.options,
      this.previousWrittenFiles
    );
    generator.rootGenerator = this.rootGenerator;
    generator.boundNestedPath = [...this.boundNestedPath, nestedDirPath];
    return generator;
  }

  public async markAsWritten(filePath: string): Promise<void> {
    let finalPath = filePath;
    if (finalPath.startsWith(this.options.outputDirectory)) {
      finalPath = finalPath
        .substring(this.options.outputDirectory.length)
        .replace(/^\//, '');
    }
    const stat = await fs.stat(filePath);
    this.rootGenerator.writtenFiles[finalPath] = stat.mtimeMs;
  }

  /**
   * Builds path to specified file, prefixing it with output directory, if any.
   *
   * @param names Path components
   */
  public outputPathTo(...names: string[]): string {
    return path.join(
      this.options.outputDirectory,
      ...this.boundNestedPath,
      ...names
    );
  }

  /**
   * Writes the provided text to the specified file path, creating any necessary directories.
   *
   * @param to - The relative or absolute path where the text should be written.
   * @param text - The content to write to the specified file.
   * @return A promise that resolves once the text has been successfully written.
   */
  async writeTo(to: string, text: string): Promise<void> {
    const targetPath = this.outputPathTo(to);
    await this.assertSafeToWrite(targetPath);

    const dirname = path.dirname(targetPath);
    await fs.mkdir(dirname, { recursive: true });
    await fs.writeFile(targetPath, text, { encoding: 'utf8' });
    await this.markAsWritten(targetPath);
  }

  /**
   * Writes all content from the given map to respective destinations.
   *
   * @param contentMap A record where keys are destination paths and values are the content to be written.
   * @return A promise that resolves when all write operations have completed.
   */
  async writeAllTo(contentMap: Record<string, string>): Promise<void> {
    const promises = Object.entries(contentMap).map(([to, content]) =>
      this.writeTo(to, content)
    );
    await Promise.allSettled(promises);
  }

  /**
   * Copies an asset from the specified asset path to a target destination.
   *
   * @param assetPath The relative path of the asset to be copied from the assets directory.
   * @param to The target path where the asset should be copied. Defaults to the original asset path.
   * @return A promise that resolves when the asset copy operation is complete.
   */
  async copyAsset(assetPath: string, to: string = assetPath): Promise<void> {
    const targetPath = this.outputPathTo(to);
    await this.assertSafeToWrite(targetPath);

    const dirname = path.dirname(targetPath);
    await fs.mkdir(dirname, { recursive: true });

    await fs.cp(
      path.join(this.options.assetsDirectory, assetPath),
      targetPath,
      {
        recursive: true,
        errorOnExist: false,
      }
    );
    await this.markAsWritten(targetPath);
  }

  /**
   * Copies assets from the specified source locations to the corresponding target locations.
   *
   * @param assetMap A record where the key represents the source path of the asset,
   * and the value represents the target path where the asset should be copied.
   * @return A promise that resolves when all asset copy operations have been completed.
   */
  async copyAssets(assetMap: Record<string, string>): Promise<void> {
    const assets = Object.entries(assetMap);
    const promises = assets.map(async ([from, to]) => {
      await this.copyAsset(from, to);
    });
    await Promise.allSettled(promises);
  }

  /**
   * Helper method that generates specified files only when the source files
   * are newer than output files, which suggest that the output files are outdated.
   *
   * The comparison is done basing on `modified_time` attribute of every file.
   *
   * @param sources List of input files
   * @param outputs List of output files
   * @param cb Callback that generates the output files
   * @protected
   */
  async generating<R>(
    sources: string[],
    outputs: string[],
    cb: () => R
  ): Promise<R | void> {
    if (this.options.forceGenerate) {
      return cb();
    }

    const sourceStats = await Promise.all(sources.map((file) => fs.stat(file)));

    // If any of the output file does not exist, we should generate them
    let outputStats: Stats[] = [];
    try {
      outputStats = await Promise.all(outputs.map((file) => fs.stat(file)));
    } catch (e) {
      if (e && typeof e === 'object' && 'code' in e && e.code === 'ENOENT') {
        return cb();
      }

      throw e;
    }

    const sourceAccessTimes = sourceStats.map((e) => e.mtimeMs);
    const outputAccessTimes = outputStats.map((e) => e.mtimeMs);
    const latestSource = Math.max(...sourceAccessTimes);
    const oldestOutput = Math.min(...outputAccessTimes);

    if (latestSource > oldestOutput) {
      return cb();
    }
  }

  private async assertSafeToWrite(fullPath: string) {
    if (this.options.forceGenerate) {
      return;
    }

    let pathInOutputDir = fullPath;
    if (pathInOutputDir.startsWith(this.options.outputDirectory)) {
      pathInOutputDir = pathInOutputDir
        .substring(this.options.outputDirectory.length)
        .replace(/^\//, '');
    }
    const lastWrittenTime = this.previousWrittenFiles?.[pathInOutputDir];

    let mtime: number | undefined;
    try {
      mtime = (await fs.stat(fullPath)).mtimeMs;
    } catch (e) {
      if (e && typeof e === 'object' && 'code' in e && e.code !== 'ENOENT') {
        throw e;
      }
    }

    if (
      lastWrittenTime !== undefined &&
      mtime !== undefined &&
      mtime > lastWrittenTime
    ) {
      throw new FileExternallyChangedError(pathInOutputDir);
    }

    if (!lastWrittenTime && mtime !== undefined) {
      throw new FileOverwriteError(pathInOutputDir);
    }
  }
}
