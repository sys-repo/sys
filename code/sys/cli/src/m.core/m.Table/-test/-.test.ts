import { describe, it } from '../../../-test.ts';
import { Cli } from '../../mod.ts';

describe('CLI: core / m.Table', () => {
  it('creates with/without params', () => {
    const a = Cli.table([]);
    const b = Cli.table();

    a.push(['foo', 'bar']);
    b.push(['foo', 'bar']);

    console.info(String(a).trim());
    console.info(String(b).trim());
  });
});
