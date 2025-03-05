import { Project } from '@callstack/polygen-project';
import { Command } from 'commander';
import type { GlobalOptions } from '../types.js';

function withProjectOptions<TOptions extends object>(
  func: (
    project: Project,
    options: TOptions & GlobalOptions,
    ...args: string[]
  ) => void | Promise<void>
) {
  return async (...allArgs: any[]) => {
    const args = allArgs.slice(0, -1) as string[];
    const options = allArgs[allArgs.length - 1] as TOptions & GlobalOptions;
    const project = options.project
      ? await Project.fromPath(options.project)
      : await Project.findClosest();

    await func(project, options, ...args);
  };
}

export class ProjectCommand<TOptions extends object> extends Command {
  action(
    func: (
      project: Project,
      options: TOptions & GlobalOptions,
      ...args: string[]
    ) => void | Promise<void>
  ) {
    super.action(withProjectOptions(func) as any);
    return this;
  }
}
