import { Cell } from '@sys/cell';
import { Fs } from '@sys/fs';
import { describe, expect, it, pkg } from '../../src/-test.ts';
import { startInput } from '../task.cell.ts';

const root = Fs.Path.fromFileUrl(new URL('../../', import.meta.url));

describe('@sys/ui Cell start entry', () => {
  it('loads the declared Cell identity', async () => {
    const cell = await Cell.load(root);
    expect(cell.descriptor.name).to.eql('sys.ui');
  });

  it('declares the same loopback account listener in both modes', async () => {
    const cell = await Cell.load(root);
    const listener = { kind: 'tcp-listener', host: '127.0.0.1', port: 5051 };
    for (const mode of ['default', 'dev'] as const) {
      const { resources } = await Cell.Services.resources(cell, { mode });
      const accounts = resources.filter(({ service }) => service.name === 'sys.ui:accounts');
      expect(accounts).to.have.length(1);
      const [account] = accounts;
      expect(account.resource).to.eql(listener);
      expect(account.selection.variant).to.eql(undefined);
    }
  });

  it('opts in to JSR release navigation with generated package provenance in both start modes', () => {
    expect(startInput(['--mode', 'dev', '--reporter', 'auto'])).to.eql({
      argv: ['start', '.', '--mode', 'dev', '--reporter', 'auto'],
      versionLink: 'jsr',
      pkg,
    });
    expect(startInput(['--reporter', 'auto'])).to.eql({
      argv: ['start', '.', '--reporter', 'auto'],
      versionLink: 'jsr',
      pkg,
    });
  });
});
