import { describe, expect, it } from '../-test.ts';
import { Tmpl } from '../m.Tmpl/mod.ts';
import { SAMPLE } from './-u.ts';
import { Log } from './mod.ts';

describe('Tmpl.Log', () => {
  it('API', () => {
    expect(Tmpl.Log).to.equal(Log);
  });

  it('log table', async () => {
    const test = SAMPLE.init();
    let change = false;
    const tmpl = Tmpl.create(test.source, (e) => {
      if (change) e.modify('// foo');
    });

    const res1 = await tmpl.copy(test.target);
    const res2 = await tmpl.copy(test.target);
    change = true;
    const res3 = await tmpl.copy(test.target);

    const table1 = Tmpl.Log.ops(res1.ops).table();
    const table2 = Tmpl.Log.ops(res2.ops).table();
    const table3 = Tmpl.Log.ops(res3.ops).table();

    expect(table1.toString()).to.include('Created');
    expect(table1.toString()).to.not.include('Updated');
    expect(table1.toString()).to.not.include('Unchanged');

    expect(table2.toString()).to.not.include('Created');
    expect(table2.toString()).to.not.include('Updated');
    expect(table2.toString()).to.include('Unchanged');

    expect(table3.toString()).to.not.include('Created');
    expect(table3.toString()).to.include('Updated');
    expect(table3.toString()).to.not.include('Unchanged');
  });
});
