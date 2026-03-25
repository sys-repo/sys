import { Fs } from '@sys/fs';
import { Workspace } from '@sys/workspace/testing';
import { describe, it } from '../code/common/-test.ts';

const cwd = Fs.resolve(import.meta.dirname ?? '.', '..');

describe('Repo Scripts', () => {
  it('workspace/scripts', async () => {
    if (!(await Fs.exists(Fs.join(cwd, 'deno.json')))) return;
    await Workspace.Test.scripts(cwd);
  });
});
