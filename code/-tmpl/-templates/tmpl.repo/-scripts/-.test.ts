import { Fs } from '@sys/fs';

import { type t, describe, it, expect, Testing } from '../code/common/-test.ts';
import { main } from './task.prep.ts';

describe('Repo: -scripts', () => {
  it('baseline: 🐷', async () => {
    expect(123).to.eql(123);
  });

  it('prep: generates project test/build workflows from code/projects modules', async () => {
    const fs = await Testing.dir('tmpl.repo.prep').create();
    const root = fs.dir;
    const projectDir = Fs.join(root, 'code/projects/demo');
    const path = 'code/projects/demo';

    await Fs.writeJson(Fs.join(projectDir, 'deno.json'), {
      tasks: { build: 'deno task info', test: 'deno task info' },
    });

    await main(root);

    const build = (await Fs.readText(Fs.join(root, '.github/workflows/build.yaml'))).data ?? '';
    const test = (await Fs.readText(Fs.join(root, '.github/workflows/test.yaml'))).data ?? '';
    expect(build.includes(`path: ${path}`)).to.eql(true);
    expect(test.includes(`path: ${path}`)).to.eql(true);
    expect(build.includes(`name: "${path}"`)).to.eql(true);
    expect(test.includes(`name: "${path}"`)).to.eql(true);
  });
});
