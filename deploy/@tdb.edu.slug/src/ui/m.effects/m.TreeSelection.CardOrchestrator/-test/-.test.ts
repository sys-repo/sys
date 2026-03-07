import { DataCards } from '../../../-dev/ui.Http.DataCards/mod.ts';
import { describe, expect, it } from '../../../../-test.ts';
import { TreeSelectionController } from '../../m.TreeSelection.Controller/mod.ts';
import { type t, Schedule, Signal } from '../common.ts';
import { TreeSelectionCardOrchestrator } from '../mod.ts';

describe('TreeSelectionCardOrchestrator', () => {
  it('hydrates selection tree from file-card response', async () => {
    const setup = createSetup();
    setup.card.props.result.response.value = sampleResponse();
    await Schedule.micro();

    const state = setup.selection.current();
    expect(Array.isArray(state.tree)).to.eql(true);
    expect(state.tree?.length).to.eql(1);
    expect(state.selectedPath).to.eql(undefined);
    setup.dispose();
  });

  it('first file-card selection after back updates selection', async () => {
    const setup = createSetup();
    setup.selection.intent({ type: 'tree.set', tree: sampleTree() });
    setup.card.props.treeContent.ref.value = 'ref-a';
    await Schedule.micro();

    setup.selection.intent({ type: 'path.request', path: ['root'] });
    await Schedule.micro();
    setup.card.props.treeContent.ref.value = 'ref-b';
    await Schedule.micro();

    expect(setup.selection.current().selectedPath).to.eql(['root', 'b']);
    expect(setup.selection.current().selectedRef).to.eql('ref-b');
    setup.dispose();
  });

  it('mirrors tree selection back into file-card selected ref', async () => {
    const setup = createSetup();
    setup.selection.intent({ type: 'tree.set', tree: sampleTree() });
    setup.selection.intent({ type: 'path.request', path: ['root', 'a'] });
    await Schedule.micro();

    expect(setup.card.props.treeContent.ref.value).to.eql('ref-a');
    setup.dispose();
  });

  it('playback refs hydrate tree and card ref drives path selection', async () => {
    const setup = createSetup({ kind: 'playback-content' });
    setup.card.props.treePlayback.refs.value = ['doc-1', 'doc-2', 'doc-3'];
    await Schedule.micro();
    setup.card.props.treePlayback.ref.value = 'doc-2';
    await Schedule.micro();

    expect(setup.selection.current().selectedPath).to.eql(['program', '2']);
    expect(setup.selection.current().selectedRef).to.eql('doc-2');
    setup.dispose();
  });

  it('playback semantic-equal refs updates do not clear current path selection', async () => {
    const setup = createSetup({ kind: 'playback-content' });
    setup.card.props.treePlayback.refs.value = ['doc-1', 'doc-2', 'doc-3'];
    await Schedule.micro();
    setup.selection.intent({ type: 'path.request', path: ['program', '2'] });
    await Schedule.micro();

    setup.card.props.treePlayback.refs.value = ['doc-1', 'doc-2', 'doc-3'];
    await Schedule.micro();

    expect(setup.selection.current().selectedPath).to.eql(['program', '2']);
    expect(setup.selection.current().selectedRef).to.eql('doc-2');
    setup.dispose();
  });

  it('dispose detaches synchronization effects', async () => {
    const setup = createSetup();
    setup.selection.intent({ type: 'tree.set', tree: sampleTree() });
    setup.dispose();

    setup.card.props.treeContent.ref.value = 'ref-b';
    await Schedule.micro();
    expect(setup.selection.current().selectedRef).to.eql(undefined);
  });
});

function createSetup(args: { kind?: t.DataCardKind } = {}) {
  const card = DataCards.createSignals({ totalVisible: 5 });
  const selection = TreeSelectionController.create();
  const cardKind = Signal.create<t.DataCardKind | undefined>(args.kind ?? 'file-content');
  const orchestrator = TreeSelectionCardOrchestrator.create({
    selection,
    card: card.props,
    cardKind,
    tree: {
      fromResponse: DataCards.Helpers.treeFromResponse,
    },
  });

  const dispose = () => {
    orchestrator.dispose();
    selection.dispose();
  };

  return { card, selection, cardKind, orchestrator, dispose };
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

function sampleResponse() {
  return {
    ok: true,
    value: {
      tree: {
        tree: [
          {
            slug: 'root',
            slugs: [
              { slug: 'a', ref: 'ref-a' },
              { slug: 'b', ref: 'ref-b' },
            ],
          },
        ],
      },
    },
  };
}
