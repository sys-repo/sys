import { stripAnsi } from '@sys/cli/fmt';
import { describe, expect, it } from '../../-test.ts';
import { entry } from '../-entry.ts';

type RunResult = {
  readonly exitCode: number;
  readonly raw: string;
  readonly text: string;
};

describe('m.tmpl/-entry dsl', () => {
  it('dsl → renders root DSL help', async () => {
    const res = await run(['dsl']);

    expect(res.exitCode).to.eql(0);
    expect(res.text).to.contain('@sys/tmpl dsl');
    expect(res.text).to.contain('Templater DSL:');
    expect(res.text).to.contain('Usage');
    expect(res.text).to.contain('deno run -ERW jsr:@sys/tmpl dsl [chapter...]');
    expect(res.text).to.contain('Decision protocol');
    expect(res.text).to.contain('Command grammar');
    expect(res.text).to.contain('Chapter');
    expect(res.text).to.contain('deno run -ERW jsr:@sys/tmpl dsl repo');
  });

  it('dsl repo → renders the repo chapter', async () => {
    const res = await run(['dsl', 'repo']);

    expect(res.exitCode).to.eql(0);
    expect(res.text).to.contain('@sys/tmpl dsl repo');
    expect(res.text).to.contain('Scaffold a system workspace root');
    expect(res.text).to.contain('Use `repo` only for a workspace root.');
    expect(res.text).to.contain('Do not use `jsr:@sys/tmpl/repo`.');
  });

  it('dsl m.mod.ui --format skill → renders skill Markdown', async () => {
    const res = await run(['dsl', 'm.mod.ui', '--format', 'skill']);

    expect(res.exitCode).to.eql(0);
    expect(res.raw).to.eql(res.text);
    expect(res.text).to.contain('---\nname: "sys-tmpl-dsl-m-mod-ui"');
    expect(res.text).to.contain('# UI module template');
    expect(res.text).to.contain('## Slots');
    expect(res.text).to.contain('Required: `--name <ComponentName>`.');
    expect(res.text).to.not.contain('@sys/tmpl dsl m.mod.ui');
  });

  it('dsl --format human → preserves human DSL help', async () => {
    const res = await run(['dsl', '--format=human']);

    expect(res.exitCode).to.eql(0);
    expect(res.text).to.contain('@sys/tmpl dsl');
    expect(res.text).to.contain('Chapter');
    expect(res.text).to.contain('deno run -ERW jsr:@sys/tmpl dsl pkg');
  });

  it('dsl --format unknown → fails clearly', async () => {
    const res = await run(['dsl', '--format', 'xml']);

    expect(res.exitCode).to.eql(1);
    expect(res.text).to.contain('Failed: Unsupported dsl format: xml (expected: human, skill)');
  });

  it('dsl --format without value → fails clearly', async () => {
    const res = await run(['dsl', '--format']);

    expect(res.exitCode).to.eql(1);
    expect(res.text).to.contain('Failed: Option requires a value: --format');
  });

  it('dsl repeated --format → fails clearly', async () => {
    const res = await run(['dsl', '--format', 'human', '--format', 'skill']);

    expect(res.exitCode).to.eql(1);
    expect(res.text).to.contain('Failed: Repeated option for dsl: --format');
  });

  it('dsl with scaffold flags → rejects the scaffold path', async () => {
    const res = await run(['dsl', '--dir', 'src/m.Foo']);

    expect(res.exitCode).to.eql(1);
    expect(res.text).to.contain('Failed: Unexpected flag for dsl: --dir');
  });

  it('dsl unknown → fails clearly', async () => {
    const res = await run(['dsl', 'missing']);

    expect(res.exitCode).to.eql(1);
    expect(res.text).to.contain('Failed: TmplHelp: DSL chapter not found: missing');
  });
});

async function run(argv: readonly string[]): Promise<RunResult> {
  const lines: string[] = [];
  const info = console.info;
  const warn = console.warn;
  const previousExitCode = Deno.exitCode;

  try {
    console.info = (...args: unknown[]) => lines.push(args.map(String).join(' '));
    console.warn = (...args: unknown[]) => lines.push(args.map(String).join(' '));
    Deno.exitCode = 0;

    await entry([...argv]);

    const raw = lines.join('\n');
    return { exitCode: Deno.exitCode, raw, text: stripAnsi(raw) };
  } finally {
    console.info = info;
    console.warn = warn;
    Deno.exitCode = previousExitCode;
  }
}
