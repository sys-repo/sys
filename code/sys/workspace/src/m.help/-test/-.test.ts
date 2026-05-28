import { describe, expect, expectError, it } from '../../-test.ts';
import { WorkspaceHelp } from '../mod.ts';

describe('WorkspaceHelp', () => {
  it('loads root package help resources', async () => {
    const root = await WorkspaceHelp.Root.load();

    expect(root.summary).to.contain('@sys/workspace');
    expect(root.sections.map(({ label }) => label)).to.eql(['Rule', 'Maintenance']);
    root.sections.forEach((section) => expect(section.items.length).to.be.greaterThan(0));
  });

  it('loads the root DSL chapter', async () => {
    const chapter = await WorkspaceHelp.Dsl.load();

    expect(chapter.id).to.eql('dsl');
    expect(chapter.path).to.eql([]);
    expect(chapter.title).to.eql('Workspace DSL');
    expect(chapter.sections.map(({ label }) => label)).to.eql(['Scope', 'Maintenance']);
    expect(chapter.chapters.map(({ id, path }) => ({ id, path }))).to.eql([
      { id: 'delta', path: ['delta'] },
    ]);
  });

  it('loads the delta DSL chapter', async () => {
    const chapter = await WorkspaceHelp.Dsl.load(['delta']);

    expect(chapter.id).to.eql('delta');
    expect(chapter.path).to.eql(['delta']);
    expect(chapter.sections.map(({ label }) => label)).to.eql([
      'Concept',
      'Bump since',
      'Classification',
      'Closure',
    ]);
    expect(chapter.chapters).to.eql([]);
  });

  it('reports unknown DSL chapter paths clearly', async () => {
    const error = await expectError(() => WorkspaceHelp.Dsl.load(['missing']));

    expect(error.message).to.eql('WorkspaceHelp: DSL chapter not found: missing');
  });
});
