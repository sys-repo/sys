import { describe, expect, it } from '../../-test.ts';
import { stripAnsi } from '../common.ts';
import { FmtHelp } from '../u.help.ts';
import { Tmpl } from '../u.tmpl.ts';

describe('FmtHelp', () => {
  it('help → concise public command surface', () => {
    const text = stripAnsi(FmtHelp.output());

    expect(text).to.contain('folder-shaped metamedium');
    expect(text).to.contain('validly rewritten');
    expect(text).to.contain('deno run jsr:@sys/cell/cli --help');
    expect(text).to.contain('deno run -RW jsr:@sys/cell/cli init [dir]');
    expect(text).to.contain('deno run jsr:@sys/cell/cli help agent');
    expect(text).to.not.contain('deno task cli');
    expect(text).to.not.contain('Minimal descriptor');
    expect(text).to.not.contain('kind: cell');
  });

  it('help agent → distinguishes init writes from Cell-owned resources', async () => {
    const text = stripAnsi(await FmtHelp.agentOutput());
    const writes = sectionItems(between(text, 'Writes', 'Owns'), 'Writes');
    const owns = sectionItems(between(text, 'Owns', 'Safety'), 'Owns');

    expect(text).to.contain('-config/@sys.pi/');
    expect(text).to.contain('Init      Run init');
    expect(writes).to.eql([...Tmpl.minimalWritePaths()]);
    expect(owns).to.eql([...Tmpl.minimalOwnedPaths()]);
    expect(writes).to.contain('.gitignore');
    expect(owns).to.not.contain('.gitignore');
    expect(text).to.contain('Safety    .gitignore may add .env once');
    expect(text).to.contain('Preserve  .pi/');
    expect(text).to.contain('Descriptor  YAML');
    expect(text).to.contain('```yaml');
    expect(text).to.contain('kind: cell');
    expect(text).to.contain('runtime:');
    expect(text).to.contain('Do not turn cell.yaml');
  });
});

function sectionItems(text: string, label: string) {
  return text
    .split('\n')
    .map((line) => line.startsWith(label) ? line.slice(label.length).trim() : line.trim())
    .filter((line) => line.length > 0);
}

function between(text: string, start: string, end: string) {
  const startIndex = text.indexOf(start);
  const endIndex = text.indexOf(end, startIndex);
  expect(startIndex).to.be.greaterThan(-1);
  expect(endIndex).to.be.greaterThan(startIndex);
  return text.slice(startIndex, endIndex);
}
