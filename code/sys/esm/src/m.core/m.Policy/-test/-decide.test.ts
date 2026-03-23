import { type t, describe, expect, it } from '../../../-test.ts';
import { Esm } from '../../mod.ts';

describe('Esm.Policy.decide', () => {
  const entry: t.EsmDeps.Entry = { module: Esm.parse('jsr:@sys/pkg@1.2.3'), target: ['deno.json'] };

  it('blocks when policy mode is none', () => {
    const res = Esm.Policy.decide({
      policy: { mode: 'none' },
      subject: { entry, current: '1.2.3', available: ['1.2.4'] },
    });

    expect(res.ok).to.eql(false);
    if (!res.ok) expect(res.reason.code).to.eql('policy:none');
  });

  it('blocks excluded dependencies', () => {
    const res = Esm.Policy.decide({
      policy: { mode: 'latest', exclude: ['@sys/pkg'] },
      subject: { entry, current: '1.2.3', available: ['2.0.0'] },
    });

    expect(res.ok).to.eql(false);
    if (!res.ok) expect(res.reason.code).to.eql('policy:excluded');
  });

  it('selects the highest allowed patch version', () => {
    const res = Esm.Policy.decide({
      policy: { mode: 'patch' },
      subject: { entry, current: '1.2.3', available: ['2.0.0', '1.3.0', '1.2.5', '1.2.4'] },
    });

    expect(res.ok).to.eql(true);
    if (res.ok) expect(res.selection.selected).to.eql({ version: '1.2.5' });
  });

  it('selects the highest allowed minor version', () => {
    const res = Esm.Policy.decide({
      policy: { mode: 'minor' },
      subject: { entry, current: '1.2.3', available: ['2.0.0', '1.4.0', '1.3.2'] },
    });

    expect(res.ok).to.eql(true);
    if (res.ok) expect(res.selection.selected).to.eql({ version: '1.4.0' });
  });

  it('blocks when no newer version exists', () => {
    const res = Esm.Policy.decide({
      policy: { mode: 'latest' },
      subject: { entry, current: '1.2.3', available: ['1.2.3'] },
    });

    expect(res.ok).to.eql(false);
    if (!res.ok) expect(res.reason.code).to.eql('version:not-newer');
  });

  it('blocks when newer versions exist but are not allowed', () => {
    const res = Esm.Policy.decide({
      policy: { mode: 'patch' },
      subject: { entry, current: '1.2.3', available: ['1.3.0', '2.0.0'] },
    });

    expect(res.ok).to.eql(false);
    if (!res.ok) expect(res.reason.code).to.eql('version:not-allowed');
  });

  it('selects the latest version when policy mode is latest', () => {
    const res = Esm.Policy.decide({
      policy: { mode: 'latest' },
      subject: { entry, current: '1.2.3', available: ['1.2.4', '2.0.0', '1.9.0'] },
    });

    expect(res.ok).to.eql(true);
    if (res.ok) expect(res.selection.selected).to.eql({ version: '2.0.0', latest: true });
  });
});
