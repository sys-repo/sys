import { Testing, describe, expect, it } from '../-test.ts';
import { Fs, TmplEngine } from '@sys/tmpl-engine';
import { PATHS, json } from '../m.tmpl/-bundle.ts';

describe('ui-factory.tmpl', () => {
  it('keeps the embedded template bundle in sync', async () => {
    const fs = await Testing.dir('ui-factory.tmpl');
    const file = `${fs.dir}/-bundle.json`;

    await TmplEngine.FileMap.bundle(PATHS.files, file);

    const actual = (await Fs.readText(file)).data ?? '';
    expect(JSON.parse(actual)).to.eql(json);
  });
});
