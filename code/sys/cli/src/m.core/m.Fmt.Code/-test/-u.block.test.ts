import { c, describe, expect, it, Str, stripAnsi } from '../../../-test.ts';
import { Fmt } from '../../mod.ts';
import { block } from '../u.block.ts';

describe('Cli.Fmt.Code.block', () => {
  it('formats plain code blocks without indentation by default', () => {
    expect(block('name: example')).to.eql('name: example');
  });

  it('trims edge newlines, indents non-empty lines, and preserves blank lines', () => {
    const result = block('\nname: example\n\ntasks:\n  check: deno check ./mod.ts\n', {
      indent: 2,
    });

    expect(result).to.eql('  name: example\n\n  tasks:\n    check: deno check ./mod.ts');
  });

  it('supports optional fenced code blocks', () => {
    const result = block('name: example\n\nversion: 1', {
      lang: 'yaml',
      indent: 2,
      fence: true,
    });

    expect(stripAnsi(result)).to.eql('  ```yaml\n  name: example\n\n  version: 1\n  ```');
    expect(result).to.eql(
      `  ${c.dim(c.gray('```yaml'))}\n  name: example\n\n  version: 1\n  ${c.dim(c.gray('```'))}`,
    );
  });

  it('supports muted whole-block tone', () => {
    const result = block('name: example', { indent: 2, tone: 'muted' });

    expect(stripAnsi(result)).to.eql('  name: example');
    expect(result).to.eql(c.gray('  name: example'));
  });

  it('print sample', () => {
    const yaml = Str.dedent(`
      name: example
      version: 1

      tasks:
        check: deno check ./mod.ts
        test: deno test

      options:
        color: true
    `);
    const output = block(yaml, { indent: 2, fence: true, lang: 'yaml' });

    // Tiny sanity check so the test is not "print only".
    expect(stripAnsi(output)).to.contain('  tasks:\n    check: deno check ./mod.ts');

    const title = 'Cli.Fmt.Code.block → fenced YAML:';

    console.info();
    console.info(c.green(title));
    console.info(Fmt.hr('green'));
    console.info();
    console.info(output);
    console.info();
  });
});
