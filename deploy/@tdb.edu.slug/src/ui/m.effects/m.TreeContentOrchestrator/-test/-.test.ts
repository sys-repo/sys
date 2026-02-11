import { describe, expect, it } from '../../../../-test.ts';
import { TreeContentController } from '../../m.TreeContentController/mod.ts';
import { TreeSelectionController } from '../../m.TreeSelection.Controller/mod.ts';
import { Rx, Schedule, type t } from '../common.ts';
import { TreeContentOrchestrator } from '../mod.ts';

describe('TreeContentOrchestrator', () => {
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

  it('loads content on selected ref and projects ready state', async () => {
    const selection = TreeSelectionController.create({ initial: { tree: sampleTree() } });
    const content = TreeContentController.create();
    const requests: t.TreeContentController.Request[] = [];

    const orchestrator = TreeContentOrchestrator.create({
      selection,
      content,
      requestId: () => `req:${requests.length + 1}`,
      load: async ({ request }) => {
        requests.push(request);
        return { title: request.key };
      },
    });

    selection.intent({ type: 'path.request', path: ['root', 'a'] });
    await Schedule.micro();

    expect(requests).to.eql([{ id: 'req:1', key: 'ref-a' }]);
    expect(content.current().phase).to.eql('ready');
    expect(content.current().key).to.eql('ref-a');
    expect(content.current().data).to.eql({ title: 'ref-a' });

    orchestrator.dispose();
    selection.dispose();
    content.dispose();
  });

  it('clears content when selection moves to non-leaf context', async () => {
    const selection = TreeSelectionController.create({ initial: { tree: sampleTree() } });
    const content = TreeContentController.create();
    const orchestrator = TreeContentOrchestrator.create({
      selection,
      content,
      requestId: () => 'req:1',
      load: async () => ({ title: 'ok' }),
    });

    selection.intent({ type: 'path.request', path: ['root', 'a'] });
    await Schedule.micro();
    expect(content.current().phase).to.eql('ready');

    selection.intent({ type: 'path.request', path: ['root'] });
    await Schedule.micro();
    expect(content.current().phase).to.eql('idle');
    expect(content.current().key).to.eql(undefined);
    expect(content.current().data).to.eql(undefined);

    orchestrator.dispose();
    selection.dispose();
    content.dispose();
  });

  it('ignores stale load results after rapid selection change', async () => {
    const selection = TreeSelectionController.create({ initial: { tree: sampleTree() } });
    const content = TreeContentController.create();

    let resolveA: ((data: t.TreeContentController.Content) => void) | undefined;
    let resolveB: ((data: t.TreeContentController.Content) => void) | undefined;

    const orchestrator = TreeContentOrchestrator.create({
      selection,
      content,
      requestId: (() => {
        let i = 0;
        return () => `req:${++i}`;
      })(),
      load: async ({ request }) => {
        if (request.key === 'ref-a') {
          return await new Promise((resolve) => {
            resolveA = resolve;
          });
        }
        return await new Promise((resolve) => {
          resolveB = resolve;
        });
      },
    });

    selection.intent({ type: 'path.request', path: ['root', 'a'] });
    selection.intent({ type: 'path.request', path: ['root', 'b'] });
    await Schedule.micro();

    resolveA?.({ title: 'stale-a' });
    await Schedule.micro();
    expect(content.current().phase).to.eql('loading');
    expect(content.current().key).to.eql('ref-b');

    resolveB?.({ title: 'fresh-b' });
    await Schedule.micro();
    expect(content.current().phase).to.eql('ready');
    expect(content.current().key).to.eql('ref-b');
    expect(content.current().data).to.eql({ title: 'fresh-b' });

    orchestrator.dispose();
    selection.dispose();
    content.dispose();
  });

  it('dispose detaches selection subscription and prevents new loads', async () => {
    const selection = TreeSelectionController.create({ initial: { tree: sampleTree() } });
    const content = TreeContentController.create();
    const requests: t.TreeContentController.Request[] = [];

    const orchestrator = TreeContentOrchestrator.create({
      selection,
      content,
      requestId: () => `req:${requests.length + 1}`,
      load: async ({ request }) => {
        requests.push(request);
        return { title: request.key };
      },
    });

    selection.intent({ type: 'path.request', path: ['root', 'a'] });
    await Schedule.micro();
    expect(requests.length).to.eql(1);
    expect(content.current().phase).to.eql('ready');

    orchestrator.dispose();

    selection.intent({ type: 'path.request', path: ['root', 'b'] });
    await Schedule.micro();
    expect(requests.length).to.eql(1);
    expect(content.current().key).to.eql('ref-a');
    expect(content.current().data).to.eql({ title: 'ref-a' });

    selection.dispose();
    content.dispose();
  });

  it('until input disposes orchestrator and prevents new loads', async () => {
    const until = Rx.lifecycle();
    const selection = TreeSelectionController.create({ initial: { tree: sampleTree() } });
    const content = TreeContentController.create();
    const requests: t.TreeContentController.Request[] = [];

    const orchestrator = TreeContentOrchestrator.create({
      until,
      selection,
      content,
      requestId: () => `req:${requests.length + 1}`,
      async load({ request }) {
        requests.push(request);
        return { title: request.key };
      },
    });

    selection.intent({ type: 'path.request', path: ['root', 'a'] });
    await Schedule.micro();
    expect(requests.length).to.eql(1);
    expect(content.current().key).to.eql('ref-a');

    until.dispose();
    expect(orchestrator.disposed).to.eql(true);

    selection.intent({ type: 'path.request', path: ['root', 'b'] });
    await Schedule.micro();
    expect(requests.length).to.eql(1);
    expect(content.current().key).to.eql('ref-a');

    selection.dispose();
    content.dispose();
  });
});
