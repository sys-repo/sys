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

    descriptorLines(await Tmpl.minimalDescriptor()).forEach((line) => {
      expect(text).to.contain(line);
    });
  });

  it('dsl → renders the root chapter with child chapter index', async () => {
    const text = stripAnsi(await FmtHelp.dslOutput());
    const guidance = await CellHelp.Dsl.load();

    expect(text).to.contain('Cell DSL (domain-specific-language):');
    expect(text).to.contain(guidance.summary.split('\n')[0]);
    expect(text).to.contain('Speech acts');
    expect(text).to.contain('Owners');
    expect(text).to.contain('Mappings');
    expect(text).to.contain('Chapter');
    expect(text).to.contain('deno run jsr:@sys/cell dsl pulled-view');
    expect(text).to.contain('# Add a view backed by an `@sys/tools/pull` config.');
    expect(text).to.contain('deno run jsr:@sys/cell dsl static-http-service');
    expect(text).to.contain('# Add a runtime service backed by `@sys/http/server/static` config.');
    expect(chapterCommentColumn(text, 'pulled-view')).to.eql(
      chapterCommentColumn(text, 'static-http-service'),
    );
    expect(text).to.not.contain('Slot policy');
    expect(guidance.chapters.map((chapter) => chapter.id)).to.eql([
      'pulled-view',
      'static-http-service',
    ]);
  });

  it('dsl pulled-view → faithfully renders the requested chapter', async () => {
    const text = stripAnsi(await FmtHelp.dslOutput({ path: ['pulled-view'] }));
    const guidance = await CellHelp.Dsl.load(['pulled-view']);

    expect(text).to.contain('@sys/cell dsl pulled-view');
    expect(text).to.contain(guidance.summary);
    expectRenderedSections(text, guidance.sections);
    expect(text).to.not.contain('deno run jsr:@sys/cell dsl pulled-view');
  });

  it('dsl static-http-service → faithfully renders the requested chapter', async () => {
    const text = stripAnsi(await FmtHelp.dslOutput({ path: ['static-http-service'] }));
    const guidance = await CellHelp.Dsl.load(['static-http-service']);

    expect(text).to.contain('@sys/cell dsl static-http-service');
    expect(text).to.contain(guidance.summary);
    guidance.sections.forEach((section) => expect(text).to.contain(section.label));
    expect(text).to.contain('@sys/http/server/static config add');
    expect(text).to.contain('deno run -A jsr:@sys/http/server/static config add');
    expect(text).to.contain('runtime:');
    expect(text).to.contain("from: '@sys/http/server/static'");
    expect(text).to.not.contain('deno run jsr:@sys/cell dsl static-http-service');
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

function descriptorLines(text: string): readonly string[] {
  return Str.trimEdgeNewlines(text)
    .split('\n')
    .filter((line) => line.length > 0);
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
