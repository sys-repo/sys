import { createCardOrchestrator } from '../-spec/-u.data-card.orchestrator.ts';
import { DataCards } from '../../-dev/ui.Http.DataCards/mod.ts';
import { describe, expect, it } from '../../../-test.ts';
import { type t, Obj, Schedule, Signal } from '../common.ts';

describe('TreeContentDriver data-card orchestrator', () => {
  it('hydrates selection tree from card result response', async () => {
    const orchestrator = setup();
    const { card } = orchestrator;

    card.props.result.response.value = {
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
    await Schedule.micro();

    const state = orchestrator.api.selection.current();
    expect(Array.isArray(state.tree)).to.eql(true);
    expect(state.tree?.length).to.eql(1);
    expect(state.selectedPath).to.eql(undefined);
    orchestrator.api.dispose();
  });

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

  it('playback: tree keys are canonical encoded ObjectPath keys', async () => {
    const orchestrator = setup({ kind: 'playback-content' });
    const { card } = orchestrator;

    card.props.treePlayback.refs.value = ['doc-1', 'doc-2'];
    await Schedule.micro();

    const tree = orchestrator.api.selection.current().tree;
    const root = tree?.[0];
    const child = root?.children?.[0];
    expect(root?.key).to.eql(Obj.Path.encode(['program']));
    expect(child?.key).to.eql(Obj.Path.encode(['program', '1']));
    orchestrator.api.dispose();
  });

  it('playback: semantic-equal refs updates do not clear current path selection', async () => {
    const orchestrator = setup({ kind: 'playback-content' });
    const { card } = orchestrator;

    card.props.treePlayback.refs.value = ['doc-1', 'doc-2', 'doc-3'];
    await Schedule.micro();
    orchestrator.api.selection.intent({ type: 'path.request', path: ['program', '2'] });
    await Schedule.micro();

    card.props.treePlayback.refs.value = ['doc-1', 'doc-2', 'doc-3'];
    await Schedule.micro();

    expect(orchestrator.api.selection.current().selectedPath).to.eql(['program', '2']);
    expect(orchestrator.api.selection.current().selectedRef).to.eql('doc-2');
    orchestrator.api.dispose();
  });

  it('file-content: card ref change still updates selection while card is spinning', async () => {
    const orchestrator = setup();
    const { card } = orchestrator;

    orchestrator.api.intent({ type: 'tree.set', tree: sampleTree() });
    card.props.spinning.value = true;
    card.props.treeContent.ref.value = 'ref-b';
    await Schedule.micro();

    expect(orchestrator.api.selection.current().selectedPath).to.eql(['root', 'b']);
    expect(orchestrator.api.selection.current().selectedRef).to.eql('ref-b');
    orchestrator.api.dispose();
  });

  it('playback: card ref change still updates selection while card is spinning', async () => {
    const orchestrator = setup({ kind: 'playback-content' });
    const { card } = orchestrator;

    card.props.treePlayback.refs.value = ['doc-1', 'doc-2'];
    await Schedule.micro();
    card.props.spinning.value = true;
    card.props.treePlayback.ref.value = 'doc-2';
    await Schedule.micro();

    expect(orchestrator.api.selection.current().selectedPath).to.eql(['program', '2']);
    expect(orchestrator.api.selection.current().selectedRef).to.eql('doc-2');
    orchestrator.api.dispose();
  });

  it('file-content: response re-hydrate preserves existing card ref selection', async () => {
    const orchestrator = setup({ kind: 'file-content' });
    const { card } = orchestrator;

    card.props.result.response.value = {
      ok: true,
      value: {
        tree: {
          tree: [
            {
              slug: 'root',
              slugs: [{ slug: 'a', ref: 'ref-a' }],
            },
          ],
        },
      },
    };
    await Schedule.micro();
    card.props.treeContent.ref.value = 'ref-a';
    await Schedule.micro();

    card.props.result.response.value = {
      ok: true,
      value: {
        tree: {
          tree: [
            {
              slug: 'root',
              slugs: [{ slug: 'a', ref: 'ref-a' }],
            },
          ],
        },
      },
    };
    await Schedule.micro();

    expect(card.props.treeContent.ref.value).to.eql('ref-a');
    expect(orchestrator.api.selection.current().selectedRef).to.eql('ref-a');
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
  const api = createCardOrchestrator({ props, card });
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
