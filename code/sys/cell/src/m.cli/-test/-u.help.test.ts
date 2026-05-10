import { describe, expect, it } from '../../-test.ts';
import { CellHelp } from '../../m.help/mod.ts';
import { Str, stripAnsi } from '../common.ts';
import { FmtHelp } from '../u.help.ts';
import { Tmpl } from '../u.tmpl.ts';

describe('FmtHelp', () => {
  it('uses conceptual @sys/cell command titles', async () => {
    expect(stripAnsi(await FmtHelp.output())).to.contain('@sys/cell');
    expect(stripAnsi(await FmtHelp.initOutput())).to.contain('@sys/cell init');
    expect(stripAnsi(await FmtHelp.dslOutput())).to.contain('@sys/cell dsl');
  });

  it('init --help --agent → renders command-specific agent facts', async () => {
    const text = stripAnsi(await FmtHelp.initOutput({ agent: true }));
    const guidance = await CellHelp.Init.load();
    const agent = sectionItems(between(text, 'Agent', 'Writes'), 'Agent');
    const writes = sectionItems(between(text, 'Writes', 'Owns'), 'Writes');
    const owns = sectionItems(between(text, 'Owns', 'Descriptor'), 'Owns');

    expect(agent).to.eql([...guidance.agent]);
    expect(writes).to.eql([...Tmpl.minimalWritePaths()]);
    expect(owns).to.eql([...Tmpl.minimalOwnedPaths()]);
    expect(writes).to.contain('.gitignore');
    expect(owns).to.not.contain('.gitignore');

    const descriptor = await Tmpl.minimalDescriptor();
    const renderedDescriptor = descriptorBlock(descriptor);

    const descriptorTail = after(text, 'Descriptor');

    expect(text).to.contain(renderedDescriptor);
    expect(text).to.not.contain('Descriptor   ```yaml');
    expect(descriptorTail).to.not.contain('```yaml');
    descriptorLines(descriptor).forEach((line) => {
      expect(text).to.contain(line);
    });
  });

  it('dsl → renders the root chapter with child chapter index', async () => {
    const text = stripAnsi(await FmtHelp.dslOutput());
    const guidance = await CellHelp.Dsl.load();

    expect(text).to.contain('Cell DSL (domain-specific-language):');
    expect(text).to.contain(guidance.summary.split('\n')[0]);
    expect(text).to.contain('Usage');
    expect(text).to.contain('deno run -ER jsr:@sys/cell dsl [chapter...] [--format <format>]');
    expect(text).to.contain('Options');
    expect(text).to.contain('--format <format>');
    expect(text).to.contain('render output as human or skill');
    expect(text).to.contain('-h, --help');
    expect(text).to.contain('Formats');
    expect(text).to.contain('human');
    expect(text).to.contain('terminal help output (default)');
    expect(text).to.contain('skill');
    expect(text).to.contain('agent-skill Markdown projection of the requested DSL chapter');
    expect(text).to.contain('━'.repeat(8));
    expect(text.indexOf('agent-skill Markdown projection')).to.be.lessThan(text.indexOf('Rule'));
    expect(text.indexOf('━'.repeat(8))).to.be.lessThan(text.indexOf('Rule'));
    expect(text).to.contain('Topology IDs');
    expect(text).to.contain('^[a-z][a-z0-9.-]*$');
    expect(text).to.contain('Do not use `:`, `_`, `/`, spaces, or uppercase letters');
    expect(text).to.contain('If a requested ID is invalid, stop and ask for a valid ID');
    expect(text).to.contain('Speech acts');
    expect(text).to.contain('add an @sys/http static service for <view>');
    expect(text).to.contain('pull latest configured views');
    expect(text).to.contain('pull latest configured views → run `@sys/tools pull`');
    expect(text).to.contain('do not edit `cell.yaml` for refresh-only pulls');
    expect(text).to.contain(
      'add @sys/http static service → run `@sys/http/server/static config add`',
    );
    expect(text).to.contain('do not use `@sys/tools serve` for Cell runtime static services');
    expect(text).to.contain('Owners');
    expect(text).to.contain('Start from public `--help` surfaces');
    expect(text).to.contain('retry once with `--reload` as a troubleshooting move');
    expect(text).to.contain('continue with normal non-`--reload` owner commands');
    expect(text).to.contain(
      'Do not hand-author owner YAML just because cached public help was stale',
    );
    expect(text).to.contain('inspect the published JSR package docs/source');
    expect(text).to.contain(
      'Do not use source inspection to bypass owner CLI/API config affordances',
    );
    expect(text).to.contain('Mappings');
    expect(text).to.contain('Chapter');
    expect(text).to.contain('deno run -ER jsr:@sys/cell dsl pulled-view');
    expect(text).to.contain('# Add a view backed by an `@sys/tools/pull` config.');
    expect(text).to.contain('deno run -ER jsr:@sys/cell dsl static-http-service');
    expect(text).to.contain(
      '# Add an @sys/http static runtime service backed by `@sys/http/server/static` config.',
    );
    expect(text).to.contain('deno run -ER jsr:@sys/cell dsl runtime-service');
    expect(text).to.contain('# Add a trusted lifecycle service backed by a service-owned config.');
    expect(text).to.contain('deno run -ER jsr:@sys/cell dsl proxy-service');
    expect(text).to.contain('# Add a runtime service backed by `@sys/http/server/proxy` config.');
    expect(text).to.contain('deno run -ER jsr:@sys/cell dsl start-runtime');
    expect(text).to.contain('# Start a composed Cell runtime from a Cell folder.');
    expect(chapterCommentColumn(text, 'pulled-view')).to.eql(
      chapterCommentColumn(text, 'static-http-service'),
    );
    expect(chapterCommentColumn(text, 'pulled-view')).to.eql(
      chapterCommentColumn(text, 'runtime-service'),
    );
    expect(chapterCommentColumn(text, 'pulled-view')).to.eql(
      chapterCommentColumn(text, 'proxy-service'),
    );
    expect(chapterCommentColumn(text, 'pulled-view')).to.eql(
      chapterCommentColumn(text, 'start-runtime'),
    );
    expect(text).to.not.contain('Slot policy');
    expect(guidance.chapters.map((chapter) => chapter.id)).to.eql([
      'pulled-view',
      'static-http-service',
      'runtime-service',
      'proxy-service',
      'start-runtime',
    ]);
  });

  it('dsl --format skill → renders the root DSL chapter as a skill projection', async () => {
    const text = await FmtHelp.dslOutput({ format: 'skill' });

    expect(text).to.eql(stripAnsi(text));
    expect(text).to.contain('---\nname: "sys-cell-dsl"');
    expect(text).to.contain(
      'description: "Guides Cell DSL speech acts, owner rules, mappings, and chapters; use when changing a Cell folder."',
    );
    expect(text).to.contain('Use these acts, owner rules, mappings, and chapters');
    expect(text).to.contain('# Cell DSL');
    expect(text).to.contain('## Rule');
    expect(text).to.contain('## Topology IDs');
    expect(text).to.contain('## Chapters');
    expect(text).to.contain(
      '- `deno run -ER jsr:@sys/cell dsl pulled-view --format skill` — Add a view backed by an `@sys/tools/pull` config.',
    );
    expect(text).to.contain(
      '- `deno run -ER jsr:@sys/cell dsl start-runtime --format skill` — Start a composed Cell runtime from a Cell folder.',
    );
    expect(text).to.not.contain('Chapter   deno run -ER');
  });

  it('dsl pulled-view --format skill → renders deterministic child skill metadata', async () => {
    const text = await FmtHelp.dslOutput({ path: ['pulled-view'], format: 'skill' });

    expect(text).to.eql(stripAnsi(text));
    expect(text).to.contain('name: "sys-cell-dsl-pulled-view"');
    expect(text).to.contain(
      'description: "Guides valid Cell folder edits; use when you need to add a view backed by an @sys/tools/pull config."',
    );
    expect(text).to.contain('# Pulled view');
    expect(text).to.contain('Add a view backed by an `@sys/tools/pull` config.');
    expect(text).to.contain('## Slot policy');
    expect(text).to.contain('Confirm proposed paths before writing.');
    expect(text).to.not.contain('## Chapters');
    expect(text).to.not.contain('@sys/cell dsl pulled-view');
  });

  it('dsl --format skill → emits canonical skill metadata for every current chapter', async () => {
    const cases = [
      { path: [], name: 'sys-cell-dsl' },
      { path: ['pulled-view'], name: 'sys-cell-dsl-pulled-view' },
      { path: ['static-http-service'], name: 'sys-cell-dsl-static-http-service' },
      { path: ['runtime-service'], name: 'sys-cell-dsl-runtime-service' },
      { path: ['proxy-service'], name: 'sys-cell-dsl-proxy-service' },
      { path: ['start-runtime'], name: 'sys-cell-dsl-start-runtime' },
    ] as const;

    for (const item of cases) {
      const text = await FmtHelp.dslOutput({ path: item.path, format: 'skill' });
      const meta = frontmatter(text);

      expect(meta.name).to.eql(item.name);
      expect(/^[a-z0-9-]+$/.test(meta.name ?? '')).to.eql(true);
      expect(meta.description).to.contain('use when');
    }
  });

  it('dsl pulled-view → faithfully renders the requested chapter', async () => {
    const text = stripAnsi(await FmtHelp.dslOutput({ path: ['pulled-view'] }));
    const guidance = await CellHelp.Dsl.load(['pulled-view']);

    expect(text).to.contain('@sys/cell dsl pulled-view');
    expect(text).to.contain(guidance.summary);
    expect(text).to.contain('Classify "pull latest configured views" as `refresh: pulled views`.');
    expect(text).to.contain(
      'For `refresh: pulled views`, read `views.*.source.pull` from `cell.yaml`.',
    );
    expectRenderedSections(text, guidance.sections);
    expect(text).to.contain('<dist-url>');
    expect(text).to.contain('<pull-config-path>');
    expect(text).to.contain('<local-target>');
    expect(text).to.not.contain('https://example.com/foo/dist.json');
    expect(text).to.not.contain('deno run -ER jsr:@sys/cell dsl pulled-view');
  });

  it('dsl static-http-service → faithfully renders the requested chapter', async () => {
    const text = stripAnsi(await FmtHelp.dslOutput({ path: ['static-http-service'] }));
    const guidance = await CellHelp.Dsl.load(['static-http-service']);

    expect(text).to.contain('@sys/cell dsl static-http-service');
    expect(text).to.contain(guidance.summary);
    guidance.sections.forEach((section) => expect(text).to.contain(section.label));
    expect(text).to.contain('@sys/http/server/static config add');
    expect(text).to.contain('Do not use `@sys/tools serve`');
    expect(text).to.contain('deno run -ERW jsr:@sys/http/server/static config add');
    expect(text).to.contain('deno run -ER jsr:@sys/http/server/static config add --dry-run');
    expect(text).to.contain('<static-config>');
    expect(text).to.contain('<service-name>');
    expect(text).to.contain('Reject invalid IDs such as `http:static`');
    expect(text).to.contain('<dir>');
    expect(text).to.contain('runtime:');
    expect(text).to.contain("from: '@sys/http/server/static'");
    expect(text).to.not.contain('./-config/@sys.http/static/web.yaml');
    expect(text).to.not.contain('./view/web');
    expect(text).to.not.contain('deno run -ER jsr:@sys/cell dsl static-http-service');
  });

  it('dsl runtime-service → faithfully renders the requested chapter', async () => {
    const text = stripAnsi(await FmtHelp.dslOutput({ path: ['runtime-service'] }));
    const guidance = await CellHelp.Dsl.load(['runtime-service']);

    expect(text).to.contain('@sys/cell dsl runtime-service');
    expect(text).to.contain(guidance.summary);
    guidance.sections.forEach((section) => expect(text).to.contain(section.label));
    expect(text).to.contain('Cell.Runtime.LifecycleEndpoint');
    expect(text).to.contain('start(args)');
    expect(text).to.contain('close(reason)');
    expect(text).to.contain('dispose(reason)');
    expect(text).to.contain('t.LifecycleAsync');
    expect(text).to.contain('published JSR package docs/source');
    expect(text).to.contain('owner config affordances');
    expect(text).to.contain('config add');
    expect(text).to.contain('<service-name>');
    expect(text).to.contain('Reject invalid IDs such as `http:static`');
    expect(text).to.contain('<kind>');
    expect(text).to.contain('<module>');
    expect(text).to.contain('<export>');
    expect(text).to.contain('<config>');
    expect(text).to.contain('runtime:');
    expect(text).to.contain("from: '<module>'");
    expect(text).to.not.contain('Stripe');
    expect(text).to.not.contain('stripe');
    expect(text).to.not.contain('driver.stripe');
    expect(text).to.not.contain('127.0.0.1');
    expect(text).to.not.contain('deno run -ER jsr:@sys/cell dsl runtime-service');
  });

  it('dsl start-runtime → faithfully renders the requested chapter', async () => {
    const text = stripAnsi(await FmtHelp.dslOutput({ path: ['start-runtime'] }));
    const guidance = await CellHelp.Dsl.load(['start-runtime']);

    expect(text).to.contain('@sys/cell dsl start-runtime');
    expect(text).to.contain(guidance.summary);
    guidance.sections.forEach((section) => expect(text).to.contain(section.label));
    expect(text).to.contain('@sys/cell start');
    expect(text).to.contain('deno run -ERWN jsr:@sys/cell start .');
    expect(text).to.contain('Cell.Runtime.start');
    expect(text).to.contain('Cell.Runtime.wait');
    expect(text).to.contain('started service handles that expose `finished`');
    expect(text).to.contain('should keep `@sys/cell start` alive');
    expect(text).to.contain('Do not write a custom launcher script');
    expect(text).to.contain(
      'Service owners keep their own config schema, mechanics, ports, URLs, permissions, and runtime display',
    );
    expect(text).to.contain('Add any extra permissions required by declared owner services');
    expect(text).to.contain('"start": "deno run -ERWN jsr:@sys/cell start ."');
    expect(text).to.not.contain('Stripe');
    expect(text).to.not.contain('stripe');
    expect(text).to.not.contain('deno run -ER jsr:@sys/cell dsl start-runtime');
  });

  it('dsl proxy-service → faithfully renders the requested chapter', async () => {
    const text = stripAnsi(await FmtHelp.dslOutput({ path: ['proxy-service'] }));
    const guidance = await CellHelp.Dsl.load(['proxy-service']);

    expect(text).to.contain('@sys/cell dsl proxy-service');
    expect(text).to.contain(guidance.summary);
    guidance.sections.forEach((section) => expect(text).to.contain(section.label));
    expect(text).to.contain('@sys/http/server/proxy config add');
    expect(text).to.contain('@sys/http/server/proxy root set');
    expect(text).to.contain('@sys/http/server/proxy mount add');
    expect(text).to.contain('deno run -ERW jsr:@sys/http/server/proxy config add');
    expect(text).to.contain('deno run -ERW jsr:@sys/http/server/proxy root set');
    expect(text).to.contain('deno run -ERW jsr:@sys/http/server/proxy mount add');
    expect(text).to.contain('deno run -ER jsr:@sys/http/server/proxy mount add --dry-run');
    expect(text).to.contain('Do not use `/` as a mount');
    expect(text).to.contain('<proxy-config>');
    expect(text).to.contain('<service-name>');
    expect(text).to.contain('<path-prefix>');
    expect(text).to.contain('<upstream-url-prefix>');
    expect(text).to.contain('runtime:');
    expect(text).to.contain("from: '@sys/http/server/proxy'");
    expect(text).to.not.contain('Stripe');
    expect(text).to.not.contain('stripe');
    expect(text).to.not.contain('/payments/');
    expect(text).to.not.contain('driver.stripe');
    expect(text).to.not.contain('example.com');
    expect(text).to.not.contain('http://127.0.0.1:4040/');
    expect(text).to.not.contain('deno run -ER jsr:@sys/cell dsl proxy-service');
  });
});

function renderedSections(text: string, sections: readonly { readonly label: string }[]) {
  return sections.map((section, index, all) => {
    const end = all[index + 1]?.label;
    const block = end ? between(text, section.label, end) : after(text, section.label);
    return {
      label: section.label,
      items: sectionItems(block, section.label),
    };
  });
}

function expectRenderedSections(
  text: string,
  expected: readonly { readonly label: string; readonly items: readonly string[] }[],
) {
  const sections = renderedSections(text, expected);

  expect(sections.map((item) => item.label)).to.eql(expected.map((item) => item.label));
  expected.forEach((item) => expect(section(sections, item.label)).to.eql([...item.items]));
}

function chapterCommentColumn(text: string, chapter: string): number {
  const line = text.split('\n').find((line) => line.includes(`dsl ${chapter}`));
  expect(line).to.not.eql(undefined);
  return line?.indexOf('#') ?? -1;
}

function descriptorBlock(text: string): string {
  const lines = Str.trimEdgeNewlines(text).split('\n').map((line) => line ? `  ${line}` : '');
  return ['Descriptor', ...lines].join('\n');
}

function descriptorLines(text: string): readonly string[] {
  return Str.trimEdgeNewlines(text)
    .split('\n')
    .filter((line) => line.length > 0);
}

function frontmatter(text: string): Record<string, string> {
  expect(text.startsWith('---\n')).to.eql(true);
  const end = text.indexOf('\n---', 4);
  expect(end).to.be.greaterThan(-1);

  const result: Record<string, string> = {};
  text
    .slice(4, end)
    .split('\n')
    .forEach((line) => {
      const [key, value = ''] = line.split(/: /, 2);
      result[key] = value.replace(/^"|"$/g, '');
    });
  return result;
}

function sectionItems(text: string, label: string) {
  return text
    .split('\n')
    .map((line) => line.startsWith(label) ? line.slice(label.length).trim() : line.trim())
    .filter((line) => line.length > 0);
}

function section(sections: readonly { label: string; items: readonly string[] }[], label: string) {
  const found = sections.find((item) => item.label === label);
  expect(found).not.to.eql(undefined);
  return found?.items ?? [];
}

function between(text: string, start: string, end: string) {
  const startIndex = text.indexOf(start);
  const endIndex = text.indexOf(end, startIndex);
  expect(startIndex).to.be.greaterThan(-1);
  expect(endIndex).to.be.greaterThan(startIndex);
  return text.slice(startIndex, endIndex);
}

function after(text: string, start: string) {
  const startIndex = text.indexOf(start);
  expect(startIndex).to.be.greaterThan(-1);
  return text.slice(startIndex);
}
