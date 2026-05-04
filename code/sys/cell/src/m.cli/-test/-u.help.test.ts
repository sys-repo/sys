import { describe, expect, it } from '../../-test.ts';
import { CellHelp } from '../../m.help/mod.ts';
import { Str, stripAnsi } from '../common.ts';
import { FmtHelp } from '../u.help.ts';
import { Tmpl } from '../u.tmpl.ts';

describe('FmtHelp', () => {
  it('help agent → renders bundled guidance and source-backed Cell template facts', async () => {
    const text = stripAnsi(await FmtHelp.agentOutput());
    const guidance = await CellHelp.Agent.load();
    const init = sectionItems(between(text, 'Init', 'Writes'), 'Init');
    const writes = sectionItems(between(text, 'Writes', 'Owns'), 'Writes');
    const owns = sectionItems(between(text, 'Owns', 'Safety'), 'Owns');
    const preserve = sectionItems(between(text, 'Preserve', 'Rule'), 'Preserve');
    const rule = sectionItems(between(text, 'Rule', 'Speech acts'), 'Rule');
    const speechActs = sectionItems(between(text, 'Speech acts', 'Owner flows'), 'Speech acts');
    const ownerFlows = sectionItems(between(text, 'Owner flows', 'Act mapping'), 'Owner flows');
    const actMapping = sectionItems(between(text, 'Act mapping', 'Descriptor'), 'Act mapping');

    expect(init).to.eql([...guidance.init]);
    expect(writes).to.eql([...Tmpl.minimalWritePaths()]);
    expect(owns).to.eql([...Tmpl.minimalOwnedPaths()]);
    expect(preserve).to.eql([...guidance.preserve]);
    expect(rule).to.eql([...guidance.rule]);
    expect(speechActs).to.eql([...guidance.speechActs]);
    expect(ownerFlows).to.eql([...guidance.ownerFlows]);
    expect(actMapping).to.eql([...guidance.actMapping]);
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
