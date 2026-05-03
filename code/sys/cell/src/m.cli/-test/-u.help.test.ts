import { describe, expect, it } from '../../-test.ts';
import { Str, stripAnsi } from '../common.ts';
import { FmtHelp } from '../u.help.ts';
import { Tmpl } from '../u.tmpl.ts';

describe('FmtHelp', () => {
  it('help agent → renders source-backed Cell template facts', async () => {
    const text = stripAnsi(await FmtHelp.agentOutput());
    const writes = sectionItems(between(text, 'Writes', 'Owns'), 'Writes');
    const owns = sectionItems(between(text, 'Owns', 'Safety'), 'Owns');

    expect(writes).to.eql([...Tmpl.minimalWritePaths()]);
    expect(owns).to.eql([...Tmpl.minimalOwnedPaths()]);
    expect(writes).to.contain('.gitignore');
    expect(owns).to.not.contain('.gitignore');

    descriptorLines(await Tmpl.minimalDescriptor()).forEach((line) => {
      expect(text).to.contain(line);
    });
  });
});

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

function between(text: string, start: string, end: string) {
  const startIndex = text.indexOf(start);
  const endIndex = text.indexOf(end, startIndex);
  expect(startIndex).to.be.greaterThan(-1);
  expect(endIndex).to.be.greaterThan(startIndex);
  return text.slice(startIndex, endIndex);
}
