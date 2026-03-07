import { type t, Arr, Effect, Is, Obj, Rx, Signal } from './common.ts';

export const create: t.TreeSelectionCardOrchestrator.Lib['create'] = (props) => {
  const life = Rx.lifecycle(props.until);
  const fromPlaybackRefs = props.tree.fromPlaybackRefs ?? treeFromPlaybackRefs;
  let lastResponse: unknown = undefined;
  let lastFileRef: string | undefined = props.card.treeContent.ref.value;
  let lastPlaybackRef: string | undefined = props.card.treePlayback.ref.value;
  let lastPlaybackRefs = normalizeRefs(props.card.treePlayback.refs.value);
  const fileRefMirror = Effect.Causal.mirrorToken<string | undefined>();
  const playbackRefMirror = Effect.Causal.mirrorToken<string | undefined>();

  const stopSelection = props.selection.onChange((state) => {
    const ref = state.selectedRef;
    const kind = props.cardKind.value ?? 'file-content';
    if (kind === 'playback-content') {
      if (props.card.treePlayback.ref.value === ref) return;
      playbackRefMirror.mark(ref);
      lastPlaybackRef = ref;
      props.card.treePlayback.ref.value = ref;
      return;
    }
    if (props.card.treeContent.ref.value === ref) return;
    fileRefMirror.mark(ref);
    lastFileRef = ref;
    props.card.treeContent.ref.value = ref;
  });
  life.dispose$.subscribe(stopSelection);

  const stopResponse = Signal.effect(() => {
    if (life.disposed) return;
    if ((props.cardKind.value ?? 'file-content') !== 'file-content') return;
    const response = props.card.result.response.value;
    if (response === lastResponse) return;
    lastResponse = response;
    const tree = props.tree.fromResponse(response);
    if (!tree) return;
    props.selection.intent({ type: 'tree.set', tree });
  });
  life.dispose$.subscribe(stopResponse);

  const stopFileRef = Signal.effect(() => {
    if (life.disposed) return;
    if ((props.cardKind.value ?? 'file-content') !== 'file-content') return;
    const ref = props.card.treeContent.ref.value;
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
      props.selection.intent({ type: 'ref.request', ref });
    } else {
      props.selection.intent({ type: 'path.request', path: undefined });
    }
  });
  life.dispose$.subscribe(stopFileRef);

  const stopPlaybackRefs = Signal.effect(() => {
    if (life.disposed) return;
    if ((props.cardKind.value ?? 'file-content') !== 'playback-content') return;
    const refs = normalizeRefs(props.card.treePlayback.refs.value);
    if (Arr.equal(lastPlaybackRefs, refs)) return;
    lastPlaybackRefs = refs;
    const tree = fromPlaybackRefs(refs);
    if (!tree) {
      props.selection.intent({ type: 'tree.clear' });
      return;
    }
    props.selection.intent({ type: 'tree.set', tree });
  });
  life.dispose$.subscribe(stopPlaybackRefs);

  const stopPlaybackRef = Signal.effect(() => {
    if (life.disposed) return;
    if ((props.cardKind.value ?? 'file-content') !== 'playback-content') return;
    const ref = props.card.treePlayback.ref.value;
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
      props.selection.intent({ type: 'ref.request', ref });
    } else {
      props.selection.intent({ type: 'path.request', path: undefined });
    }
  });
  life.dispose$.subscribe(stopPlaybackRef);

  return life;
};

function normalizeRefs(refs?: string[]) {
  return refs?.filter((ref) => Is.str(ref) && ref.length > 0) ?? [];
}

function treeFromPlaybackRefs(refs?: string[]): t.TreeHostViewNodeList | undefined {
  const list = refs?.filter((ref) => Is.str(ref) && ref.length > 0) ?? [];
  if (list.length === 0) return undefined;
  const children: t.TreeHostViewNode[] = list.map((ref, i) => {
    const path = ['program', String(i + 1)] as t.ObjectPath;
    return {
      path,
      key: Obj.Path.encode(path),
      label: `${i + 1}. ${ref}`,
      value: { slug: ref, ref },
    };
  });
  const rootPath = ['program'] as t.ObjectPath;
  return [
    {
      path: rootPath,
      key: Obj.Path.encode(rootPath),
      label: 'program',
      value: { slug: 'program' },
      children,
    },
  ];
}
