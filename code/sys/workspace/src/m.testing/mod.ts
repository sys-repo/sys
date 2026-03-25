/**
 * @module
 * Test helpers for workspace structure.
 */
import { Fs, Process } from './common.ts';
import { Workspace as Base } from '../mod.Workspace.ts';
import type { t } from './common.ts';

export const WorkspaceTesting: t.WorkspaceTesting.Test.Lib = {
  async scripts(cwd = Fs.cwd()) {
    const output = await Process.invoke({
      cwd,
      cmd: 'deno',
      args: ['task', 'prep'],
      silent: true,
    });
    if (!output.success) throw new Error(wrangle.prepFailure(cwd, output));

    const path = Base.Prep.State.graphFile(cwd);
    const snapshot = await Base.Graph.Snapshot.read(path);
    if (!snapshot) {
      throw new Error(`Workspace.Test.scripts: missing or invalid graph snapshot at "${path}"`);
    }
  },
};

export const Workspace = { ...Base, Test: WorkspaceTesting };

/**
 * Helpers:
 */
const wrangle = {
  prepFailure(cwd: t.StringDir, output: t.ProcOutput) {
    const stdout = output.text.stdout.trim();
    const stderr = output.text.stderr.trim();
    const text = [stdout, stderr].filter(Boolean).join('\n\n');
    const detail = text ? `\n\n${text}` : '';
    return `Workspace.Test.scripts: 'deno task prep' failed in "${cwd}" (code ${output.code})${detail}`;
  },
} as const;
