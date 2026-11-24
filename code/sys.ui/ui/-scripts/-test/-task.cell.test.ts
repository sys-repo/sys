import { Cell } from '@sys/cell';
import { Fs } from '@sys/fs';
import { describe, expect, it, pkg } from '../../src/-test.ts';
import { startInput } from '../task.cell.ts';

const root = Fs.Path.fromFileUrl(new URL('../../', import.meta.url));

describe('@sys/ui Cell start entry', () => {
  it('lists the proxy first but starts it after the selected view and accounts', async () => {
    const cell = await Cell.load(root);
    expect(cell.descriptor.name).to.eql('sys.ui');
    const services = cell.descriptor.services ?? [];
    const names = ['sys.ui:proxy', 'sys.ui:view', 'sys.ui:files', 'sys.ui:accounts'];
    expect(services.map(({ name }) => name)).to.eql(names);
    const [proxy, view, files, accounts] = services;
    expect(view.use).to.eql('Serve');
    expect(view.variants?.dev?.use).to.eql('ViteService');
    expect(files.startAfter).to.eql(undefined);
    expect(proxy.startAfter).to.eql([view.name, accounts.name]);
    expect(proxy.use).to.eql('HttpProxy');
    expect(proxy.variants).to.eql(undefined);
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
