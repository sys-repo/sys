import { Cell } from '@sys/cell';
import { Fs } from '@sys/fs';
import { describe, expect, it, pkg } from '../src/-test.ts';
import { startInput } from './task.cell.ts';

const root = Fs.Path.fromFileUrl(new URL('../', import.meta.url));

describe('@sys/ui Cell start entry', () => {
  it('loads the declared Cell identity', async () => {
    const cell = await Cell.load(root);
    expect(cell.descriptor.name).to.eql('sys.ui');
  });

  it('passes generated package provenance to both start modes', () => {
    expect(startInput(['--mode', 'dev', '--reporter', 'auto'])).to.eql({
      argv: ['start', '.', '--mode', 'dev', '--reporter', 'auto'],
      pkg,
    });
    expect(startInput(['--reporter', 'auto'])).to.eql({
      argv: ['start', '.', '--reporter', 'auto'],
      pkg,
    });
  });
});
