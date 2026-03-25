import { Fs } from '@sys/fs';
import { describe, expect, it, Testing } from '../code/common/-test.ts';
import { main } from './task.prep.ts';

describe('Repo: -scripts', () => {
  it('prep: generates project test/build workflows from code/projects modules', async () => {
    const fs = await Testing.dir('tmpl.repo.prep');
    const root = fs.dir;
    const path = 'code/projects/demo';
    const projectDir = Fs.join(root, path);
    await Fs.writeJson(Fs.join(root, 'deno.json'), { workspace: [path] });
    await Fs.writeJson(Fs.join(projectDir, 'deno.json'), {
      tasks: {
        build: 'deno task info',
        test: 'deno task info',
      },
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
