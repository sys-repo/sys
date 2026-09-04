import { c, describe, expect, it, Str, stripAnsi } from '../../../-test.ts';
import { Fmt } from '../../mod.ts';
import { block } from '../u.block.ts';
import { highlight } from '../u.highlight.ts';

const hasAnsi = /\x1b\[[0-9;]*m/;

describe('Cli.Fmt.Code.highlight', () => {
  it('renders Shiki-highlighted ANSI while preserving block layout', async () => {
    const source = Str.dedent(`
      const value = 1
      const next = value + 1
    `);

    const result = await highlight(source, { lang: 'ts', indent: 2, fence: true });

    expect(stripAnsi(result)).to.eql(
      stripAnsi(block(source, { lang: 'ts', indent: 2, fence: true })),
    );
    expect(hasAnsi.test(result)).to.eql(true);
  });

  it('defaults the Shiki theme to Monokai', async () => {
    const source = 'const value = 1';

    const implicit = await highlight(source, { lang: 'ts' });
    const explicit = await highlight(source, { lang: 'ts', theme: 'monokai' });
    expect(implicit).to.eql(explicit);
  });

  it('preserves blank lines through Shiki highlighting and indentation', async () => {
    const source = Str.dedent(`
      const first = 1

      const second = first + 1
    `);

    const result = await highlight(source, { lang: 'ts', indent: 2 });
    expect(stripAnsi(result)).to.eql(block(source, { indent: 2 }));
    expect(stripAnsi(result).split('\n')[1]).to.eql('');
  });

  it('uses generic Shiki language fixtures without domain-specific examples', async () => {
    const source = Str.dedent(`
      name: example
      enabled: true
    `);

    const result = await highlight(source, { lang: 'yaml', indent: 2 });
    expect(stripAnsi(result)).to.eql('  name: example\n  enabled: true');
    expect(hasAnsi.test(result)).to.eql(true);
  });

  it('print sample: YAML', async () => {
    const source = Str.dedent(`
      name: example
      version: 1

      tasks:
        check: deno check ./mod.ts
        test: deno test

      options:
        color: true
    `);
    const output = await highlight(source, { lang: 'yaml', indent: 2, fence: true });

    // Tiny sanity check so the test is not "print only".
    expect(stripAnsi(output)).to.contain('  tasks:\n    check: deno check ./mod.ts');
    expect(hasAnsi.test(output)).to.eql(true);

    const title = 'Cli.Fmt.Code.highlight → fenced YAML:';

    console.info();
    console.info(c.green(title));
    console.info(Fmt.hr('green'));
    console.info();
    console.info(output);
    console.info();
  });

  it('print sample: TypeScript', async () => {
    const source = Str.dedent(`
      type Example = {
        readonly name: string;
        readonly enabled: boolean;
      };

      const example: Example = {
        name: 'demo',
        enabled: true,
      };
    `);
    const output = await highlight(source, { lang: 'ts', indent: 2, fence: true });

    // Tiny sanity check so the test is not "print only".
    expect(stripAnsi(output)).to.contain('  const example: Example = {');
    expect(hasAnsi.test(output)).to.eql(true);

    const title = 'Cli.Fmt.Code.highlight → fenced TypeScript:';

    console.info();
    console.info(c.green(title));
    console.info(Fmt.hr('green'));
    console.info();
    console.info(output);
    console.info();
  });
});
