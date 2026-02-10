import { TreeContentDriver } from '../mod.ts';
import { type t, Is, Signal } from './common.ts';
import { resolveLoader, treeFromResponse } from './-u.data-card.loaders.ts';

type DataCardSignals = t.DataCardSignals;
type PropsSignals = {
  readonly origin: t.Signal<t.SlugUrlOrigin | undefined>;
  readonly cardKind: t.Signal<t.DataCardKind | undefined>;
};

export type SpecOrchestrator = t.TreeContentDriver.Orchestrator;

export function createOrchestrator(args: {
  props: PropsSignals;
  card: DataCardSignals;
}): SpecOrchestrator {
  const card = args.card.props;
  let lastResponse: unknown = undefined;
  let lastFileRef: string | undefined = card.treeContent.ref.value;
  let lastPlaybackRef: string | undefined = card.treePlayback.ref.value;
  let lastPlaybackRefs: string[] | undefined = card.treePlayback.refs.value;
  const fileRefMirror = createMirrorToken<string | undefined>();
  const playbackRefMirror = createMirrorToken<string | undefined>();

  const orchestrator = TreeContentDriver.createOrchestrator({
    load: (input) =>
      resolveLoader({
        kind: args.props.cardKind.value ?? 'file-content',
        origin: args.props.origin.value,
      })(input),
    onSelectedRefChange(ref) {
      const kind = args.props.cardKind.value ?? 'file-content';
      if (kind === 'playback-content') {
        if (card.treePlayback.ref.value === ref) return;
        playbackRefMirror.mark(ref);
        lastPlaybackRef = ref;
        card.treePlayback.ref.value = ref;
        return;
      }
      if (card.treeContent.ref.value === ref) return;
      fileRefMirror.mark(ref);
      lastFileRef = ref;
      card.treeContent.ref.value = ref;
    },
  });

  Signal.effect(() => {
    if (orchestrator.disposed) return;
    const response = card.result.response.value;
    if (response === lastResponse) return;
    lastResponse = response;
    const tree = treeFromResponse(response);
    if (!tree) return;
    orchestrator.intent({ type: 'tree.set', tree });
    orchestrator.intent({ type: 'path.request', path: undefined });
    card.treeContent.ref.value = undefined;
    lastFileRef = undefined;
  });

  Signal.effect(() => {
    if (orchestrator.disposed) return;
    if (args.props.cardKind.value !== 'file-content') return;
    if (card.spinning.value) return;
    const ref = card.treeContent.ref.value;
    if (ref === lastFileRef) {
      fileRefMirror.consume(ref);
      return;
    }
    if (fileRefMirror.consume(ref)) {
      lastFileRef = ref;
      return;
    }
    lastFileRef = ref;
    if (Is.str(ref) && ref.length > 0) {
      orchestrator.intent({ type: 'ref.request', ref });
    } else {
      orchestrator.intent({ type: 'path.request', path: undefined });
    }
  });

  Signal.effect(() => {
    if (orchestrator.disposed) return;
    if (args.props.cardKind.value !== 'playback-content') return;
    const refs = card.treePlayback.refs.value;
    if (refs === lastPlaybackRefs) return;
    lastPlaybackRefs = refs;

    const tree = treeFromPlaybackRefs(refs);
    if (!tree) {
      orchestrator.intent({ type: 'tree.clear' });
      return;
    }
    orchestrator.intent({ type: 'tree.set', tree });
    orchestrator.intent({ type: 'path.request', path: undefined });
  });

  Signal.effect(() => {
    if (orchestrator.disposed) return;
    if (args.props.cardKind.value !== 'playback-content') return;
    if (card.spinning.value) return;
    const ref = card.treePlayback.ref.value;
    if (ref === lastPlaybackRef) {
      playbackRefMirror.consume(ref);
      return;
    }
    if (playbackRefMirror.consume(ref)) {
      lastPlaybackRef = ref;
      return;
    }
    lastPlaybackRef = ref;
    if (Is.str(ref) && ref.length > 0) {
      orchestrator.intent({ type: 'ref.request', ref });
    } else {
      orchestrator.intent({ type: 'path.request', path: undefined });
    }
  });

  return orchestrator;
}

function treeFromPlaybackRefs(refs?: string[]): t.TreeHostViewNodeList | undefined {
  const list = refs?.filter((ref) => Is.str(ref) && ref.length > 0) ?? [];
  if (list.length === 0) return undefined;
  const children: t.TreeHostViewNode[] = list.map((ref, i) => ({
    path: ['program', String(i + 1)],
    key: `program/${i + 1}`,
    label: `${i + 1}. ${ref}`,
    value: { slug: ref, ref },
  }));
  return [
    {
      path: ['program'],
      key: 'program',
      label: 'program',
      value: { slug: 'program' },
      children,
    },
  ];
}

const NONE = Symbol('none');
type Token<T> = { mark(value: T): void; consume(value: T): boolean };

function createMirrorToken<T>(): Token<T> {
  let token: T | typeof NONE = NONE;
  return {
    mark(value) {
      token = value;
    },
    consume(value) {
      if (token === NONE) return false;
      if (!Object.is(token, value)) return false;
      token = NONE;
      return true;
    },
  };
}
