import { describe, expect, it } from '../../../-test.ts';
import { type t, Schedule } from '../common.ts';
import { createOrchestrator } from '../u.orchestrator.ts';

describe('TreeContentDriver.createOrchestrator', () => {
  it('loads content after tree/ref intents', async () => {
    const requests: t.TreeContentController.Request[] = [];
    const orchestrator = createOrchestrator({
      async load({ request }) {
        requests.push(request);
        return { title: request.key };
      },
    });

    orchestrator.intent({ type: 'tree.set', tree: sampleTree() });
    orchestrator.intent({ type: 'ref.request', ref: 'ref-a' });
    await Schedule.micro();

    expect(requests).to.eql([{ id: requests[0].id, key: 'ref-a' }]);
    expect(orchestrator.content.current().phase).to.eql('ready');
    expect(orchestrator.content.current().key).to.eql('ref-a');
    expect(orchestrator.content.current().data).to.eql({ title: 'ref-a' });
    orchestrator.dispose();
  });

  it('tree.clear clears selection and content lifecycle', async () => {
    const orchestrator = createOrchestrator({
      async load({ request }) {
        return { title: request.key };
      },
    });

    orchestrator.intent({ type: 'tree.set', tree: sampleTree() });
    orchestrator.intent({ type: 'ref.request', ref: 'ref-a' });
    await Schedule.micro();
    expect(orchestrator.content.current().phase).to.eql('ready');

    orchestrator.intent({ type: 'tree.clear' });
    await Schedule.micro();

    expect(orchestrator.selection.current().tree).to.eql(undefined);
    expect(orchestrator.selection.current().selectedRef).to.eql(undefined);
    expect(orchestrator.content.current().phase).to.eql('idle');
    expect(orchestrator.content.current().data).to.eql(undefined);
    orchestrator.dispose();
  });

  it('reset returns selection/content to baseline', async () => {
    const orchestrator = createOrchestrator({
      async load({ request }) {
        return { title: request.key };
      },
    });

    orchestrator.intent({ type: 'tree.set', tree: sampleTree() });
    orchestrator.intent({ type: 'ref.request', ref: 'ref-a' });
    await Schedule.micro();

    orchestrator.reset();
    await Schedule.micro();

    expect(orchestrator.selection.current().tree).to.eql(undefined);
    expect(orchestrator.selection.current().selectedPath).to.eql(undefined);
    expect(orchestrator.selection.current().selectedRef).to.eql(undefined);
    expect(orchestrator.content.current().phase).to.eql('idle');
    expect(orchestrator.content.current().key).to.eql(undefined);
    expect(orchestrator.content.current().data).to.eql(undefined);
    orchestrator.dispose();
  });

  it('reports selected ref changes through callback', async () => {
    const refs: (string | undefined)[] = [];
    const orchestrator = createOrchestrator({
      async load({ request }) {
        return { title: request.key };
      },
      onSelectedRefChange(ref) {
        refs.push(ref);
      },
    });

    orchestrator.intent({ type: 'tree.set', tree: sampleTree() });
    orchestrator.intent({ type: 'ref.request', ref: 'ref-b' });
    await Schedule.micro();

    expect(refs).to.include('ref-b');
    orchestrator.dispose();
  });
});

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
