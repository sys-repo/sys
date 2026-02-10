import { describe, expect, it } from '../../../-test.ts';
import { DataCards } from '../../-dev/ui.Http.DataCards/mod.ts';
import { type t, Schedule, Signal } from '../common.ts';
import { createOrchestrator } from '../-spec/-u.data-card.orchestrator.ts';

describe('TreeContentDriver data-card orchestrator', () => {
  it('back to parent does not clear selection to root', async () => {
    const orchestrator = setup();
    const { card } = orchestrator;

    orchestrator.api.intent({ type: 'tree.set', tree: sampleTree() });
    card.props.treeContent.ref.value = 'ref-a';
    await Schedule.micro();

    orchestrator.api.selection.intent({ type: 'path.request', path: ['root'] });
    await Schedule.micro();

    expect(orchestrator.api.selection.current().selectedPath).to.eql(['root']);
    expect(orchestrator.api.selection.current().selectedRef).to.eql(undefined);
    orchestrator.api.dispose();
  });

  it('first card selection after back triggers selection update', async () => {
    const orchestrator = setup();
    const { card } = orchestrator;

    orchestrator.api.intent({ type: 'tree.set', tree: sampleTree() });
    card.props.treeContent.ref.value = 'ref-a';
    await Schedule.micro();

    orchestrator.api.selection.intent({ type: 'path.request', path: ['root'] });
    await Schedule.micro();
    card.props.treeContent.ref.value = 'ref-b';
    await Schedule.micro();

    expect(orchestrator.api.selection.current().selectedPath).to.eql(['root', 'b']);
    expect(orchestrator.api.selection.current().selectedRef).to.eql('ref-b');
    orchestrator.api.dispose();
  });

  it('playback: first card selection after back triggers selection update', async () => {
    const orchestrator = setup({ kind: 'playback-content' });
    const { card } = orchestrator;

    card.props.treePlayback.refs.value = ['doc-1', 'doc-2', 'doc-3'];
    await Schedule.micro();
    card.props.treePlayback.ref.value = 'doc-1';
    await Schedule.micro();

    orchestrator.api.selection.intent({ type: 'path.request', path: ['program'] });
    await Schedule.micro();
    card.props.treePlayback.ref.value = 'doc-2';
    await Schedule.micro();

    expect(orchestrator.api.selection.current().selectedPath).to.eql(['program', '2']);
    expect(orchestrator.api.selection.current().selectedRef).to.eql('doc-2');
    orchestrator.api.dispose();
  });
});

function setup(args: { kind?: t.DataCardKind } = {}) {
  const s = Signal.create;
  const card = DataCards.createSignals({ totalVisible: 5 });
  const props = {
    origin: s<t.SlugUrlOrigin | undefined>(undefined),
    cardKind: s<t.DataCardKind | undefined>(args.kind ?? 'file-content'),
  };
  const api = createOrchestrator({ props, card });
  return { api, card };
}

function sampleTree(): t.TreeHostViewNodeList {
  const a: t.TreeHostViewNode = {
    path: ['root', 'a'],
    key: 'root/a',
    label: 'a',
    value: { slug: 'a', ref: 'ref-a' },
  };
  const b: t.TreeHostViewNode = {
    path: ['root', 'b'],
    key: 'root/b',
    label: 'b',
    value: { slug: 'b', ref: 'ref-b' },
  };
  const root: t.TreeHostViewNode = {
    path: ['root'],
    key: 'root',
    label: 'root',
    value: { slug: 'root' },
    children: [a, b],
  };
  return [root];
}
