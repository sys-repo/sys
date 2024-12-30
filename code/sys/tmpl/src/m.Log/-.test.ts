import { Path, describe, expect, it, stripAnsi } from '../-test.ts';
import { Tmpl } from '../m.Tmpl/mod.ts';
import { SAMPLE } from '../m.Tmpl/-u.ts';
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

    const table1 = Log.table(res1.ops);
    const table2 = Log.table(res2.ops);
    const table3 = Log.table(res3.ops);

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

  it('trimBase:<path>', async () => {
    const test = SAMPLE.init();
    const tmpl = Tmpl.create(test.source, (e) => {});
    const res = await tmpl.copy(test.target);

    const trimBase = Path.trimCwd(test.target) + '/';
    const table = Log.table(res.ops, { trimBase });
    expect(stripAnsi(table.toString())).to.include('  .gitignore');
  });

  it('empty', async () => {
    const test = SAMPLE.init();
    const tmpl = Tmpl.create(test.source).filter(() => false);
    const res = await tmpl.copy(test.target);
    const table = Log.table(res.ops);
    expect(table).to.include('No items to display');
  });
});
