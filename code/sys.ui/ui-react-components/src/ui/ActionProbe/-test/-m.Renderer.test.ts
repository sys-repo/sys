import { describe, expect, it } from '../../../-test.ts';
import { type t } from '../common.ts';
import { Renderer } from '../m.Renderer.tsx';

type Env = { readonly kind: 'demo' };
type ProbeNode = {
  key: string | null;
  props: { onRunStart?: (args?: t.ActionProbeRunStartArgs) => void; runRequest?: unknown };
};
const sample: t.ActionProbe.ProbeSpec<Env> = {
  title: 'Test',
  render() {},
};

describe('ActionProbe.Renderer', () => {
  it('create: exposes chainable push/hr and items list', () => {
    const api = Renderer.create({
      state: {},
      resolve: (): t.ActionProbeRendererResolvedProps<Env> => ({ env: { kind: 'demo' } }),
    });

    api.push(sample).hr().push(sample);

    expect(api.items.length).to.eql(3);
  });

  it('push: uses stable probe keys and increments indices', () => {
    const api = Renderer.create({
      state: {},
      resolve: (): t.ActionProbeRendererResolvedProps<Env> => ({ env: { kind: 'demo' } }),
    });

    api.push(sample).push(sample);

    expect((api.items[0] as ProbeNode).key).to.eql('probe-0');
    expect((api.items[1] as ProbeNode).key).to.eql('probe-1');
  });

  it('push: allows resolve guard by yielding undefined', () => {
    const api = Renderer.create({
      state: {},
      resolve: ({ index }): t.ActionProbeRendererResolvedProps<Env> | undefined =>
        index === 0 ? { env: { kind: 'demo' } } : undefined,
    });

    api.push(sample).push(sample);

    expect(api.items.length).to.eql(2);
    expect(api.items[1]).to.eql(null);
  });

  it('push: forwards run handlers from resolved props', () => {
    let called = false;
    const api = Renderer.create({
      state: {},
      resolve: (): t.ActionProbeRendererResolvedProps<Env> => ({
        env: { kind: 'demo' },
        onRunStart: () => {
          called = true;
        },
      }),
    });

    api.push(sample);
    (api.items[0] as ProbeNode).props.onRunStart?.();

    expect(called).to.eql(true);
  });

  it('push: forwards runRequest token from resolved props', () => {
    const token = Symbol('run');
    const api = Renderer.create({
      state: {},
      resolve: (): t.ActionProbeRendererResolvedProps<Env> => ({
        env: { kind: 'demo' },
        runRequest: token,
      }),
    });

    api.push(sample);
    expect((api.items[0] as ProbeNode).props.runRequest).to.eql(token);
  });
});
