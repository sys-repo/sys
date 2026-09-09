import { describe, expect, it } from '../../-test.ts';
import { Obj } from '../mod.ts';

describe('Obj.entries', () => {
  it('empty', () => {
    const obj: Record<string, unknown> = {};
    const res = Obj.entries(obj);
    expect(res).to.eql([]);
  });

  it('typed', () => {
    type T = { foo: number; bar: string };
    const obj: T = { foo: 0, bar: 'hello' };
    const entries = Obj.entries(obj);
    expect(entries).to.eql([
      ['foo', 0],
      ['bar', 'hello'],
    ]);

    entries.forEach(([key]) => delete obj[key]);

    // @ts-expect-error entries are readonly
    entries.push(['nope', 123] as unknown as never);

    // @ts-expect-error entry tuples are readonly
    entries[0][0] = 'bar';
  });

  it('reduce: typed lookup (no casts)', () => {
    type T = Record<string, keyof typeof map>;
    const map = { copy: ['cp'], update: ['up'] } as const;
    const lookup = Obj.entries(map).reduce((acc, [command, aliases]) => {
      for (const alias of aliases) acc[alias] = command;
      return acc;
    }, {} as T);
    expect(lookup).to.eql({ cp: 'copy', up: 'update' });
  });

  it('reduce: native Object.entries loses types (sanity check)', () => {
    type T = Record<string, keyof typeof map>;
    const map = { copy: ['cp'], update: ['up'] } as const;
    Object.entries(map).reduce((acc, [command]) => {
      // @ts-expect-error Object.entries widens key to `string`
      const k: keyof typeof map = command;
      return acc;
    }, {} as T);
  });
});
