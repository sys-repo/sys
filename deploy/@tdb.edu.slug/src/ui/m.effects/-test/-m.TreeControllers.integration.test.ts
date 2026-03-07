import { describe, expect, it } from '../../../-test.ts';
import { type t, Immutable } from '../common.ts';
import { TreeContentController, TreeSelectionController, bindRefPath } from '../mod.ts';

type TRoot = {
  sheet: { content?: t.TreeContentController.State };
  untouched: number;
};

describe('Tree controllers integration', () => {
  function sampleTree(): t.TreeHostViewNodeList {
    const b: t.TreeHostViewNode = {
      path: ['a', 'b'],
      key: 'a/b',
      label: 'b',
      value: { slug: 'b', ref: 'ref-b' },
    };
    const a: t.TreeHostViewNode = {
      path: ['a'],
      key: 'a',
      label: 'a',
      value: { slug: 'a', ref: 'ref-a' },
      children: [b],
    };
    return [a];
  }

  it('bridges selection changes into content lifecycle with stale-token gating', () => {
    const selection = TreeSelectionController.create({ initial: { tree: sampleTree() } });
    const root = Immutable.clonerRef<TRoot>({
      sheet: { content: { phase: 'idle' } },
      untouched: 0,
    });
    const ref = bindRefPath<TRoot, t.TreeContentController.State>({
      root,
      path: ['sheet', 'content'],
    });
    const content = TreeContentController.create({ ref, initial: { phase: 'idle' } });

    const requests: t.TreeContentController.Request[] = [];
    const stop = selection.onChange((state) => {
      const key = state.selectedRef;
      content.intent({ type: 'selection.changed', key });
      if (!key) return;
      const request = { id: `req:${requests.length + 1}`, key };
      requests.push(request);
      content.intent({ type: 'load.start', request });
    });

    selection.intent({ type: 'path.request', path: ['a'] });
    selection.intent({ type: 'path.request', path: ['a', 'b'] });

    expect(requests.length).to.eql(2);
    expect(requests[0]).to.eql({ id: 'req:1', key: 'ref-a' });
    expect(requests[1]).to.eql({ id: 'req:2', key: 'ref-b' });
    expect(content.current().phase).to.eql('loading');
    expect(content.current().request).to.eql(requests[1]);

    content.intent({
      type: 'load.succeed',
      request: requests[0],
      data: { title: 'stale' },
    });
    expect(content.current().phase).to.eql('loading');
    expect(content.current().request).to.eql(requests[1]);
    expect(content.current().data).to.eql(undefined);

    content.intent({
      type: 'load.succeed',
      request: requests[1],
      data: { title: 'fresh' },
    });
    expect(content.current().phase).to.eql('ready');
    expect(content.current().key).to.eql('ref-b');
    expect(content.current().data).to.eql({ title: 'fresh' });

    const selectionState = selection.current();
    expect(selectionState.selectedPath).to.eql(['a', 'b']);
    expect(selectionState.selectedRef).to.eql('ref-b');
    expect(root.current.sheet.content).to.eql(content.current());
    expect(root.current.untouched).to.eql(0);

    stop();
    selection.dispose();
    content.dispose();
  });
});
