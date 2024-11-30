#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'node:fs/promises';
import { Project } from '@callstack/polygen-core-build';

const command = new Command('init').description(
  'Initializes React Native WebAssembly in current directory'
);

command.action(async () => {
  const project = await Project.findClosest();

  await fs.mkdir(project.pathToOutput('modules'), { recursive: true });
});

export default command;
